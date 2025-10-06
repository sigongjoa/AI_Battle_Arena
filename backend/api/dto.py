# api/dto.py
from typing import List, Optional

from pydantic import BaseModel


# 1.1. 캐릭터 정보
class MoveDTO(BaseModel):
    name: str
    description: str
    input: str
    frameData: str


class CharacterDTO(BaseModel):
    id: int
    name: str
    description: str
    image: str
    profileImage: str
    vsImage: str
    thumbnail: str
    color: str


# 1.2. 게임 상태 (WebSocket용)
class PlayerStateDTO(BaseModel):
    health: int
    super_gauge: int
    position: tuple[int, int]  # (x, y)
    current_action: str  # e.g., "IDLE", "WALK", "HADOKEN"


class GameStateDTO(BaseModel):
    match_id: str
    timer: int
    player1: PlayerStateDTO
    player2: PlayerStateDTO
    winner: Optional[int] = None  # 승리한 플레이어의 id


# 1.3. 강화학습 메트릭 (WebSocket용)
class TrainingMetricsDTO(BaseModel):
    session_id: str
    step: int
    episode: int
    loss: float
    reward: float
    q_value: Optional[float] = None
    episode_length: int


# 1.4. 매치업 분석 (API용)
class MatchupRequest(BaseModel):
    player1_name: str
    player2_name: str


class MatchupResponse(BaseModel):
    player1_analysis: str
    player2_analysis: str


# 1.5. 캐릭터 테마 응답 (API용)
class CharacterThemeResponse(BaseModel):
    theme: str
    attributes: List[str]


# 1.6. 캐릭터 데이터 (API용)
class AppearanceData(BaseModel):
    modelId: str
    textureId: str
    colorScheme: List[str]
    parts: List[str]


class SkillData(BaseModel):
    name: str
    effect: str
    animationId: str


class ParameterData(BaseModel):
    health: int
    attackPower: int
    defense: int
    speed: int


class CharacterData(BaseModel):
    id: str
    theme: str
    appearance: AppearanceData
    skills: List[SkillData]
    parameters: ParameterData


# 1.7. 캐릭터 생성 요청 (API용)
class CharacterGenerationRequest(BaseModel):
    theme: str
    attributes: List[str]
