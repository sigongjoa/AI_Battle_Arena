# Phase 4: E2E 테스트 문제 해결 요약

이 문서는 Phase 4의 WebRTC 기반 강화학습 환경 구축 과정에서 발생했던 주요 E2E 테스트 문제들과 그 해결 과정을 기록한다.

## 1. 초기 연결 실패 (ConnectionRefusedError)

- **증상**: `run_e2e_test.py` 실행 시, `aiohttp.client_exceptions.ClientConnectorError: ... Connection refused` 오류가 발생하며 백엔드 시그널링 서버에 접속하지 못함.
- **원인**: 테스트 스크립트 실행 전에 `uvicorn`을 사용한 백엔드 서버가 실행되지 않았기 때문.
- **해결**: 테스트 전, 별도의 터미널에서 백엔드 서버를 먼저 실행하도록 안내하여 해결.

## 2. 데이터 채널 즉시 종료 (Data Channel Closed)

- **증상**: 브라우저 콘솔에서 데이터 채널이 `open` 되자마자 `closed` 되는 현상 발생.
- **원인**: 백엔드의 `WebRTCClient`를 실행하는 스레드가 WebRTC 핸드셰이크(Offer/Answer 교환)만 완료하면 자기 역할을 다했다고 착각하고 **조기에 종료**되는 문제. 이로 인해 WebRTC 연결 자체가 끊어져 데이터 채널이 닫힘.
- **해결**: `WebRTCClient.run` 메소드의 이벤트 루프 관리 방식을 `run_until_complete`에서 `run_forever`로 변경. `FightingEnv.close`가 호출될 때 명시적으로 `loop.stop()`을 호출하여 스레드를 안전하게 종료하도록 아키텍처를 수정하여 해결.

## 3. 응답 타임아웃 (Timeout: Did not receive reset_result)

### 3.1. 원인 분석 과정

데이터 채널이 안정적으로 열려있음에도 불구하고, 백엔드가 프론트엔드로부터 응답을 받지 못하는 타임아웃 문제가 지속적으로 발생했다. 상세 로깅을 통해 다음과 같은 사실을 파악했다.

1.  백엔드 `FightingEnv`는 `reset` 명령을 `action_queue`에 정상적으로 넣고 있었다.
2.  하지만, 백엔드 `WebRTCClient`의 `_action_sender`가 `action_queue`에서 해당 명령을 꺼내 프론트엔드로 전송하는 로그(`Sending action...`)가 전혀 나타나지 않았다.
3.  이는 `_action_sender` 내부의 로직이 알 수 없는 이유로 멈춰있다는 것을 의미했다.

### 3.2. 진짜 근본 원인: 레이스 컨디션 (Race Condition)

- **증상**: `_action_sender`가 시작조차 하지 않아 메시지 전송이 발생하지 않음.
- **원인**: `aiortc` 라이브러리의 동작 방식으로 인해, 데이터 채널이 생성될 때 채널이 `open` 상태로 전환되는 이벤트가 발생한다. 하지만 프론트엔드와의 통신이 너무 빨라, 백엔드가 "채널이 열리면 `_action_sender`를 실행해줘" 라고 **이벤트 리스너를 등록하기 전에 이미 채널이 `open` 상태가 되어버리는 레이스 컨디션**이 발생했다. 백엔드는 이미 지나가 버린 이벤트를 기다리느라 `_action_sender`를 영원히 시작시키지 못했다.
- **해결**: `_setup_channel_events` 메소드에서 `on('open')` 이벤트 리스너를 등록하는 것과 동시에, **현재 데이터 채널의 상태(`readyState`)를 직접 확인**하는 코드를 추가했다. 만약 채널이 이미 `open` 상태라면, 이벤트를 기다리지 않고 즉시 `_action_sender`를 시작하도록 하여 레이스 컨디션을 원천적으로 해결했다.

## 4. 부수적 오류

- **증상**: 디버깅 과정에서 `SyntaxError`, `IndentationError` 등 다수의 문법 오류 발생.
- **원인**: 원격에서 코드를 수정하며 `replace` 도구를 사용할 때, 교체되는 코드의 줄바꿈이나 주변 코드와의 맥락을 정확히 맞추지 못해 파일 구조가 깨짐.
- **해결**: 오류 발생 시, 파일 전체를 다시 읽어 정확한 구조를 파악한 후 수정하는 방식으로 해결.
