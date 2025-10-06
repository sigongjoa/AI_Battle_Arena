from src.player import Player


class AIFighter:
    """
    Pose 데이터를 기반으로 캐릭터 커맨드를 생성하고,
    이를 Ikemen GO가 읽을 수 있는 파일로 출력하는 클래스.
    """

    def convert_pose_to_commands(self, pose_data_path: str) -> list[str]:
        """
        Pose 데이터 JSON을 읽어 간단한 커맨드 리스트로 변환합니다.
        (이 함수는 초기 MVP 단계에서는 더미 커맨드를 반환합니다)
        """
        # TODO: 실제 Pose 데이터를 분석하여 커맨드를 생성하는 로직 구현
        dummy_commands = [
            "F, F",  # 전진
            "D, F, a",  # 파동권 커맨드 (예시)
            "B, B",  # 후진
            "D, B, b",  # 용권선풍각 커맨드 (예시)
            "U",  # 점프
        ] * 5  # 5번 반복
        return dummy_commands

    def write_commands_to_file(self, commands: list[str], output_path: str):
        """
        커맨드 리스트를 한 줄에 하나씩 파일에 씁니다.
        """
        with open(output_path, "w") as f:
            for command in commands:
                f.write(f"{command}\n")
        print(f"성공적으로 커맨드를 {output_path}에 저장했습니다.")


if __name__ == "__main__":
    ai_fighter = AIFighter()
    # 1. Pose 데이터로부터 커맨드 생성 (현재는 더미 데이터)
    commands = ai_fighter.convert_pose_to_commands("dummy_pose.json")

    # 2. Ikemen GO가 읽을 경로에 파일로 저장
    command_file_path = "Ikemen_GO/external/script/commands.txt"
    ai_fighter.write_commands_to_file(commands, command_file_path)
