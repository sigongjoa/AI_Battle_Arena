### **WebRTC 및 롤백 넷코드 아키텍처 구현 명세 및 정의서 - 프론트엔드**

**목표:** WebRTC P2P 데이터 채널 및 롤백 넷코드 기반의 저지연 격투 게임 아키텍처 구현을 위한 프론트엔드(클라이언트)의 핵심 API, 인터페이스, 클래스, 함수들을 정의합니다.

---

#### **2. WebRTC 클라이언트 (프론트엔드 - `arcade-clash`)**

WebRTC 클라이언트는 P2P 연결을 설정하고, 데이터 채널을 통해 게임 데이터를 송수신합니다.

**2.1. `WebRtcClient` 클래스**

*   **목적:** WebRTC `RTCPeerConnection` 및 `RTCDataChannel`을 관리합니다.
*   **속성:**
    *   `peerConnection: RTCPeerConnection`: WebRTC 피어 연결 객체.
    *   `signalingClient: SignalingClient`: 시그널링 서버와의 통신 클라이언트.
    *   `localPlayerId: string`: 로컬 플레이어 ID.
    *   `remotePlayerId: string`: 원격 플레이어 ID.
    *   `dataChannels: Map<string, RTCDataChannel>`: 이름으로 데이터 채널을 관리하는 맵.
    *   `stunServers: string[]`: STUN 서버 URL 목록.
    *   `turnServers: RTCIceServer[]`: TURN 서버 설정 목록.
*   **메서드:**
    *   `constructor(localPlayerId: string, signalingClient: SignalingClient, stunServers: string[], turnServers: RTCIceServer[])`: 초기화.
    *   `initPeerConnection()`: `RTCPeerConnection`을 생성하고 이벤트 리스너를 설정합니다.
        *   `onicecandidate`: ICE 후보 생성 시 시그널링 서버로 전송.
        *   `oniceconnectionstatechange`: ICE 연결 상태 변경 처리.
        *   `ondatachannel`: 원격 피어로부터 데이터 채널 수신 시 처리.
    *   `createOffer()`: SDP Offer를 생성하고 시그널링 서버로 전송합니다.
    *   `handleOffer(sdp: string, senderId: string)`: 수신된 SDP Offer를 설정하고 Answer를 생성하여 시그널링 서버로 전송합니다.
    *   `handleAnswer(sdp: string)`: 수신된 SDP Answer를 설정합니다.
    *   `addIceCandidate(candidate: RTCIceCandidate)`: 수신된 ICE 후보를 `peerConnection`에 추가합니다.
    *   `createDataChannel(name: string, options: RTCDataChannelInit)`: 지정된 이름과 옵션으로 `RTCDataChannel`을 생성하고 `dataChannels` 맵에 추가합니다.
    *   `sendData(channelName: string, data: any)`: 지정된 데이터 채널을 통해 데이터를 전송합니다.
*   `closeConnection()`: WebRTC 연결을 종료합니다.

**추가 고려사항:**
*   **네트워크 변경 이벤트:** `RTCPeerConnection`의 `iceconnectionstatechange` 리스너에서 네트워크 변경 (Wi-Fi ↔ LTE 전환, 절전 해제 등) 감지 시, 자동 재시도 정책 (재제안/ICE restart)과 사용자에게 “재연결 중…”과 같은 UX 피드백을 제공해야 합니다.

**2.2. `SignalingClient` 클래스**

*   **목적:** 시그널링 서버와의 WebSocket 통신을 관리합니다.
*   **속성:**
    *   `ws: WebSocket`: WebSocket 연결 객체.
    *   `signalingServerUrl: string`: 시그널링 서버 URL.
    *   `eventListeners: Map<string, Function[]>`: 메시지 타입별 이벤트 리스너 맵.
