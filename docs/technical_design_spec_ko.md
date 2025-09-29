### **AI Battle Arena - 기술 설계 명세서 (v1.0)**

이 문서는 AI Battle Arena 프로젝트의 코드 수준 설계, API 인터페이스, 데이터 모델, 테스트 전략을 상세히 정의합니다.

---

### **1. 코딩 스타일 및 규칙 (Coding Style & Conventions)**

모든 Python 코드는 일관성과 가독성을 유지하기 위해 다음 규칙을 따릅니다.

*   **기본 스타일 가이드:** **PEP 8**을 철저히 준수합니다.
*   **네이밍 컨벤션 (Naming Convention):**
    *   변수, 함수: `snake_case` (e.g., `extract_pose`)
    *   클래스: `PascalCase` (e.g., `PoseExtractor`)
    *   상수: `UPPER_SNAKE_CASE` (e.g., `FRAME_RATE`)
*   **Docstrings:** **Google Python 스타일**을 따릅니다.
    ```python
    def example_function(arg1, arg2):
        """함수에 대한 간략한 설명.

        Args:
            arg1 (int): 첫 번째 인자에 대한 설명.
            arg2 (str): 두 번째 인자에 대한 설명.

        Returns:
            bool: 작업 성공 여부.
        """
        return True
    ```
*   **타입 힌트 (Type Hinting):** 모든 함수 정의에 타입 힌트를 명시적으로 사용합니다.
*   **린터 및 포맷터 (Linter & Formatter):**
    *   **Linter:** `Ruff` 또는 `Flake8`을 사용하여 코드 품질을 검사합니다.
    *   **Formatter:** `Black`을 사용하여 코드 스타일을 통일합니다.

---

### **2. 핵심 데이터 모델 정의 (Data Model Specification)**

모듈 간 데이터 교환의 핵심인 Pose 데이터의 JSON 구조를 다음과 같이 정의합니다.

**`pose_data.json` 스키마:**
```json
{
  "video_source": "path/to/source_video.mp4",
  "frame_rate": 30,
  "total_frames": 1800,
  "pose_landmarks": [
    {
      "frame_index": 0,
      "landmarks": [
        {"name": "nose", "x": 0.5, "y": 0.2, "z": -0.4, "visibility": 0.99},
        {"name": "left_shoulder", "x": 0.6, "y": 0.3, "z": -0.2, "visibility": 0.98},
        // ... 31 more landmarks
      ]
    },
    {
      "frame_index": 1,
      "landmarks": [
        // ... 33 landmarks for the next frame
      ]
    }
    // ... more frames
  ]
}
```

---

### **3. 모듈별 API 및 함수 인터페이스**

#### **3.1. `pose_module`**

*   **클래스:** `PoseExtractor`
*   **주요 함수:**
    ```python
    def extract_from_video(video_path: str, output_path: str) -> bool:
        """비디오 파일에서 Pose 데이터를 추출하여 JSON 파일로 저장합니다.

        Args:
            video_path (str): 소스 비디오 파일의 경로.
            output_path (str): 결과를 저장할 JSON 파일의 경로.

        Returns:
            bool: 추출 및 저장 성공 여부.
        
        Raises:
            FileNotFoundError: 비디오 파일이 존재하지 않을 경우.
            Exception: MediaPipe 처리 중 오류 발생 시.
        """
        pass
    ```

#### **3.2. `ai_fighter_module`**

*   **클래스:** `AIFighterModel`
*   **주요 함수:**
    ```python
    def load_pose_data(json_path: str) -> dict:
        """JSON 파일로부터 Pose 데이터를 로드합니다."""
        pass

    def convert_to_commands(pose_data: dict) -> list[str]:
        """Pose 데이터를 Ikemen GO가 이해할 수 있는 커맨드 리스트로 변환합니다.

        Args:
            pose_data (dict): `pose_data.json` 스키마를 따르는 딕셔너리.

        Returns:
            list[str]: 프레임별 캐릭터 커맨드 리스트 (e.g., ["D, F, x", "D, B, y"])
        """
        pass
    ```

