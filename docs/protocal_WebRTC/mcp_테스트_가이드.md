# MCP(chrome-devtools)를 이용한 E2E 테스트 가이드

이 문서는 `chrome-devtools` (MCP)의 도구를 사용하여 WebRTC P2P 연결의 전체 흐름을 테스트하는 상세 절차를 안내합니다. 디버깅 과정에서 발견된 문제점과 해결책도 포함합니다.

### 사전 준비

테스트를 시작하기 전에, `서버_실행_가이드.md` 문서를 참고하여 아래의 세 가지 서버가 모두 실행 중이어야 합니다.

1.  메인 백엔드 서버 (예: `http://localhost:8001`)
2.  WebRTC 시그널링 서버 (예: `ws://localhost:8765`)
3.  프론트엔드 개발 서버 (예: `http://localhost:5174`)

**주의:** 시그널링 서버(`backend/signaling/server.py`)는 `import logging` 누락 및 `traceback` 추가를 위해 재시작해야 합니다.

---

### 테스트 절차

#### 0단계: 테스트 환경 초기화

모든 테스트는 깨끗한 상태에서 시작하기 위해 현재 열려있는 브라우저 페이지를 모두 닫습니다.

```python
# 사용 도구: close_page
print(default_api.close_page(pageIdx = 1)) # 두 번째 페이지가 있다면 닫기
print(default_api.close_page(pageIdx = 0)) # 첫 번째 페이지 닫기 (마지막 페이지는 닫히지 않음)
```

#### 1단계: 사용자 1 (요청자) 로비 입장

첫 번째 사용자가 프론트엔드 애플리케이션에 접속하여 로비에 입장합니다.

1.  **메인 페이지 접속:**
    ```python
    # 사용 도구: navigate_page
    print(default_api.navigate_page(url = "http://localhost:5174/"))
    ```

2.  **UI 확인 및 'Online Lobby' 클릭:**
    *   `take_snapshot`으로 메인 메뉴 UI를 확인하고 'Online Lobby' 버튼의 `uid`를 얻습니다.
    *   **[버그 수정됨]** 이전에는 'Online Lobby' 클릭 시 캐릭터 선택 화면으로 이동하는 버그가 있었으나, `App.tsx`의 `Screen` enum에 `Lobby`가 추가되어 이 문제는 해결되었습니다.
    ```python
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: click (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.click(uid = "[Online Lobby 버튼의 UID]"))
    ```

3.  **이름 입력 및 로비 참가:**
    *   `take_snapshot`으로 로비 입장 폼 UI를 확인하고 이름 입력창과 'Join Lobby' 버튼의 `uid`를 얻습니다.
    *   `fill`로 이름을 입력하고, `click`으로 'Join Lobby' 버튼을 클릭합니다.
    ```python
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: fill (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.fill(uid = "[이름 입력창의 UID]", value = "Player1"))
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: click (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.click(uid = "[Join Lobby 버튼의 UID]"))
    ```
    *   `take_snapshot`으로 'No other players in the lobby.' 메시지가 보이는지 확인합니다.

#### 2단계: 사용자 2 (수락자) 로비 입장

두 번째 사용자가 새 탭으로 접속하여 로비에 입장합니다.

1.  **새 탭 열기 및 접속:**
    ```python
    # 사용 도구: new_page
    print(default_api.new_page(url = "http://localhost:5174/"))
    ```

2.  **UI 확인 및 'Online Lobby' 클릭:**
    *   `take_snapshot`으로 메인 메뉴 UI를 확인하고 'Online Lobby' 버튼의 `uid`를 얻습니다.
    *   `click`으로 'Online Lobby' 버튼을 클릭합니다.
    ```python
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: click (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.click(uid = "[Online Lobby 버튼의 UID]"))
    ```

3.  **이름 입력 및 로비 참가:**
    *   `take_snapshot`으로 로비 입장 폼 UI를 확인하고 이름 입력창과 'Join Lobby' 버튼의 `uid`를 얻습니다.
    *   `fill`로 이름을 입력하고, `click`으로 'Join Lobby' 버튼을 클릭합니다.
    ```python
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: fill (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.fill(uid = "[이름 입력창의 UID]", value = "Player2"))
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: click (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.click(uid = "[Join Lobby 버튼의 UID]"))
    ```

#### 3단계: 로비 상태 동기화 확인

두 사용자의 플레이어 목록이 서로 올바르게 동기화되었는지 확인합니다.

