# Phase 7: Step 1 - Simulation Arena 고도화 (Advanced Simulation Environment)

## 1. 목표
RL 에이전트가 실제와 유사한 불안정한 환경에서 플레이하도록 '인간적 실수 레이어'와 '네트워크 시뮬레이션' 모듈을 구현하고 기존 게임 환경에 통합합니다.

## 2. 상세 계획

### 2.1. Human Error Layer 구현
*   **`config.yaml`에 인간적 실수 관련 파라미터 정의:** `reaction_time_mean`, `reaction_time_std` (입력 지연), `mistake_probability` (입력 오타), `drop_probability` (입력 누락).
*   **모듈 개발:** AI 에이전트의 `Action` 객체를 입력받아 설정된 확률에 따라 입력 지연, 오타, 누락을 주입하여 변조된 액션을 반환하는 모듈 (`human_error_layer.py` 등) 개발.
*   **인터페이스 구현:** 변조된 액션을 게임 엔진으로 전달하는 인터페이스를 `Simulation Arena` 내에 구현.

### 2.2. Network Simulation 구현
*   **`config.yaml`에 네트워크 지연(Latency) 및 패킷 손실(Packet Loss) 관련 파라미터 정의.**
*   **모듈 개발:** `asyncio` 등을 활용하여 변조된 액션에 가변적인 네트워크 지연 및 패킷 손실을 시뮬레이션하는 모듈 (`network_simulator.py` 등) 개발.
*   **통신 방식 고려:** `WebRTC Data Channels (via PeerJS)` 또는 `Python Subprocess`를 통해 게임 엔진과 통신하는 방식 중 프로젝트에 적합한 방식 선택 및 구현.

### 2.3. Simulation Arena 통합
*   `Human Error Layer`와 `Network Simulation` 모듈을 `Simulation Arena` (게임 환경)에 통합하여, RL 에이전트가 실제와 유사한 불안정한 환경에서 플레이하도록 구성.

## 3. Definition of Done (DoD)
*   `config.yaml`에 인간적 실수 및 네트워크 시뮬레이션 관련 모든 파라미터가 정의되었음.
*   `Human Error Layer` 모듈이 개발되었고, 설정된 확률에 따라 입력 지연, 오타, 누락을 정확히 주입하는 것을 단위 테스트로 검증했음.
*   `Network Simulation` 모듈이 개발되었고, 설정된 지연 및 패킷 손실을 시뮬레이션하는 것을 단위 테스트로 검증했음.
*   `Human Error Layer`와 `Network Simulation` 모듈이 `Simulation Arena`에 성공적으로 통합되었고, RL 에이전트가 이 환경에서 플레이할 때 의도된 불안정성이 적용되는 것을 확인했음.
*   통신 방식(WebRTC 또는 Subprocess)이 결정되고 구현되었음.