*   **메서드:**
    *   `constructor(signalingServerUrl: string)`: 초기화.
    *   `connect()`: WebSocket 연결을 설정하고 메시지 수신 핸들러를 등록합니다.
    *   `send(message: object)`: 시그널링 서버로 메시지를 전송합니다.
    *   `on(eventType: string, listener: Function)`: 특정 메시지 타입에 대한 이벤트 리스너 등록.
    *   `off(eventType: string, listener: Function)`: 이벤트 리스너 제거.

**2.3. 데이터 채널별 데이터 구조 (TypeScript 인터페이스)**

*   **`GameInput` 채널:**
    *   `interface PlayerInput { frame: number; playerId: string; inputs: { [key: string]: boolean }; }`
        *   `frame`: 입력이 발생한 게임 프레임 번호.
        *   `playerId`: 입력 플레이어 ID.
        *   `inputs`: 버튼 상태 (예: `{ "punch": true, "kick": false, "left": true }`).
    *   **추가 고려사항:**
        *   **“unreliable/unordered=진짜 UDP처럼” 착각 방지:** 브라우저별 구현 차이로 인한 지터 스파이크 완화를 위해, 입력 배치 크기 상한 (예: 2~3프레임분까지만 묶기), 송신 측 최소 인터벌 (예: 4ms) 강제, 수신측 지터버퍼 (최대 2프레임) 도입. `DataChannel.bufferedAmount` 감시해 백프레셔 처리 (임계치 넘으면 간격 늘리기).
*   **`GameStateSync` 채널:**
    *   `interface GameStateSnapshot { frame: number; checksum: string; initialGameState?: any; event?: "round_start" | "ko" | "rematch_request"; }`
        *   `frame`: 스냅샷/이벤트가 발생한 게임 프레임 번호.
        *   `checksum`: 게임 상태의 결정론적 체크섬 (비동기화 감지용).
        *   `initialGameState`: (선택적) 초기 게임 상태 (캐릭터 선택, 스테이지 등).
        *   `event`: (선택적) 중요 게임 이벤트.
    *   **추가 고려사항:**
        *   **SCTP 스트림 단위 HoL 회피:** 메시지 MTU 하향 (≤ 1200 bytes)을 권장하며, 8KB 이상 큰 페이로드는 조각-식별자 붙여 다중 스트림 분산 처리.
        *   **보안/치트:** `GameStateSync`를 통한 주기적인 `해시체크/프레임별 체크섬` 교차 검증을 통해 입력 위변조 및 지연 스푸핑 시도를 감지합니다.
*   **`Metadata` 채널:**
    *   `interface ChatMessage { senderId: string; message: string; timestamp: number; }`
    *   `interface ConnectionStatus { playerId: string; status: "connected" | "disconnected"; }`

#### **3. 게임 엔진 (프론트엔드 - `arcade-clash` 및 백엔드 - `src` (시뮬레이션 로직))**

게임 엔진은 결정론적 시뮬레이션을 실행하고 롤백 넷코드를 통해 상태를 동기화합니다.

**3.1. `GameEngine` 클래스**

*   **목적:** 게임 시뮬레이션을 실행하고 롤백 넷코드 로직을 관리합니다.
*   **속성:**
    *   `currentFrame: number`: 현재 시뮬레이션 프레임.
    *   `localPlayerId: string`: 로컬 플레이어 ID.
    *   `remotePlayerId: string`: 원격 플레이어 ID.
    *   `gameStates: Map<number, GameState>`: 프레임별 게임 상태 스냅샷 맵.
    *   `playerInputs: Map<number, { [playerId: string]: PlayerInput }>`: 프레임별 플레이어 입력 맵.
    *   `rollbackWindow: number`: 롤백 가능한 최대 프레임 수.
    *   `fixedDeltaTime: number`: 고정된 프레임 간 시간 (예: 1/60초).
    *   `isDeterministic: boolean`: 결정론적 모드 여부.
