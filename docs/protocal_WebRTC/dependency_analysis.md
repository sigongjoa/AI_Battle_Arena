# 라이브러리 호환성 및 사용법 분석 (Dependency Analysis)

이 문서는 `frontend_spec.md`에서 권장된 `PeerJS`와 `msgpack-lite` 라이브러리의 명시된 버전에 대한 공식 문서, 정확한 사용법, 그리고 현재 `arcade-clash` 프로젝트 코드와의 호환성을 분석합니다.

---

### 1. `PeerJS`

WebRTC P2P 연결 설정을 간소화하기 위한 라이브러리입니다.

*   **권장 버전:** `^1.5.4`
*   **공식 문서:** [https://peerjs.com/](https://peerjs.com/)

#### 주요 용도

`PeerJS`는 WebRTC의 복잡한 Offer/Answer, ICE Candidate 교환 과정을 추상화하며, 자체 시그널링 서버(PeerServer)를 통해 피어 간의 연결을 중개합니다. 이를 통해 `WebRtcClient.ts`의 코드를 간결하게 유지하고 개발자가 P2P 통신 로직에 집중할 수 있도록 돕습니다.

#### 브라우저 호환성 및 사용법 준수

`PeerJS`는 WebRTC 표준을 기반으로 하며, 주요 최신 웹 브라우저(Chrome, Firefox, Safari, Edge 등)에서 광범위하게 지원됩니다. 현재 프로젝트에서 사용될 브라우저 환경(Chromium 기반)과 `PeerJS` 버전 `^1.5.4`는 공식 문서에서 권장하는 사용법을 따를 경우 호환성 문제가 없을 것으로 예상됩니다.

*   **공식 문서 확인:** `PeerJS` 공식 문서([https://peerjs.com/](https://peerjs.com/))는 다양한 브라우저 환경에서의 사용법과 주의사항을 상세히 안내하고 있습니다. 특히 `PeerJS`는 `RTCPeerConnection` 및 `RTCDataChannel`과 같은 브라우저 내장 WebRTC API를 추상화하여 사용하므로, 브라우저의 WebRTC 구현에 의존합니다.
*   **사용법 준수:** `PeerJS`의 `Peer` 인스턴스 생성, 이벤트 리스너 등록(`open`, `connection`, `data`, `close`, `error`), 데이터 전송(`conn.send()`) 등은 공식 문서의 가이드라인을 따르며, 이는 현재 `WebRtcClient`의 설계에 반영될 예정입니다.
*   **Node.js Polyfill:** `simple-peer`에서 발생했던 `process.nextTick is not a function`과 같은 Node.js 전역 관련 문제는 `PeerJS`가 브라우저 환경에 더 최적화되어 있거나, 필요한 polyfill을 내부적으로 처리하므로 발생하지 않을 것으로 기대됩니다.

#### 정확한 사용법 (코드 예시)

```typescript
import { Peer } from 'peerjs';

// 1. PeerJS 인스턴스 생성 (로컬 피어 ID는 PeerServer에서 할당받거나 직접 지정)
const peer = new Peer(null, { // null 대신 고유 ID를 지정할 수도 있습니다.
  host: 'localhost',
  port: 9000,
  path: '/myapp',
  debug: 3,
});

peer.on('open', (id) => {
  console.log('My peer ID is:', id);
  // 이 ID를 시그널링 서버를 통해 원격 피어에게 전달해야 합니다.
});

// 2. 원격 피어로부터 연결 요청을 받았을 때
peer.on('connection', (conn) => {
  console.log('DataConnection established with:', conn.peer);
  conn.on('data', (data) => {
    console.log('Received data:', data.toString());
  });
  conn.on('open', () => {
    conn.send('Hello from peer 2!');
  });
});

// 3. 원격 피어에게 연결을 요청할 때 (initiator 역할)
// const conn = peer.connect(remotePeerId);
// conn.on('open', () => {
//   conn.send('Hello from peer 1!');
// });

peer.on('error', (err) => {
  console.error('PeerJS error:', err);
});
```

#### 기존 코드와의 호환성

*   **대체(Replacement) 관계:** `PeerJS`는 기존 `WebRtcClient.ts`에 구현된 `simple-peer` 기반의 WebRTC 연결 처리 로직을 완전히 대체합니다. 따라서 기존 코드를 **대대적으로 리팩토링**해야 합니다. `WebRtcClient`의 내부 구현을 `PeerJS` 기반으로 다시 작성하게 됩니다.
*   **`WebRtcClient` 생성자 변경:** `WebRtcClient` 생성자에서 `this.initPeer()` 호출이 제거되었습니다. `PeerJS` 인스턴스 초기화는 생성자 내부에서 직접 처리됩니다.
*   **`WebRtcClient` 데이터 전송 메서드 변경:** `WebRtcClient`의 데이터 전송 메서드가 `sendData`에서 `send`로 변경되었습니다.
*   **장점:** 리팩토링 시, WebRTC 연결 설정에 관한 코드가 훨씬 간결하고 명확해져 유지보수가 용이해집니다. 특히 `PeerJS`는 자체 시그널링 서버와의 연동을 염두에 두고 설계되었으므로, 시그널링 로직의 복잡성을 줄일 수 있습니다.
*   **TypeScript 지원:** `PeerJS`는 TypeScript를 기본적으로 지원합니다. 별도의 `@types` 패키지 설치 없이 바로 사용할 수 있습니다.

---

### 2. `msgpack-lite`

데이터를 효율적인 바이너리 포맷으로 직렬화/역직렬화하는 라이브러리입니다.

*   **권장 버전:** `~=0.1.0` (`frontend_spec.md` 기준)
*   **공식 문서:** [https://www.npmjs.com/package/msgpack-lite](https://www.npmjs.com/package/msgpack-lite)

#### 주요 용도

`PlayerInput`이나 `GameStateSnapshot` 같은 JavaScript 객체를 JSON 문자열보다 훨씬 작은 크기의 바이너리 데이터로 변환(인코딩)합니다. 이 바이너리 데이터를 WebRTC 데이터 채널을 통해 전송하여 네트워크 대역폭 사용량을 줄일 수 있습니다.

#### 정확한 사용법 (코드 예시)

```typescript
import msgpack from 'msgpack-lite';

// 전송할 게임 입력 데이터 객체
const playerInput = {
  frame: 120,
  inputs: { punch: true, move_right: true }
};

// 1. 객체를 바이너리 데이터로 인코딩
const encodedData = msgpack.encode(playerInput);

// (WebRTC 데이터 채널로 encodedData를 전송)
// peer.send(encodedData);

// 2. 수신한 바이너리 데이터를 다시 객체로 디코딩
const decodedInput = msgpack.decode(encodedData);

console.log(decodedInput.frame); // 120
console.log(decodedInput.inputs.punch); // true
```

#### 기존 코드와의 호환성

*   **부족한 기능 보완:** 이 라이브러리는 현재 프로젝트에 **부족한 부분을 채워주는 역할**을 합니다. 현재 `data_channels.ts`에는 데이터 직렬화/역직렬화 로직이 구현되어 있지 않으므로, `msgpack-lite`는 **기존 코드와 충돌 없이 바로 적용**할 수 있습니다.
*   **적용 대상:** `PlayerInput`, `GameStateSnapshot` 등 데이터 채널로 보낼 모든 커스텀 객체를 인코딩/디코딩하는 데 사용됩니다.
*   **TypeScript 지원:** `msgpack-lite`는 공식 타입 정의(`@types/msgpack-lite`)를 제공하지 않을 수 있습니다. 이 경우, 프로젝트에 `msgpack-lite.d.ts`와 같은 타입 선언 파일을 직접 만들어주거나, `require`를 사용하여 모듈을 불러와야 할 수 있습니다.

    ```typescript
    // 예시: shims-msgpack.d.ts
    declare module 'msgpack-lite';
    ```

---

### 결론

*   `PeerJS`는 WebRTC 연결 로직을 **단순화하는 유용한 리팩토링 도구**이며, 적용 시 `WebRtcClient.ts`의 수정이 필요합니다.
*   `msgpack-lite`는 데이터 채널 통신에 필수적인 **직렬화 기능을 제공하며, 기존 코드와 충돌 없이 통합**할 수 있습니다.
*   `PeerJS`는 TypeScript를 기본적으로 지원하므로 별도의 타입 정의 설정이 필요 없습니다.
