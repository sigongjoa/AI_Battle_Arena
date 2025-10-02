### **WebRTC 및 롤백 넷코드 아키텍처 임포트/익스포트 전략 및 폴더 구조 명세**

**목표:** 새로운 WebRTC 및 롤백 넷코드 아키텍처 구현 시 발생할 수 있는 임포트 관련 문제를 최소화하고, 코드의 모듈성, 재사용성 및 유지보수성을 높이기 위한 파일 폴더 구조 및 임포트/익스포트 전략을 정의합니다. 특히 결정론적 시뮬레이션 로직의 공유 방안에 중점을 둡니다.

---

#### **1. 전체 전략 및 원칙**

*   **관심사 분리 (Separation of Concerns):** 각 모듈은 명확한 단일 책임을 가지도록 설계합니다.
*   **순환 의존성 최소화:** 모듈 간의 순환 임포트를 피하여 코드의 복잡성을 줄이고 이해도를 높입니다.
*   **명확한 계층 구조:** 상위 계층은 하위 계층에 의존하고, 하위 계층은 상위 계층에 의존하지 않도록 합니다.
*   **공유 로직 관리:** 결정론적 시뮬레이션과 같이 프론트엔드와 백엔드 모두에서 동일하게 동작해야 하는 로직은 특별히 관리합니다.

#### **2. 제안하는 폴더 구조 (기존 구조 기반)**

기존 프로젝트의 `backend/`, `arcade-clash/src/`, `src/` 디렉토리를 고려하여, 새로운 WebRTC 및 롤백 넷코드 관련 코드를 위한 구조를 제안합니다.

```
/mnt/d/progress/AI_Battle_Arena/
├───backend/
│   ├───... (기존 백엔드 코드)
│   ├───signaling/
│   │   ├───__init__.py
│   │   ├───server.py             # WebSocketServer 클래스 구현
│   │   ├───matchmaking.py        # 매치메이킹 로직
│   │   ├───models.py             # PlayerInfo, MatchSession 모델
│   │   └───auth.py               # 인증 관련 유틸리티
│   ├───shared_game_logic/        # Python 버전의 공유 게임 로직 (선택 사항, 검증용)
│   │   ├───__init__.py
│   │   ├───game_state.py         # GameState, CharacterState 정의
│   │   ├───fixed_point.py        # FixedPoint 구현
│   │   └───input_data.py         # PlayerInput 정의
│   └───...
├───arcade-clash/
│   ├───src/
│   │   ├───... (기존 프론트엔드 코드)
│   │   ├───webrtc/
│   │   │   ├───index.ts          # WebRtcClient, SignalingClient 통합 익스포트
│   │   │   ├───client.ts         # WebRtcClient 클래스 구현
│   │   │   ├───signaling.ts      # SignalingClient 클래스 구현
│   │   │   └───data_channels.ts  # 데이터 채널별 데이터 구조 (PlayerInput, GameStateSnapshot 등)
│   │   ├───game_engine/
│   │   │   ├───index.ts          # GameEngine 통합 익스포트
│   │   │   ├───engine.ts         # GameEngine 클래스 구현
│   │   │   ├───input_manager.ts  # InputManager 클래스 구현
│   │   │   └───rollback_logic.ts # 롤백 관련 상세 로직
│   │   ├───shared_game_logic/    # TypeScript 버전의 공유 게임 로직
│   │   │   ├───index.ts
│   │   │   ├───game_state.ts     # GameState, CharacterState 정의
│   │   │   ├───fixed_point.ts    # FixedPoint 구현
│   │   │   └───input_data.ts     # PlayerInput 정의
│   │   └───...
│   └───...
└───src/
    ├───... (기존 게임 로직 - Python)
    └───...
```

#### **3. 임포트/익스포트 컨벤션**

**3.1. Python (백엔드)**

*   **절대 임포트 선호:** 프로젝트 루트 (`AI_Battle_Arena`) 또는 최상위 패키지 (`backend`)를 기준으로 절대 임포트를 사용합니다.
    *   예: `from backend.signaling.server import WebSocketServer`
    *   예: `from backend.shared_game_logic.game_state import GameState`
*   **`__init__.py` 활용:** 각 디렉토리에 `__init__.py` 파일을 두어 패키지로 인식하게 하고, 필요한 경우 `__init__.py`에서 하위 모듈의 주요 클래스/함수를 익스포트하여 임포트 경로를 간소화할 수 있습니다.
    *   예: `backend/signaling/__init__.py`에 `from .server import WebSocketServer`를 추가하면, `from backend.signaling import WebSocketServer`로 임포트 가능.
*   **의존성 관리:** `backend/requirements.txt`에 모든 Python 라이브러리 의존성을 명시하고 `pip install -r requirements.txt`로 관리합니다.

**3.2. TypeScript/JavaScript (프론트엔드)**

*   **ES Modules (`import`/`export`):** 모든 모듈은 ES Modules 문법을 사용하여 임포트/익스포트합니다.
    *   예: `import { WebRtcClient } from './webrtc/client';`
    *   예: `export class GameEngine { ... }`