*   **메서드:**
    *   `constructor(localPlayerId: string, remotePlayerId: string, fixedDeltaTime: number)`: 초기화.
    *   `update(deltaTime: number)`: 게임 루프의 메인 업데이트 함수.
        *   `currentFrame` 증가.
        *   `processLocalInput()`: 로컬 플레이어 입력 처리.
        *   `predictRemoteInput()`: 원격 플레이어 입력 예측.
        *   `simulateFrame(frame: number, inputs: { [playerId: string]: PlayerInput })`: 단일 프레임 시뮬레이션.
        *   `saveState(frame: number)`: 현재 게임 상태를 스냅샷으로 저장.
        *   `loadState(frame: number)`: 특정 프레임의 게임 상태를 로드.
        *   `checkAndRollback()`: 원격 입력 수신 시 예측과 실제 입력 비교 및 롤백 수행.
    *   `receiveRemoteInput(input: PlayerInput)`: 원격 플레이어 입력 수신 처리.
    *   `getGameState(frame: number): GameState`: 특정 프레임의 게임 상태 반환.
    *   `calculateChecksum(state: GameState): string`: 게임 상태의 결정론적 체크섬 계산.
    *   `render()`: 게임 상태를 기반으로 화면 렌더링 (시뮬레이션 로직과 분리).
*   **추가 고려사항:**
    *   **결정론 깨짐 (Desync) 완화:**
        *   **고정 타임스텝 (60Hz) + 고정소수점 또는 정수 물리로 전환:** 가장 어려운 부분이며, 반드시 먼저 Proof-of-Concept를 통해 검증해야 합니다.
        *   **난수 전역 시드 고정 + 호출 위치 금지 규약:** `Math.random()`과 같은 난수 호출은 시뮬레이션 단계에서만 허용하고 렌더링 단계에서는 금지합니다.
    *   **상태 스냅샷 비용 폭발 완화:**
        *   **상태-표현 분리 + 구조체화:** `plain arrays`, `typed arrays` 등을 활용하여 객체 그래프를 단순화하고, 풀링(Pooling) 기법을 사용하여 GC(Garbage Collection) 발생을 최소화합니다.
        *   **스냅샷 링버퍼:** 최근 15~20프레임 정도의 스냅샷을 링버퍼로 관리하고, `dirty-bit` 기반의 얕은 복사를 활용하여 복사 비용을 줄입니다.
        *   **성능 예산:** “한 프레임 비용 C, 허용 롤백 N: N×C < 16.67ms”를 프로파일 숫자로 고정하고, 매 빌드마다 예산 초과 시 경고를 발생시킵니다.
    *   **예측 실패 시 시각적 파손 완화:**
        *   **입력 예측 휴리스틱:** ‘마지막 입력 유지’를 기본으로 하되, 점프/대쉬 직후와 같은 위험 상황에서는 보수적인 예측 휴리스틱을 적용합니다.
        *   **연출 지연:** 히트 이펙트 등 시각적 연출을 1~2프레임 지연시켜 롤백으로 인한 시각적 파손을 은폐합니다.
        *   **옵션형 고정 입력 지연:** 사용자에게 1~2프레임의 고정 입력 지연 토글 옵션을 제공하여, 지터 흡수와 반응성 사이에서 선택할 수 있도록 합니다.
    *   **브라우저/런타임 특이점 완화:**
        *   **탭 백그라운드 스로틀링:** 게임 시뮬레이션 로직은 Web Worker에서 고정 틱으로 실행하고, 렌더링만 메인 스레드에서 처리합니다. `Cross-Origin-Isolation` 및 `SharedArrayBuffer`를 사용하여 프레임 간 공유 버퍼로 지연을 최소화하는 방안을 고려합니다.
        *   **GC 스파이크:** 할당 프리 루프 (풀링, 구조체화)를 적극 활용하고, 메시지 직렬화 시에도 재사용 버퍼를 사용하여 GC 발생을 줄입니다.

**3.2. `GameState` 인터페이스/클래스**

