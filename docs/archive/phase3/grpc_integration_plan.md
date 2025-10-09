# Phase 3: gRPC 통합 계획 (대안)

## 1. 배경 및 필요성

기존 FastAPI 백엔드와 React 프론트엔드 간의 실시간 통신은 WebSocket을 기반으로 설계되었습니다. 그러나 `uvicorn`과 `websockets` 라이브러리 간의 지속적인 의존성 충돌 문제로 인해 WebSocket 구현을 정상적으로 작동시키는 데 어려움을 겪고 있습니다.

이에 따라, 안정적이고 효율적인 실시간 통신 채널을 확보하고 향후 확장성을 고려하여 gRPC로의 전환을 제안합니다. gRPC는 HTTP/2 기반의 프로토콜 버퍼를 사용하여 높은 성능과 강력한 타입 검증을 제공하며, 다양한 언어 환경에서 일관된 인터페이스를 유지할 수 있습니다.

## 2. 목표

*   기존 WebSocket 기반의 실시간 게임 상태 및 학습 메트릭 전송 기능을 gRPC 스트리밍으로 대체합니다.
*   백엔드와 프론트엔드 간의 통신에서 의존성 문제를 해결하고 안정성을 확보합니다.
*   Protocol Buffers를 통해 데이터 모델의 명확성과 타입 안전성을 강화합니다.

## 3. gRPC 구현 단계

### 3.1. Protocol Buffer (`.proto`) 파일 정의

*   `GameStateDTO` 및 `TrainingMetricsDTO`에 해당하는 데이터 구조를 `.proto` 파일로 정의합니다.
*   스트리밍 서비스를 위한 gRPC 서비스 인터페이스를 정의합니다.
*   **예상 파일**: `backend/proto/game.proto`, `backend/proto/training.proto`

### 3.2. gRPC 서비스 코드 생성

*   정의된 `.proto` 파일을 기반으로 `protoc` 컴파일러를 사용하여 Python(백엔드) 및 TypeScript(프론트엔드)용 gRPC 서비스 코드를 생성합니다.
*   **필요 도구**: `grpcio-tools` (Python), `grpc-tools` (Node.js)

### 3.3. 백엔드 gRPC 서버 구현

*   Python `grpcio` 라이브러리를 사용하여 gRPC 서버를 구축합니다.
*   `GameRunner` 및 `TrainingManager`에서 생성되는 실시간 데이터를 gRPC 스트리밍 응답으로 변환하여 클라이언트에 전송하는 로직을 구현합니다.
*   기존 FastAPI의 WebSocket 엔드포인트(`main.py`, `websockets/handlers.py`)를 gRPC 서버 로직으로 대체하거나, gRPC 서버를 별도로 실행하고 FastAPI는 REST API만 담당하도록 분리합니다.
*   **주요 수정 파일**: `backend/main.py`, `backend/core/game_runner.py`, `backend/core/training_manager.py`, `backend/websockets/handlers.py` (제거 또는 수정)

### 3.4. 프론트엔드 gRPC 클라이언트 구현

*   `grpc-web` 라이브러리를 사용하여 프론트엔드에서 gRPC 서버에 연결합니다.
*   `HUD.tsx` 컴포넌트를 수정하여 gRPC 서버로부터 게임 상태 스트림을 수신하고 UI를 업데이트합니다.
*   `TrainingMode.tsx` 컴포넌트를 수정하여 gRPC 서버로부터 학습 메트릭 스트림을 수신하고 UI를 업데이트합니다.
*   **주요 수정 파일**: `arcade-clash/components/HUD.tsx`, `arcade-clash/components/TrainingMode.tsx`

## 4. 의존성 추가

*   **백엔드**: `grpcio`, `grpcio-tools`
*   **프론트엔드**: `grpc-web`, `grpc-tools`

## 5. 향후 고려사항

*   gRPC는 HTTP/2를 사용하므로, 프론트엔드에서 gRPC-Web 프록시(예: Envoy) 또는 gRPC-Web 클라이언트 라이브러리를 사용하여 브라우저 호환성을 확보해야 합니다.
*   기존 REST API는 FastAPI를 통해 유지하고, 실시간 통신만 gRPC로 전환하는 하이브리드 아키텍처를 고려합니다.
