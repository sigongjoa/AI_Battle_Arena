from typing import Dict, Any, List
import random

class AdAnalyzer:
    """
    광고 텍스트를 분석하여 캐릭터 테마 및 관련 속성을 추출하는 모듈.
    초기 구현에서는 간단한 키워드 매핑을 사용하며, 추후 NLP 라이브러리와 연동하여 고도화한다.
    """

    def __init__(self):
        # 미리 정의된 테마 및 속성 매핑 (초기 버전)
        self.theme_keywords = {
            "레이싱": {"theme": "racing", "attributes": ["speed", "agility"]},
            "자동차": {"theme": "racing", "attributes": ["speed", "durability"]},
            "건설": {"theme": "construction", "attributes": ["strength", "durability"]},
            "공구": {"theme": "construction", "attributes": ["strength", "precision"]},
            "요리": {"theme": "cooking", "attributes": ["precision", "agility"]},
            "음식": {"theme": "cooking", "attributes": ["healing", "durability"]},
            "패션": {"theme": "fashion", "attributes": ["charisma", "agility"]},
            "옷": {"theme": "fashion", "attributes": ["charisma", "defense"]},
            "여행": {"theme": "travel", "attributes": ["endurance", "agility"]},
            "휴가": {"theme": "travel", "attributes": ["healing", "charisma"]},
        }
        self.default_theme = {"theme": "general", "attributes": ["balance"]}

    def extract_character_theme(self, ad_text: str) -> Dict[str, Any]:
        """
        광고 텍스트에서 캐릭터 테마와 관련 속성을 추출한다.
        """
        ad_text_lower = ad_text.lower()

        for keyword, data in self.theme_keywords.items():
            if keyword.lower() in ad_text_lower:
                return data
        
        # 정의되지 않은 테마 처리 정책: 'general' 테마 반환
        return self.default_theme