*   **목적:** 게임의 모든 시뮬레이션 관련 상태를 포함합니다. 완벽하게 결정론적이어야 합니다.
*   **속성 (예시):**
    *   `player1: CharacterState`
    *   `player2: CharacterState`
    *   `stageState: StageState`
    *   `projectiles: ProjectileState[]`
    *   `roundTimer: number`
    *   `randomSeed: number` (난수 생성기 시드)
    *   ... (게임에 필요한 모든 시뮬레이션 상태)
*   **메서드:**
    *   `serialize(): Uint8Array`: 게임 상태를 효율적으로 직렬화 (바이트 배열).
    *   `deserialize(data: Uint8Array): GameState`: 바이트 배열로부터 게임 상태 역직렬화.
*   **추가 고려사항:**
    *   **직렬화 드리프트:** 입력/상태 포맷에 필드 추가 시 과거 클라이언트와 호환성 파손을 방지하기 위해 `버전 필드`를 포함하고 `엄격한 스키마` (예: protobuf/msgpack + 런타임 검증)를 적용합니다. 신속한 A/B 배포가 불가능할 경우 버전 불일치 시 핸드셰이크에서 즉시 중단하는 정책을 수립합니다.

**3.3. `CharacterState` 인터페이스/클래스**

*   **목적:** 각 캐릭터의 시뮬레이션 관련 상태를 포함합니다.
*   **속성 (예시):**
    *   `position: { x: FixedPoint, y: FixedPoint }`
    *   `velocity: { x: FixedPoint, y: FixedPoint }`
    *   `health: FixedPoint`
    *   `meter: FixedPoint`
    *   `animationFrame: number`
    *   `isGrounded: boolean`
    *   `currentAction: string`
    *   ...

**3.4. `FixedPoint` 타입/클래스 (유틸리티)**

*   **목적:** 부동소수점 대신 결정론적 연산을 위한 고정소수점 숫자를 제공합니다.
*   **속성:**
    *   `value: number` (내부 정수 값)
    *   `precision: number` (소수점 이하 자릿수)
*   **메서드:**
    *   `add(other: FixedPoint): FixedPoint`
    *   `subtract(other: FixedPoint): FixedPoint`
    *   `multiply(other: FixedPoint): FixedPoint`
    *   `divide(other: FixedPoint): FixedPoint`
    *   `fromFloat(floatValue: number, precision: number): FixedPoint`
    *   `toFloat(): number`

**3.5. `InputManager` 클래스**

*   **목적:** 로컬 플레이어 입력을 캡처하고 `PlayerInput` 객체로 변환합니다.
*   **속성:**
    *   `currentInputs: { [key: string]: boolean }`
*   **메서드:**
    *   `updateInputState(key: string, isPressed: boolean)`: 키 입력 상태 업데이트.
    *   `getFrameInput(frame: number, playerId: string): PlayerInput`: 현재 프레임의 입력 상태를 `PlayerInput` 객체로 반환.
*   **추가 고려사항:**
    *   **입력 수집 지연/키 고스팅 완화:** Raw input 폴링 주기를 로직 틱과 동기화합니다. 키 매트릭스 기반 입력 버퍼 (키 다운 타임스탬프 저장, 프레임 정렬)를 사용하여 미스 샘플링을 방지합니다.

---

**4. 기술 스택 및 라이브러리 권장 사항**

프론트엔드는 기존 `arcade-clash` 프로젝트의 기술 스택(TypeScript, React)을 기반으로 합니다.

**4.1. WebRTC 클라이언트**

