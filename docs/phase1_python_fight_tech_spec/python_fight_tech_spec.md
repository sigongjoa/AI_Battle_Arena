### **Python 격투 게임 프로토타입 - 기술 명세서**

#### **1. 코딩 스타일 및 규칙**

*   **PEP 8:** Python 표준 스타일 가이드를 준수합니다.
*   **타입 힌트:** 모든 함수 및 메서드에 타입 힌트를 명시적으로 사용합니다.
*   **Docstrings:** Google 스타일 Docstrings를 사용하여 코드 설명을 명확히 합니다.

#### **2. 핵심 클래스 및 인터페이스 정의**

---

##### **2.1 `Game` 클래스 (메인 게임 루프)**

*   **목적:** Pygame 초기화, 메인 게임 루프 관리, 이벤트 처리, 게임 상태 업데이트 및 렌더링을 담당하는 핵심 클래스.
*   **속성:**
    *   `screen`: `pygame.Surface` - 게임 화면 객체.
    *   `clock`: `pygame.time.Clock` - 프레임 속도 제어.
    *   `running`: `bool` - 게임 루프 실행 여부.
    *   `player1`: `Player` - 플레이어 1 객체.
    *   `player2`: `Player` - 플레이어 2 객체.
    *   `collision_manager`: `CollisionManager` - 충돌 관리자 객체.
    *   `ai_controller`: `AIController` - P2를 제어할 AI 컨트롤러 객체.
*   **메서드:**
    *   `__init__(self, width: int, height: int, caption: str)`:
        *   **설명:** 게임 초기화, 화면 설정, 플레이어 및 관리자 객체 생성.
        *   **매개변수:** `width` (화면 너비), `height` (화면 높이), `caption` (창 제목).
    *   `run(self)`:
        *   **설명:** 메인 게임 루프. 이벤트 처리, 업데이트, 그리기를 반복.
        *   **반환:** `None`.
    *   `_handle_input(self)`:
        *   **설명:** Pygame 이벤트(키보드 입력, 창 닫기 등)를 처리.
        *   **반환:** `None`.
    *   `_update(self, dt: float)`:
        *   **설명:** 게임 로직 업데이트 (캐릭터 위치, 상태, AI 행동 결정 등).
        *   **매개변수:** `dt` (`float`) - 마지막 프레임 이후 경과 시간 (델타 타임).
        *   **반환:** `None`.
    *   `_draw(self)`:
        *   **설명:** 모든 게임 객체를 화면에 그림.
        *   **반환:** `None`.

---

##### **2.2 `Player` 클래스 (캐릭터)**

*   **목적:** 게임 내 캐릭터의 상태, 움직임, 공격, 체력 등을 관리.
*   **속성:**
    *   `rect`: `pygame.Rect` - 캐릭터의 위치와 크기.
    *   `vel_x`, `vel_y`: `float` - X, Y축 속도.
    *   `health`: `int` - 현재 체력.
    *   `state`: `str` - 현재 상태 (예: "idle", "walk", "jump", "attack", "guard", "hit").
    *   `facing`: `int` - 바라보는 방향 (1: 오른쪽, -1: 왼쪽).
    *   `is_jumping`: `bool` - 점프 중인지 여부.
    *   `is_attacking`: `bool` - 공격 중인지 여부.
    *   `is_guarding`: `bool` - 가드 중인지 여부.
    *   `attack_hitbox`: `Hitbox` - 현재 공격의 히트박스 객체 (공격 중일 때만 유효).
    *   `hurtbox`: `Hitbox` - 캐릭터의 피격 판정 박스.
*   **메서드:**
    *   `__init__(self, x: int, y: int, width: int, height: int, color: Tuple[int, int, int], facing: int)`:
        *   **설명:** 캐릭터 초기화.
    *   `move(self, direction: int)`:
        *   **설명:** 캐릭터를 좌우로 이동.
        *   **매개변수:** `direction` (`int`) - 이동 방향 (-1: 왼쪽, 1: 오른쪽).
        *   **반환:** `None`.
    *   `jump(self)`:
        *   **설명:** 캐릭터를 점프시킴.
        *   **반환:** `None`.
    *   `attack(self)`:
        *   **설명:** 공격 동작 시작.
        *   **반환:** `None`.
    *   `guard(self)`:
        *   **설명:** 가드 동작 시작.
        *   **반환:** `None`.
    *   `take_damage(self, damage: int)`:
        *   **설명:** 캐릭터가 데미지를 입음.
        *   **매개변수:** `damage` (`int`) - 받을 데미지 양.
        *   **반환:** `None`.
    *   `update(self, dt: float, opponent: 'Player')`:
        *   **설명:** 캐릭터의 물리 및 상태 업데이트.
        *   **매개변수:** `dt` (`float`), `opponent` (`Player`) - 상대방 캐릭터 객체 (충돌 감지용).
        *   **반환:** `None`.
    *   `draw(self, screen: pygame.Surface)`:
        *   **설명:** 캐릭터를 화면에 그림.
        *   **매개변수:** `screen` (`pygame.Surface`) - 그릴 화면.
        *   **반환:** `None`.

