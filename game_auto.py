import subprocess
import time
import pyautogui
import os

# 게임 실행 파일의 절대 경로와, 실행될 디렉토리 경로를 지정합니다.
GAME_DIRECTORY = "/mnt/d/progress/AI_Battle_Arena/Ikemen_GO"
GAME_EXECUTABLE = "./Ikemen_GO_Linux"

def run_game_automation():
    """
    Ikemen GO 게임을 실행하고 키보드 입력을 자동화합니다.
    """
    game_process = None
    try:
        # 1. 게임 실행
        print(f"Ikemen GO를 실행합니다... (from {GAME_DIRECTORY}) ")
        # cwd를 지정하여 게임이 자신의 리소스 파일을 찾도록 합니다.
        game_process = subprocess.Popen(GAME_EXECUTABLE, cwd=GAME_DIRECTORY)
        
        # 게임이 로딩될 때까지 충분히 기다립니다.
        print("게임 로딩 대기 중... (10초)")
        time.sleep(10)

        # 2. 메인 메뉴에서 VS 모드로 진입
        print("메인 메뉴 진입 (Enter)")
        pyautogui.press('enter')
        time.sleep(1)

        print("VS MODE로 이동 (Down)")
        pyautogui.press('down')
        time.sleep(1)

        print("VS MODE 선택 (Enter)")
        pyautogui.press('enter')
        time.sleep(2)

        # 3. 캐릭터 선택 (P1)
        print("P1 캐릭터 선택 (Enter)")
        pyautogui.press('enter')
        time.sleep(1)

        # 4. 캐릭터 선택 (P2)
        print("P2 캐릭터 선택 (Enter)")
        pyautogui.press('enter')
        time.sleep(2)

        print("자동화 스크립트가 완료되었습니다.")

    except FileNotFoundError:
        print(f"오류: 게임 실행 파일을 찾을 수 없습니다. 경로를 확인해주세요: {os.path.join(GAME_DIRECTORY, GAME_EXECUTABLE)}")
    except Exception as e:
        print(f"오류가 발생했습니다: {e}")
    finally:
        # 스크립트 종료 시 게임 프로세스도 함께 종료
        if game_process:
            print("Ikemen GO 프로세스를 종료합니다.")
            game_process.terminate()

if __name__ == "__main__":
    run_game_automation()