*   **언어:** TypeScript (현재 `arcade-clash` 프로젝트와 동일)
*   **WebRTC API:** 브라우저 내장 WebRTC API
    *   **호환성:** 최신 웹 브라우저 (Chrome, Firefox, Edge, Safari)에서 광범위하게 지원됩니다.
    *   **공식 문서:** [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
*   **WebRTC 헬퍼 라이브러리 (선택 사항):** `simple-peer`
    *   **목적:** 브라우저의 WebRTC API를 추상화하여 P2P 연결 설정 과정을 간소화합니다.
    *   **권장 버전:** `~=9.0.0`
    *   **호환성:** TypeScript 환경에서 사용 가능하며, `package.json`에 추가하여 관리합니다.
    *   **공식 문서:** [https://github.com/feross/simple-peer](https://github.com/feross/simple-peer)

**4.2. 게임 엔진 및 롤백 넷코드**

*   **언어:** TypeScript (현재 `arcade-clash` 프로젝트와 동일)
*   **프레임워크:** React (UI 및 게임 렌더링 통합)
    *   **호환성:** `arcade-clash/package.json`에 명시된 React 버전과 호환됩니다.
*   **고정소수점(Fixed-Point) 수학:**
    *   **권장 사항:** 게임의 특성과 정밀도 요구사항에 맞춰 커스텀 구현을 권장합니다. 이는 결정론을 보장하는 가장 확실한 방법입니다.
    *   **대안 (소규모 라이브러리):** `fixed-point-js` (매우 간단한 구현 예시)
        *   **권장 버전:** `~=1.0.0` (사용 시 철저한 테스트 필요)
        *   **공식 문서:** [https://github.com/mreinstein/fixed-point-js](https://github.com/mreinstein/fixed-point-js)
*   **데이터 직렬화/역직렬화:**
    *   **목적:** `GameState` 및 `PlayerInput` 객체를 효율적으로 바이트 배열로 변환하고 다시 객체로 복원합니다.
    *   **권장 라이브러리:** `msgpack-lite` 또는 `protobuf.js`
        *   **`msgpack-lite` (경량, 효율적):**
            *   **권장 버전:** `~=0.1.0`
            *   **호환성:** TypeScript 환경에서 사용 가능.
            *   **공식 문서:** [https://github.com/kawanet/msgpack-lite](https://github.com/kawanet/msgpack-lite)
        *   **`protobuf.js` (스키마 기반, 강력한 타입):**
            *   **권장 버전:** `~=7.0.0`
            *   **호환성:** `.proto` 파일을 사용하여 스키마를 정의하고 코드를 생성할 수 있어 복잡한 게임 상태에 유리합니다. 기존 gRPC에서 `.proto` 파일을 사용하고 있으므로 통합이 용이할 수 있습니다.
            *   **공식 문서:** [https://github.com/protobufjs/protobuf.js](https://github.com/protobufjs/protobuf.js)

**4.3. 개발 도구 및 환경**

*   **TypeScript:** `arcade-clash/tsconfig.json`에 명시된 버전과 호환되는 버전 사용.
*   **Vite:** `arcade-clash/vite.config.ts`에 명시된 버전과 호환되는 버전 사용 (개발 서버 및 번들링).
*   **Node.js:** `arcade-clash` 프로젝트의 `package.json`에 명시된 Node.js 버전과 호환되는 버전 사용.

---

**구현 시 고려사항:**

*   **언어/프레임워크:** 프론트엔드는 TypeScript/React (현재 `arcade-clash` 기반), 백엔드 시그널링 서버는 Node.js (권장) 또는 Python, 게임 시뮬레이션 로직은 TypeScript (프론트엔드) 또는 Python (백엔드 시뮬레이션 공유 시)으로 구현될 수 있습니다. 결정론적 시뮬레이션 코드는 양쪽에서 동일하게 동작해야 합니다.
*   **테스트:** 각 클래스/함수에 대한 단위 테스트와 통합 테스트를 철저히 수행해야 합니다. 특히 결정론적 시뮬레이션의 비동기화 감지 및 디버깅 도구 개발이 중요합니다.
*   **성능:** `GameState`의 직렬화/역직렬화, `FixedPoint` 연산, 롤백 재시뮬레이션의 성능은 게임의 반응성에 직접적인 영향을 미치므로 지속적인 프로파일링 및 최적화가 필요합니다.
