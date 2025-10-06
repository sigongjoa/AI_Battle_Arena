from typing import Dict, Any, List
import random

class CharacterGenerator:
    """
    캐릭터 테마와 속성을 기반으로 캐릭터의 외형, 스킬, 파라미터를 생성하는 모듈.
    """

    def __init__(self):
        # 테마-에셋 매핑 테이블 (간단한 예시)
        self.theme_asset_map = {
            "racing": {
                "appearance_parts": ["racing_helmet", "racing_suit", "tire_accessory"],
                "skills": ["quick_dash", "smoke_screen"],
            },
            "construction": {
                "appearance_parts": ["hard_hat", "safety_vest", "wrench_tool"],
                "skills": ["concrete_throw", "heavy_smash"],
            },
            "cooking": {
                "appearance_parts": ["chef_hat", "apron", "frying_pan"],
                "skills": ["flaming_wok", "spicy_kick"],
            },
            "fashion": {
                "appearance_parts": ["stylish_hat", "designer_suit", "bling_chain"],
                "skills": ["glamour_pose", "distracting_flash"],
            },
            "travel": {
                "appearance_parts": ["backpack", "hiking_boots", "camera"],
                "skills": ["fast_travel", "survival_instinct"],
            },
            "general": {
                "appearance_parts": ["basic_shirt", "basic_pants", "basic_shoes"],
                "skills": ["punch", "kick"],
            },
        }
        # 총 능력치 (예시)
        self.total_stat_points = 300

    def generate_character_data(self, theme: str, attributes: List[str]) -> Dict[str, Any]:
        """
        추출된 테마와 속성을 기반으로 캐릭터의 외형, 스킬, 파라미터를 생성한다.
        """
        character_data: Dict[str, Any] = {
            "id": f"char_{random.randint(10000, 99999)}",
            "theme": theme,
            "appearance": self._generate_appearance(theme),
            "skills": self._generate_skills(theme, attributes),
            "parameters": self._generate_parameters(attributes),
        }
        return character_data

    def _generate_appearance(self, theme: str) -> Dict[str, Any]:
        parts = self.theme_asset_map.get(theme, self.theme_asset_map["general"])["appearance_parts"]
        selected_parts = random.sample(parts, k=min(len(parts), 2)) # 2개 파츠 선택 예시
        return {"modelId": "base_model", "textureId": theme, "colorScheme": ["#" + ''.join(random.choices('0123456789abcdef', k=6)) for _ in range(2)], "parts": selected_parts}

    def _generate_skills(self, theme: str, attributes: List[str]) -> List[Dict[str, str]]:
        skills = self.theme_asset_map.get(theme, self.theme_asset_map["general"])["skills"]
        generated_skills = []
        for skill_name in skills:
            generated_skills.append({"name": skill_name, "effect": f"{skill_name}_effect", "animationId": f"{skill_name}_anim"})
        return generated_skills

    def _generate_parameters(self, attributes: List[str]) -> Dict[str, int]:
        # 총 능력치 분배 로직 (간단한 예시)
        params = {"health": 0, "attackPower": 0, "defense": 0, "speed": 0}
        remaining_points = self.total_stat_points

        # 속성에 따라 가중치 부여
        attribute_weights = {
            "speed": 1.5,
            "agility": 1.2,
            "strength": 1.5,
            "durability": 1.2,
            "precision": 1.1,
            "charisma": 1.0,
            "healing": 1.0,
            "balance": 1.0,
        }

        # 각 파라미터에 기본 점수 할당 및 속성 가중치 적용
        base_param_distribution = {"health": 0.3, "attackPower": 0.25, "defense": 0.25, "speed": 0.2}
        weighted_distribution = {k: v for k, v in base_param_distribution.items()}

        for attr in attributes:
            if attr in attribute_weights:
                # 속성이 특정 파라미터에 더 영향을 미치도록 매핑 (간단화)
                if attr == "speed" or attr == "agility":
                    weighted_distribution["speed"] += 0.1 * attribute_weights[attr]
                elif attr == "strength":
                    weighted_distribution["attackPower"] += 0.1 * attribute_weights[attr]
                elif attr == "durability":
                    weighted_distribution["defense"] += 0.1 * attribute_weights[attr]
                elif attr == "healing":
                    weighted_distribution["health"] += 0.1 * attribute_weights[attr]

        # 정규화
        total_weight = sum(weighted_distribution.values())
        normalized_distribution = {k: v / total_weight for k, v in weighted_distribution.items()}

        # 총 능력치 분배
        for param, ratio in normalized_distribution.items():
            params[param] = round(self.total_stat_points * ratio)

        # 최소값 보장 (예시)
        for param in params:
            if params[param] < 10: # 최소 10점 보장
                params[param] = 10

        return params