---

##### **2.3 `Hitbox` 클래스 (충돌 판정)**

*   **목적:** 공격 및 피격 판정을 위한 사각형 영역 정의.
*   **속성:**
    *   `rect`: `pygame.Rect` - 히트박스의 위치와 크기.
    *   `damage`: `int` - 이 히트박스가 주는 데미지 (공격용).
    *   `active`: `bool` - 히트박스 활성화 여부.
*   **메서드:**
    *   `__init__(self, x: int, y: int, width: int, height: int, damage: int = 0)`:
        *   **설명:** 히트박스 초기화.
    *   `update_position(self, parent_rect: pygame.Rect, offset_x: int, offset_y: int, facing: int)`:
        *   **설명:** 부모 객체(캐릭터)의 위치와 방향에 따라 히트박스 위치 업데이트.
        *   **반환:** `None`.
    *   `is_colliding(self, other_hitbox: 'Hitbox') -> bool`:
        *   **설명:** 다른 히트박스와 충돌하는지 확인.
        *   **반환:** `bool` - 충돌 여부.

---

##### **2.4 `CollisionManager` 클래스 (충돌 관리)**

*   **목적:** 게임 내 모든 충돌을 감지하고 처리.
*   **메서드:**
    *   `__init__(self)`:
        *   **설명:** 초기화.
    *   `check_player_attack(self, attacker: Player, defender: Player)`:
        *   **설명:** 공격자와 방어자 간의 공격 충돌 감지 및 데미지 처리.
        *   **매개변수:** `attacker` (`Player`), `defender` (`Player`).
        *   **반환:** `None`.

---

##### **2.5 `AIController` 클래스 (기본 AI)**

*   **목적:** P2 캐릭터의 행동을 결정하고 게임에 주입.
*   **속성:**
    *   `player`: `Player` - 제어할 캐릭터 객체.
    *   `opponent`: `Player` - 상대방 캐릭터 객체.
    *   `action_timer`: `float` - 다음 행동까지의 타이머.
*   **메서드:**
    *   `__init__(self, player: Player, opponent: Player)`:
        *   **설명:** AI 컨트롤러 초기화.
    *   `update(self, dt: float)`:
        *   **설명:** 게임 상태를 기반으로 AI의 다음 행동을 결정하고, 해당 행동을 `player` 객체에 지시.
        *   **매개변수:** `dt` (`float`).
        *   **반환:** `None`.
    *   `_decide_action(self) -> str`:
        *   **설명:** 현재 게임 상태를 기반으로 AI가 취할 행동(예: "jump", "attack", "move_left")을 결정. (초기에는 무작위 또는 단순 규칙).
        *   **반환:** `str` - 결정된 행동 문자열.

---

#### **3. AI 연동 인터페이스 (PyTorch 통합용)**

*   **`get_game_state(player1: Player, player2: Player) -> Dict[str, Any]`:**
    *   **설명:** 현재 게임의 모든 관련 상태(캐릭터 위치, 체력, 상태, 거리 등)를 PyTorch AI 모델이 이해할 수 있는 딕셔너리 형태로 반환.
    *   **매개변수:** `player1` (`Player`), `player2` (`Player`).
    *   **반환:** `Dict[str, Any]` - 게임 상태 딕셔너리.
*   **`apply_ai_action(player: Player, action: str)`:**
    *   **설명:** PyTorch AI 모델이 결정한 행동 문자열을 받아, 해당 `Player` 객체의 적절한 메서드를 호출하여 게임에 반영.
    *   **매개변수:** `player` (`Player`), `action` (`str`) - AI가 결정한 행동.
    *   **반환:** `None`.
