# api/routes.py
from fastapi import APIRouter, HTTPException
from typing import List

from .dto import CharacterDTO, MoveDTO, MatchupRequest, MatchupResponse
from ..data import game_data


router = APIRouter()



@router.get("/characters", response_model=List[CharacterDTO])
async def get_all_characters():
    """
    등록된 모든 캐릭터의 목록을 조회합니다.
    """
    return list(game_data.CHARACTERS_FOR_API.values())

@router.get("/characters/{character_id}/moves", response_model=List[MoveDTO])
async def get_character_moves(character_id: int):
    """
    특정 캐릭터의 기술 목록을 조회합니다.
    """
    if character_id not in game_data.MOVES_DATA:
        raise HTTPException(status_code=404, detail="Character not found")
    return game_data.MOVES_DATA[character_id]

@router.post("/analysis", response_model=MatchupResponse)
async def get_matchup_analysis(request: MatchupRequest):
    """
    두 캐릭터 간의 매치업 분석을 생성하고 결과를 반환합니다.
    (현재는 하드코딩된 분석을 반환합니다.)
    """
    # Gemini API를 사용하지 않고 하드코딩된 분석을 반환합니다.
    return MatchupResponse(
        player1_analysis=f"{request.player1_name}은(는) {request.player2_name}을(를) 상대로 강한 면모를 보입니다.",
        player2_analysis=f"{request.player2_name}은(는) {request.player1_name}을(를) 상대로 전략적인 접근이 필요합니다."
    )
