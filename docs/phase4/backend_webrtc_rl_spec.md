# 백엔드 RL-WebRTC 연동 상세 명세

## 1. 목표

Python으로 구현된 강화학습 환경(`FightingEnv`)이 WebRTC를 통해 브라우저의 게임 클라이언트와 실시간으로 통신할 수 있도록 백엔드 시스템을 구축한다. 동기적으로 동작하는 Stable-Baselines3와 비동기 라이브러리 `aiortc`를 안정적으로 연동하는 것을 핵심 과제로 삼는다.

## 2. 필요 라이브러리 (Dependencies)

`requirements.txt`에 다음 라이브러리를 추가해야 한다.

*   `aiortc`: Python용 WebRTC 라이브러리.
*   `aiohttp`: `aiortc`가 시그널링 서버와 통신하기 위해 필요한 비동기 HTTP 클라이언트 라이브러리.
*   `peerjs-python`: PeerJS 서버와 호환되는 시그널링을 위한 라이브러리 (또는 직접 HTTP 요청 구현).

## 3. 파일 및 폴더 구조

`src/` 디렉토리 내의 주요 변경 및 추가 파일은 다음과 같다.

```
src/
├── fighting_env.py     # (수정) WebRTC 통신 로직으로 내부 구현 변경
├── webrtc_client.py    # (신규) aiortc 및 시그널링 로직 캡슐화
├── train_rl_agent.py   # (수정) WebRTC 연동 FightingEnv 사용
└── ...
```

## 4. 핵심 과제: 동기(Sync)와 비동기(Async) 연동

-   **문제**: `Stable-Baselines3`는 `env.step()`을 호출하고 즉시 반환값을 기대하는 **동기** 방식인 반면, `aiortc`를 사용한 네트워크 통신은 **비동기**(`async/await`) 방식으로 동작한다.
-   **해결책**: 별도의 **스레드**를 사용하여 `aiortc`의 `asyncio` 이벤트 루프를 실행하고, 메인 스레드(RL 학습)와는 **Thread-safe Queue** (`queue.Queue`)를 통해 데이터를 주고받는다.

```
+---------------------------------+      +--------------------------------+
|      Main Thread (Sync)         |      |      WebRTC Thread (Async)     |
|---------------------------------|      |--------------------------------|
|        train_rl_agent.py        |      |        webrtc_client.py        |
|                                 |      |                                |
|  FightingEnv.step(action)       |      |                                |
|   1. action_queue.put(action)   |----->|  action = await action_queue_async.get() |
|                                 |      |  (send action to frontend)     |
|   2. (blocks)                   |      |                                |
|      result = result_queue.get()|      |  (receive result from frontend)|
|   <----|  result_queue_async.put(result)  |
|   3. return result              |      |                                |
+---------------------------------+      +--------------------------------+
```

## 5. 신규/수정 파일 명세

### 5.1. `webrtc_client.py` (신규)

*   **역할**: `aiortc`를 사용한 WebRTC 연결 및 데이터 교환의 복잡한 비동기 로직을 캡슐화한다.
*   **클래스: `WebRTCClient`**
    *   **`__init__(self, action_queue, result_queue)`**: 메인 스레드와 통신할 큐를 받아서 초기화한다.
    *   **`run(self)`**: `asyncio.run()`을 호출하여 비동기 이벤트 루프를 시작하는 **스레드의 진입점**.
    *   **`async connect(self, peer_id)`**: PeerJS 시그널링 서버에 연결하고 프론트엔드와 데이터 채널을 설정하는 비동기 메서드.
    *   **`async message_handler(self)`**: 데이터 채널에서 메시지를 수신하면 `result_queue`에 넣는다.
    *   **`async action_sender(self)`**: `action_queue`에 데이터가 들어오면 꺼내서 프론트엔드로 전송한다.

### 5.2. `fighting_env.py` (수정)

*   **역할**: OpenAI Gym 인터페이스를 유지하되, 내부적으로 `WebRTCClient`와 큐를 통해 프론트엔드와 통신하도록 변경한다.
*   **클래스: `FightingEnv`**
    *   **`__init__(self)`**:
        1.  `action_queue = queue.Queue()` 와 `result_queue = queue.Queue()` 를 생성한다.
        2.  `WebRTCClient` 인스턴스를 생성하고, 이 큐들을 전달한다.
        3.  `threading.Thread`를 생성하여 `webrtc_client.run`을 타겟으로 지정하고 스레드를 시작한다.
        4.  연결이 완료되었다는 신호가 `result_queue`에 들어올 때까지 대기한다.
    *   **`step(self, action)`**:
        1.  `self.action_queue.put({"type": "action", "action": action})`으로 액션을 큐에 넣는다.
        2.  `result = self.result_queue.get()`으로 결과가 올 때까지 **블로킹 대기**한다.
        3.  수신한 `result`를 파싱하여 `(observation, reward, done, info)` 튜플로 반환한다.
    *   **`reset(self)`**:
        1.  `self.action_queue.put({"type": "reset"})`으로 리셋 명령을 큐에 넣는다.
        2.  `result = self.result_queue.get()`으로 초기 상태가 올 때까지 **블로킹 대기**한다.
        3.  수신한 `result`에서 `observation`을 추출하여 반환한다.
    *   **`close(self)`**: WebRTC 스레드를 종료하고 리소스를 정리하는 명령을 큐에 넣는다.

### 5.3. `train_rl_agent.py` (수정)

*   **역할**: 수정된 `FightingEnv`를 사용하여 RL 모델을 학습시킨다.
*   **주요 로직**:
    *   `FightingEnv`를 임포트하여 인스턴스화한다. `__init__` 과정에서 WebRTC 연결이 완료될 때까지 자동으로 대기하므로, 별도의 대기 로직은 필요 없다.
    *   기존과 동일하게 `model.learn(total_timesteps=...)`을 호출하여 학습을 시작한다.

이 명세를 통해 백엔드의 복잡한 동기/비동기 문제를 해결하고, 프론트엔드와 안정적으로 연동되는 강화학습 환경을 구축할 수 있다.
