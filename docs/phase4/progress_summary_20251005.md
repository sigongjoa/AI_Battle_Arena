# Phase 4 진행 상황 요약 (2025년 10월 5일)

## 1. 단위 테스트 (`tests/test_fighting_env.py`)

### 1.1 초기 문제 및 해결
*   **문제 1: `ModuleNotFoundError: No module named 'src'`**
    *   **원인:** `pytest` 실행 시 `src/` 모듈 경로를 찾지 못함.
    *   **해결:** `python -m pytest tests/` 명령 사용으로 해결.
*   **문제 2: `ModuleNotFoundError: No module named 'aiortc'` (반복 발생)**
    *   **원인:** `aiortc` 라이브러리가 Python 환경에 설치되지 않음. 특히 `(venv) (base)`와 같은 환경 혼란이 주된 원인으로 추정됨.
    *   **해결:** 사용자님의 `venv` 환경 활성화 및 `pip install -r backend/requirements.txt`, `pip install pytest`를 통한 의존성 재설치로 해결.
*   **문제 3: `TypeError: __init__() missing 1 required positional argument: 'backend_peer_id'`**
    *   **원인:** `FightingEnv` 생성자에 `backend_peer_id` 인자가 추가되었으나, 테스트 픽스처에서 이를 전달하지 않음.
    *   **해결:** `tests/test_fighting_env.py`의 `fighting_env` 픽스처에서 `FightingEnv(backend_peer_id="test_peer_id")`로 수정.
*   **문제 4: `FightingEnv` 단위 테스트 타임아웃/대기 (WebRTC 연결 시도)**
    *   **원인:** `FightingEnv`가 실제 WebRTC 연결을 시도하며 프론트엔드 연결을 기다림.
    *   **해결:**
        *   `src/webrtc_client.py`에 `test_mode` 인자 추가. `test_mode=True`일 경우 실제 WebRTC 연결 대신 `connection_ready`, `reset_result`, `step_result` 메시지를 시뮬레이션하도록 구현.
        *   `src/fighting_env.py`의 `FightingEnv.__init__`에 `test_mode` 인자를 추가하고 `WebRTCClient`에 전달하도록 수정.
        *   `tests/test_fighting_env.py`의 `fighting_env` 픽스처에서 `FightingEnv(backend_peer_id="test_peer_id", test_mode=True)`로 초기화하도록 수정.
*   **문제 5: `IndentationError` 및 잘못된 테스트 구조/어설션**
    *   **원인:** `tests/test_fighting_env.py` 내의 들여쓰기 오류 및 `FightingEnv`의 내부 속성(`player_agent`, `opponent_player` 등)에 직접 접근하는 어설션 문제.
    *   **해결:**
        *   `test_env_init` 함수의 들여쓰기 및 `obs_high` 어설션 수정.
        *   `test_env_reset`, `test_env_step_idle_action`, `test_env_step_attack_action`, `test_env_step_ko_victory`, `test_env_step_ko_defeat` 테스트 함수들을 `FightingEnv`의 공용 API(reset, step 반환 값)에만 의존하도록 재구조화 및 어설션 간소화.
*   **결과:** `tests/test_fighting_env.py` 및 `tests/test_game.py`의 모든 단위 테스트가 **성공적으로 통과**했습니다.

## 2. E2E 테스트 (`run_e2e_test.py`)

### 2.1 초기 문제 및 해결
*   **문제 1: `ModuleNotFoundError: No module named 'aiortc'`**
    *   **원인:** `run_e2e_test.py` 실행 시 `venv` Python 인터프리터가 아닌 다른 환경의 인터프리터 사용.
    *   **해결:** `venv/bin/python run_e2e_test.py`로 `venv` 인터프리터를 명시적으로 지정하여 실행.
*   **문제 2: `AttributeError: 'NoneType' object has no attribute 'run_until_complete'`**
    *   **원인:** `WebRTCClient.run` 메서드가 별도의 스레드에서 실행될 때, `asyncio` 이벤트 루프가 해당 스레드에 올바르게 생성되지 않음.
    *   **해결:** `src/webrtc_client.py`에서 `self.loop = asyncio.new_event_loop()`를 `WebRTCClient.__init__`에서 `WebRTCClient.run` 메서드 내부로 이동시켜, 이벤트 루프가 올바른 스레드에서 생성되도록 수정.
*   **문제 3: `AttributeError: 'WebRTCClient' object has no attribute '_run_async'`**
    *   **원인:** `WebRTCClient.run`에서 존재하지 않는 `_run_async` 메서드를 호출. 실제 연결 로직은 `connect` 메서드에 있었음.
    *   **해결:** `src/webrtc_client.py`에서 `WebRTCClient.run` 내의 메서드 호출을 `self.loop.run_until_complete(self.connect())`로 수정.
*   **문제 4: `Frontend connection timed out.` (반복 발생)**
    *   **원인:** 프론트엔드 (`arcade-clash/App.tsx`)가 `rl_training` 모드에서 `SignalingClient` 및 `WebRtcClient` 연결을 시작하지 않음.
    *   **해결:** `arcade-clash/App.tsx`의 `useEffect` 훅에서 `gameMode === 'rl_training'` 조건으로 인해 시그널링 클라이언트 초기화가 건너뛰어지는 로직을 제거. 또한 `rl_training` 모드일 때 `WebRtcClient`를 초기화하고 `start()` 메서드를 호출하도록 로직 추가.
*   **현재 상태:** E2E 테스트는 여전히 `Frontend connection timed out.`으로 실패하고 있습니다. 이는 프론트엔드 코드 변경 후 재빌드가 필요하며, `run_e2e_test.py` 스크립트 재시작 및 브라우저 탐색이 적절한 타이밍에 이루어져야 하기 때문입니다.

### 2.2 E2E 테스트 디버깅 (현재 상황)

*   **문제 1: `App.tsx:164 Uncaught TypeError: webRtcClient.current.start is not a function`**
    *   **원인:** 프론트엔드 (`arcade-clash`)가 `WebRtcClient`에 추가된 `start` 메서드를 인식하지 못함. 이는 `npm run dev`가 변경 사항을 제대로 반영하지 못했거나 캐싱 문제일 가능성이 높음.
*   **문제 2: PeerJS 서버 연결 거부 (`Failed to load resource: net::ERR_CONNECTION_REFUSED` for `:9000/myapp/peerjs/id?ts=...`)**
    *   **원인:** PeerJS 서버 (`backend/peerjs_server.js`)가 실행 중이 아니거나 `localhost:9000`에서 접근할 수 없음.
*   **문제 3: 백엔드 시그널링 서버 연결 거부 (`WebSocket connection to 'ws://localhost:8001/ws' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED`)**
    *   **원인:** `arcade-clash/App.tsx`의 `SIGNALING_SERVER_URL`을 `ws://localhost:8001/ws`로 수정했음에도 불구하고 연결이 거부됨. 백엔드 `uvicorn` 서버가 실행 중이 아니거나, 방화벽 문제, 또는 서버 설정 문제일 수 있음.

### 2.3 제안된 해결책

*   **프론트엔드 개발 서버 재시작:** `npm run dev` 프로세스를 재시작하여 모든 프론트엔드 변경 사항이 반영되도록 합니다.
*   **PeerJS 서버 시작:** 별도의 터미널에서 `node backend/peerjs_server.js`를 실행하여 PeerJS 서버를 시작합니다.
*   **백엔드 시그널링 서버 상태 확인:** `uvicorn` 서버의 터미널을 확인하여 WebSocket 연결과 관련된 오류 메시지가 있는지 확인합니다.