*   **경로 별칭 (Path Aliases):** `tsconfig.json`에 `paths` 설정을 사용하여 긴 상대 경로 임포트를 줄이고 가독성을 높입니다.
    *   `arcade-clash/tsconfig.json` 예시:
        ```json
        {
          "compilerOptions": {
            "baseUrl": "./src",
            "paths": {
              "@webrtc/*": ["webrtc/*"],
              "@game-engine/*": ["game_engine/*"],
              "@shared-game-logic/*": ["shared_game_logic/*"]
            }
          }
        }
        ```
    *   임포트 예시: `import { WebRtcClient } from '@webrtc/client';`
*   **의존성 관리:** `arcade-clash/package.json`에 모든 Node.js/TypeScript 라이브러리 의존성을 명시하고 `npm install` 또는 `yarn install`로 관리합니다.

#### **4. 공유 결정론적 로직 관리**

`GameState`, `FixedPoint`, `PlayerInput` 및 핵심 `GameEngine` 시뮬레이션 로직은 프론트엔드와 백엔드에서 동일하게 동작해야 합니다. 이를 위한 전략은 다음과 같습니다.

**4.1. 전략: 언어 독립적 명세 + 독립적 구현 (권장)**

*   **언어 독립적 명세:** 핵심 결정론적 로직 (예: `GameState` 구조, `FixedPoint` 연산 규칙, 입력 처리 로직)에 대한 상세한 언어 독립적 명세 (의사 코드, 수학적 정의)를 별도 문서로 작성합니다.
*   **독립적 구현:** 이 명세를 기반으로 Python (`backend/shared_game_logic/`)과 TypeScript (`arcade-clash/src/shared_game_logic/`)에서 각각 독립적으로 구현합니다.
*   **장점:**
    *   각 언어의 관용적인 코드 스타일과 최적화 기법을 적용할 수 있습니다.
    *   복잡한 크로스-컴파일 또는 트랜스파일링 셋업이 필요 없습니다.
    *   결정론 검증이 용이합니다 (두 구현의 결과가 동일한지 비교).
*   **단점:** 두 언어로 동일한 로직을 구현해야 하므로 초기 개발 비용이 증가할 수 있습니다.
*   **호환성 확인:** `FixedPoint` 구현 시, Python과 TypeScript 간의 부동소수점 처리 방식 차이를 명세서에 명확히 하고, 각 구현이 이를 정확히 따르도록 합니다.

**4.2. 대안: WebAssembly (고려 사항)**

*   **전략:** 핵심 게임 로직을 C++ 등 단일 언어로 구현한 후 WebAssembly로 컴파일하여 프론트엔드(브라우저)와 백엔드(Node.js/Python 런타임)에서 모두 사용합니다.
*   **장점:** 단일 코드베이스로 결정론을 완벽하게 보장할 수 있습니다. 고성능이 필요한 경우 유리합니다.
*   **단점:** 초기 설정 복잡성, 개발 언어 제약, 디버깅 난이도 증가. 현재 프로젝트의 기술 스택(Python, TypeScript)과 거리가 있어 도입 시 큰 학습 곡선이 예상됩니다.

#### **5. 특정 임포트 예시**

**5.1. 백엔드 (Python)**

*   **시그널링 서버에서 매치메이킹 로직 임포트:**
    ```python
    # backend/signaling/server.py
    from backend.signaling.matchmaking import MatchmakingManager
    from backend.signaling.models import PlayerInfo, MatchSession
    ```
*   **기존 gRPC 프로토버프 임포트 (참고):**
    ```python
    # backend/grpc_server.py
    from backend.proto_gen import game_pb2, game_pb2_grpc
    ```

**5.2. 프론트엔드 (TypeScript)**

*   **`WebRtcClient`에서 `SignalingClient` 임포트:**
    ```typescript
    // arcade-clash/src/webrtc/client.ts
    import { SignalingClient } from './signaling'; // 또는 '@webrtc/signaling' (경로 별칭 사용 시)
    import { PlayerInput, GameStateSnapshot } from './data_channels';
    ```
*   **`GameEngine`에서 공유 게임 로직 임포트:**
    ```typescript
    // arcade-clash/src/game_engine/engine.ts
    import { GameState, CharacterState, FixedPoint } from '../shared_game_logic'; // 또는 '@shared-game-logic'
    import { PlayerInput } from '../webrtc/data_channels'; // 또는 '@webrtc/data_channels'
    ```
*   **기존 gRPC 클라이언트 임포트 (참고):**
    ```typescript
    // arcade-clash/src/grpc/client.ts
    import { GameServiceClient } from './game_connect';
    import { GameStateRequest, PlayerInput as GrpcPlayerInput } from './game_pb';
    ```

---

이 명세서는 임포트 관련 문제를 사전에 방지하고, 특히 공유 결정론적 로직을 효과적으로 관리하는 데 도움이 될 것입니다.