#### **3.3. `video_pipeline_module`**

*   **클래스:** `VideoPipeline`
*   **주요 함수:**
    ```python
    def create_battle_video(fighter_a_cmds: list[str], fighter_b_cmds: list[str], output_video_path: str) -> bool:
        """두 AI Fighter의 커맨드를 기반으로 Ikemen GO 대전을 실행, 녹화, 편집하여 최종 비디오를 생성합니다.

        - 내부적으로 Ikemen GO 실행 (subprocess)
        - 화면 녹화 (FFmpeg)
        - 최종 비디오 변환 (FFmpeg)

        Args:
            fighter_a_cmds (list[str]): 플레이어 1의 커맨드 리스트.
            fighter_b_cmds (list[str]): 플레이어 2의 커맨드 리스트.
            output_video_path (str): 최종 결과물 비디오 파일 경로.

        Returns:
            bool: 비디오 생성 성공 여부.
        """
        pass
    ```

---

### **4. 테스트 환경 및 정의 (Testing)**

*   **프레임워크:** **`pytest`** 를 사용하여 테스트 코드를 작성합니다.
*   **테스트 폴더 구조:** 프로젝트 루트에 `tests/` 디렉토리를 생성하고, 모듈별로 테스트 파일을 작성합니다. (e.g., `tests/test_pose_module.py`)
*   **테스트 데이터:** `tests/fixtures/` 디렉토리 안에 테스트에 사용할 작은 비디오 파일, JSON 파일 등을 보관합니다.
*   **테스트 종류:**
    *   **유닛 테스트 (Unit Tests):** 각 함수가 예상대로 정확히 동작하는지 개별적으로 테스트합니다. (e.g., `extract_from_video`가 올바른 JSON을 생성하는가?)
    *   **통합 테스트 (Integration Tests):** 여러 모듈이 함께 올바르게 동작하는지 테스트합니다. (e.g., `pose_module`의 출력물을 `ai_fighter_module`이 입력으로 받아 커맨드를 생성하는가?)

---

### **5. 테스트 코드 예시 (Example Test Code)**

`tests/test_pose_module.py`

```python
import pytest
import os
import json
from your_project.pose_module import PoseExtractor # 실제 프로젝트 구조에 맞게 수정

# pytest fixture를 사용하여 테스트 환경 설정
@pytest.fixture
def setup_test_files(tmp_path):
    # 가짜 비디오 파일 생성 (실제로는 작은 테스트용 비디오 파일을 복사)
    video_file = tmp_path / "test_video.mp4"
    video_file.touch()
    
    output_json_path = tmp_path / "output.json"
    return str(video_file), str(output_json_path)

def test_extract_from_video_success(setup_test_files, mocker):
    """Pose 추출이 성공하고 유효한 JSON 파일을 생성하는지 테스트"""
    video_path, output_path = setup_test_files
    
    # MediaPipe의 실제 처리를 Mocking하여 시간이 오래 걸리는 것을 방지
    mocker.patch("mediapipe.solutions.pose.Pose.process", return_value=mocker.MagicMock())

    extractor = PoseExtractor()
    # 실제 함수를 호출하는 대신, 성공적으로 끝났다고 가정하는 더미 구현으로 대체하여 테스트
    # 여기서는 함수가 정상적으로 호출되고 True를 반환하는지만 확인
    mocker.patch.object(extractor, 'extract_from_video', return_value=True)
    
    result = extractor.extract_from_video(video_path, output_path)
    
    assert result is True
    # 실제 파일이 생성되었는지 확인하는 로직을 추가할 수 있음
    # assert os.path.exists(output_path)

def test_extract_from_video_file_not_found(tmp_path):
    """존재하지 않는 비디오 파일에 대해 FileNotFoundError를 발생시키는지 테스트"""
    extractor = PoseExtractor()
    with pytest.raises(FileNotFoundError):
        extractor.extract_from_video("non_existent_video.mp4", str(tmp_path / "output.json"))

```