1.  **사용자 2 화면 확인:**
    *   `take_snapshot`으로 사용자 2의 화면에 'Player1'이 'available' 상태로 보이는지 확인합니다.

2.  **사용자 1 화면 확인:**
    *   `select_page`로 사용자 1의 탭(page 0)을 선택합니다.
    *   `take_snapshot`으로 사용자 1의 화면에 'Player2'가 'available' 상태로 보이는지 확인합니다.

#### 4단계: 매치 요청 및 수락

사용자 1이 사용자 2에게 매치를 요청하고, 사용자 2가 이를 수락하는 과정을 진행합니다.

1.  **사용자 1, 매치 요청:**
    *   `select_page`로 사용자 1의 탭(page 0)을 선택합니다.
    *   `take_snapshot`으로 'Player2' 옆의 'Request Match' 버튼 `uid`를 얻습니다.
    *   `click`으로 'Request Match' 버튼을 클릭합니다.
    ```python
    # 사용 도구: select_page
    print(default_api.select_page(pageIdx = 0))
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: click (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.click(uid = "[Player2 옆 Request Match 버튼의 UID]"))
    ```

2.  **사용자 2, 매치 수락:**
    *   `select_page`로 사용자 2의 탭(page 1)을 선택합니다.
    *   `take_snapshot`으로 'Match Request' 모달이 나타났는지 확인하고 'Accept' 버튼의 `uid`를 얻습니다.
    *   `click`으로 'Accept' 버튼을 클릭합니다.
    ```python
    # 사용 도구: select_page
    print(default_api.select_page(pageIdx = 1))
    # 사용 도구: take_snapshot
    print(default_api.take_snapshot())
    # 사용 도구: click (uid는 스냅샷 결과에 따라 달라짐)
    print(default_api.click(uid = "[Accept 버튼의 UID]"))
    ```

#### 5단계: WebRTC 연결 확인 및 디버깅

매치 수락 후, P2P 연결이 성공적으로 수립되었는지 콘솔 로그를 통해 확인합니다.

1.  **사용자 1 콘솔 로그 확인:**
    *   `select_page`로 사용자 1의 탭(page 0)을 선택합니다.
    *   `list_console_messages`로 콘솔 로그를 확인합니다.
    ```python
    # 사용 도구: select_page
    print(default_api.select_page(pageIdx = 0))
    # 사용 도구: list_console_messages
    print(default_api.list_console_messages())
    ```
    *   **확인할 로그:**
        *   `WebRTC: WebRtcClient instance created` (WebRtcClient 인스턴스 생성 확인)
        *   `WebRTC: PeerJS Peer opened with ID: [ID]` (PeerJS 피어 ID 할당 확인)
        *   `Signaling: Sending message {type: 'send_peer_id', ...}` (시그널링 서버로 PeerJS ID가 전송되었는지 확인)
        *   `WebRTC: PeerJS DataConnection established!` (P2P 데이터 연결 성공 확인)
        *   `WebRTC P2P Connected!` (App.tsx에서 WebRTC 클라이언트 연결 이벤트 처리 확인)

2.  **사용자 2 콘솔 로그 확인:**
    *   `select_page`로 사용자 2의 탭(page 1)을 선택합니다.
    *   `list_console_messages`로 콘솔 로그를 확인합니다.
    ```python
    # 사용 도구: select_page
    print(default_api.select_page(pageIdx = 1))
    # 사용 도구: list_console_messages
    print(default_api.list_console_messages())
    ```
    *   **확인할 로그:**
        *   `WebRTC: WebRtcClient instance created` (WebRtcClient 인스턴스 생성 확인)
        *   `WebRTC: PeerJS Peer opened with ID: [ID]` (PeerJS 피어 ID 할당 확인)
        *   `Signaling: Received message type 'peerId', emitting 'peerId' ...` (사용자 1로부터 PeerJS ID를 수신했는지 확인)
        *   `WebRTC: PeerJS DataConnection established!` (P2P 데이터 연결 성공 확인)
        *   `WebRTC P2P Connected!` (App.tsx에서 WebRTC 클라이언트 연결 이벤트 처리 확인)

---

### 테스트 성공 판단 기준

*   두 클라이언트 모두 `WebRTC P2P Connected!` 로그를 출력하고, 게임 화면으로 정상적으로 전환되어야 합니다.
*   시그널링 서버 로그에 `Relayed peerjs_signal from ... to ...` 메시지가 정상적으로 기록되어야 합니다.