# PeerJS 통합 제안

## 1. 배경 및 문제점

현재 WebRTC P2P 연결을 위해 `simple-peer` 라이브러리를 사용하고 있으나, 브라우저 환경에서 `process.nextTick is not a function` 및 `Cannot read properties of undefined (reading 'reading')`와 같은 호환성 문제로 인해 연결 설정에 실패하고 있습니다. Node.js 전역 폴리필 및 `Buffer` 폴리필을 시도했음에도 불구하고 문제가 해결되지 않아, `simple-peer` 라이브러리 자체의 내부적인 문제로 판단됩니다.

시그널링 서버와의 통신 프로토콜 자체는 정상적으로 작동하고 있음을 확인했습니다. 문제는 WebRTC 피어 연결을 설정하는 클라이언트 측 라이브러리에서 발생하고 있습니다.

## 2. PeerJS로의 전환 제안

`simple-peer`의 대안으로 `PeerJS` 라이브러리로의 전환을 제안합니다. `PeerJS`는 WebRTC P2P 연결을 위한 또 다른 인기 있는 추상화 라이브러리로, 다음과 같은 장점이 있습니다.

*   **높은 수준의 추상화:** `simple-peer`보다 더 높은 수준의 추상화를 제공하여 WebRTC 연결 설정 및 관리를 용이하게 합니다.
*   **내장 시그널링 기능:** 자체 시그널링 서버(PeerServer)와 클라이언트 라이브러리를 제공하여 원활한 연동을 지원합니다. (기존 시그널링 서버와의 통합 방안 모색 필요)
*   **활발한 개발 및 커뮤니티:** 활발한 커뮤니티와 지속적인 유지보수를 통해 더 나은 지원과 적은 버그를 기대할 수 있습니다.
*   **브라우저 호환성:** 브라우저 환경에서 널리 사용되므로, 현재 겪고 있는 호환성 문제를 피할 수 있을 것으로 예상됩니다.

## 3. PeerJS 통합 계획

### 3.1. 코드 변경 (Frontend: `arcade-clash/src/webrtc/client.ts` 및 관련 파일)

*   **`simple-peer` 제거 및 `peerjs` 설치:**
    *   `npm uninstall simple-peer @types/simple-peer`
    *   `npm install peerjs@^1.5.4`
*   **`client.ts` 수정:**
    *   `simple-peer` 대신 `peerjs`에서 `Peer`를 임포트합니다.
    *   `WebRtcClient` 생성자를 `PeerJS` API를 사용하도록 수정합니다.
        *   `PeerJS` `Peer` 생성자는 ID와 PeerServer 연결 옵션을 받습니다.
        *   기존 시그널링 서버와의 통합 방안을 고려하여 `PeerJS` 설정을 조정합니다. (예: `host`, `port`, `path`, `key` 등)
        *   `iceServers`는 `PeerJS`의 `config` 옵션을 통해 설정합니다.
    *   `setupPeerListeners` 메서드를 `PeerJS` 이벤트(예: `open`, `connection`, `data`, `close`, `error`)를 처리하도록 수정합니다.
    *   `setupSignalingListeners` 메서드를 `PeerJS`의 시그널링 메커니즘과 연동되도록 수정합니다. (기존 시그널링 서버와의 연동 방식 결정 필요)
    *   `send` 메서드를 `PeerJS` 데이터 연결의 `send` 메서드를 사용하도록 수정합니다.
    *   `destroy` 메서드를 `PeerJS` 연결을 올바르게 닫도록 수정합니다.
*   **`App.tsx` 및 기타 관련 파일:** `WebRtcClient`의 인스턴스화 및 사용 방식이 `PeerJS` 기반으로 변경됨에 따라 필요한 조정을 수행합니다.

### 3.2. 시그널링 서버 변경 (Backend: `backend/signaling/server.py` 및 관련 파일)

*   `PeerJS`는 자체 시그널링 프로토콜을 사용하므로, 기존 Python 시그널링 서버가 `PeerJS` 클라이언트와 통신할 수 있도록 프로토콜을 조정해야 할 수 있습니다.
*   대안으로, `PeerJS` PeerServer를 별도로 구축하고 기존 시그널링 서버는 PeerServer의 ID 교환 역할만 수행하도록 할 수도 있습니다. 이 경우 아키텍처 변경에 대한 논의가 필요합니다.

## 4. 문서 업데이트 계획

`PeerJS`로의 전환에 따라 다음 문서들을 업데이트해야 합니다.

*   **`frontend_spec.md`**: 프런트엔드의 WebRTC 구현 세부 사항을 `PeerJS` 기반으로 변경된 내용으로 업데이트합니다.
*   **`backend_spec.md`**: 시그널링 서버의 변경 사항(필요한 경우) 및 `PeerJS`와의 연동 방식에 대한 내용을 추가합니다.
*   **`implementation_test_plan.md`**: P2P 연결 설정 테스트 절차를 `PeerJS` 구현에 맞춰 업데이트합니다.
*   **`mcp_테스트_가이드.md`**: E2E 테스트 가이드를 `PeerJS` 기반의 새로운 단계와 콘솔 로그 예상치로 업데이트합니다.
*   **`dependency_analysis.md`**: WebRTC 라이브러리 종속성 변경(`simple-peer` 제거, `peerjs` 추가)을 반영합니다.
*   **`code_changes_summary.md`**: `simple-peer`에서 `PeerJS`로의 전환에 대한 코드 변경 요약을 추가합니다.
*   **`기획서.md`**: 기술적 선택 사항에 대한 내용이 있다면 `PeerJS`로의 변경을 반영하여 업데이트합니다.

## 5. 다음 단계

이 제안에 대한 검토 및 승인 후, 위에 명시된 통합 계획에 따라 코드 변경 및 문서 업데이트를 진행하겠습니다. 특히 시그널링 서버와의 통합 방식에 대한 논의가 필요합니다.