# 강화학습 over WebRTC 구현 계획서

## 1. 프로젝트 목표

기존의 로컬 Pygame 기반 강화학습 환경을 WebRTC 기반으로 전환하여, 브라우저에서 실행되는 게임 클라이언트(`arcade-clash`)와 파이썬 백엔드의 강화학습 에이전트가 실시간으로 상호작용하며 학습을 수행할 수 있는 시스템을 구축한다.

## 2. 시스템 아키텍처

WebRTC 데이터 채널을 통해 프론트엔드 게임과 백엔드 RL 에이전트가 통신하는 구조이다.

```
+-----------------------------+      WebRTC Data Channel      +---------------------------------+
|      Frontend (Browser)     |  <------------------------>   |         Backend (Python)        |
|                             |                               |                                 |
|  +-----------------------+  |      (Action, Reset)          |  +---------------------------+  |
|  |     Arcade Clash      |  |  -------------------------->  |  |      FightingEnv (Gym)    |  |
|  |      (Game Logic)     |  |                               |  | (WebRTC Client)           |  |
|  +-----------------------+  |      (Observation, Reward, Done) |  +-------------+-------------+  |
|              ^              |  <--------------------------  |                |                |
|              |              |                               |  +-------------v-------------+  |
|  +-----------------------+  |                               |  |   Stable-Baselines3 Agent   |  |
|  |   WebRTC Signaling    |  |                               |  |          (PPO)            |  |
|  | (PeerJS for signaling)|  |                               |  +---------------------------+  |
|  +-----------------------+  |                               |                                 |
+-----------------------------+                               +---------------------------------+
```

*   **Backend (Python)**: `FightingEnv`는 RL 에이전트의 `step`, `reset` 요청을 받아 WebRTC를 통해 Frontend로 전달한다.
*   **Frontend (Browser)**: 게임 엔진은 Backend로부터 받은 `action`을 수행하고, 결과(다음 상태, 보상 등)를 다시 Backend로 전송한다.
*   **Signaling Server**: PeerJS 서버는 두 Peer(Backend, Frontend) 간의 WebRTC 연결 설정을 중개한다.

## 3. 데이터 프로토콜 (JSON)

WebRTC 데이터 채널을 통해 교환될 메시지 형식은 JSON으로 통일한다.

**Backend -> Frontend**

*   **Action 수행**: `{ "type": "action", "action": <action_value> }`
*   **환경 리셋**: `{ "type": "reset" }`

**Frontend -> Backend**

*   **Step 결과**: `{ "type": "step_result", "observation": <obs_data>, "reward": <reward_value>, "done": <is_done> }`
*   **Reset 결과**: `{ "type": "reset_result", "observation": <initial_obs_data> }`

## 4. 단계별 구현 계획

### Phase 1: Frontend (`arcade-clash`) 수정

1.  **WebRTC 통신 모듈 생성**:
    *   기존 `webrtc/client.ts`를 확장하거나 새로운 모듈을 생성하여, 백엔드와의 데이터 채널 통신을 전담하는 클래스를 구현한다.
    *   이 클래스는 `send(data)` 메서드와 `onMessage(callback)` 이벤트 핸들러를 제공해야 한다.

2.  **게임 루프 수정**:
    *   `App.tsx` 또는 `GameScreen.tsx`의 메인 게임 루프를 수정한다.
    *   기존의 키보드 입력 대신, WebRTC를 통해 수신된 `action` 메시지에 따라 플레이어를 조작하도록 변경한다.
    *   `step`이 완료된 후, 게임 상태(`observation`), 보상(`reward`), 종료 여부(`done`)를 계산하여 WebRTC를 통해 백엔드로 전송하는 로직을 추가한다.
    *   `reset` 메시지를 수신하면 게임 상태를 초기화하고, 초기 `observation` 값을 백엔드로 전송한다.

### Phase 2: Backend (`FightingEnv`) 수정

1.  **WebRTC 통신 클라이언트 구현**:
    *   Python용 WebRTC 라이브러리(예: `aiortc`)를 사용하여 PeerJS 시그널링 서버에 연결하고 프론트엔드와 데이터 채널을 설정하는 클라이언트를 구현한다. 이 로직은 `FightingEnv` 클래스 내에 통합되거나 별도의 헬퍼 클래스로 분리될 수 있다.

2.  **`FightingEnv` 내부 로직 변경**:
    *   `__init__`: 초기화 시 WebRTC 클라이언트를 생성하고 프론트엔드와의 연결을 설정한다. 연결이 완료될 때까지 대기해야 할 수 있다.
    *   `step(action)`:
        *   `action` 값을 JSON 형식으로 만들어 WebRTC 데이터 채널로 전송한다. (`{ "type": "action", ... }`)
        *   프론트엔드로부터 `step_result` 메시지가 도착할 때까지 비동기적으로 대기한다.
        *   수신된 메시지에서 `observation`, `reward`, `done`을 추출하여 반환한다.
    *   `reset()`:
        *   `reset` 요청 JSON을 WebRTC 데이터 채널로 전송한다. (`{ "type": "reset" }`)
        *   프론트엔드로부터 `reset_result` 메시지가 도착할 때까지 비동기적으로 대기한다.
        *   수신된 메시지에서 초기 `observation`을 추출하여 반환한다.

### Phase 3: 통합 및 학습 스크립트 수정

1.  **`train_rl_agent.py` 수정**:
    *   수정된 `FightingEnv`를 사용하도록 임포트 구문을 업데이트한다.
    *   `FightingEnv` 초기화 시 WebRTC 연결이 비동기적으로 설정될 수 있으므로, 학습 시작 전에 연결이 완료되었는지 확인하는 로직이 필요할 수 있다.
    *   네트워크 지연으로 인해 `step` 시간이 길어질 수 있음을 감안하여, 타임아웃 관련 설정을 검토한다.

## 5. 테스트 및 검증 계획

1.  **단위 테스트**:
    *   **Frontend**: WebRTC 모듈이 메시지를 올바르게 송수신하는지 모의(mock) 테스트를 진행한다.
    *   **Backend**: `FightingEnv`가 WebRTC 클라이언트를 통해 메시지를 올바르게 전송하고, 수신된 메시지를 정확히 파싱하는지 테스트한다.

2.  **통합 테스트**:
    *   간단한 '핑퐁' 테스트: 백엔드에서 "ping"을 보내면 프론트엔드가 "pong"을 응답하는지 확인하여 데이터 채널의 양방향 통신을 검증한다.
    *   `RandomAgent` 테스트: RL 에이전트 대신 무작위 행동을 전송하는 간단한 스크립트를 작성하여, 전체 `reset -> step -> ... -> done` 사이클이 네트워크를 통해 정상적으로 동작하는지 엔드투엔드로 확인한다.

3.  **학습 검증**:
    *   `train_rl_agent.py`를 실행하고, TensorBoard를 통해 보상 곡선이 점진적으로 상승하는지 모니터링하여 실제 학습이 진행되는지 확인한다.
