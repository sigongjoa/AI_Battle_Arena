# Phase 7: Step 0 - 환경 설정 및 기본 준비 (Foundation Setup)

## 1. 목표
Phase 7 구현을 위한 개발 환경을 설정하고, 필요한 라이브러리를 설치하며, 기존 게임 환경과의 기본적인 연동을 확인합니다.

## 2. 상세 계획

### 2.1. 프로젝트 환경 구성
*   **Python 3.10+ 가상 환경 (`venv` 또는 `Conda`) 생성 및 활성화.**
*   **`requirements.txt` 파일 업데이트 및 필요한 라이브러리 설치:**
    *   강화학습: `stable-baselines3`, `stable-baselines3-contrib` (ICM 모듈용)
    *   데이터 처리: `pandas`, `numpy`, `scikit-learn`
    *   리포팅/XAI: `jinja2`, `gTTS` 또는 `coqui_tts`, `moviepy`, `ffmpeg-python`
    *   (선택 사항) 딥러닝 프레임워크: `tensorflow` 또는 `pytorch` (다중 페르소나 모델 관리 및 RLHF 보상 모델 학습용)
*   **Git 저장소 초기화 및 기본 브랜치 설정.**

### 2.2. 기존 게임 환경 연동 확인
*   현재 개발 중인 격투 게임 환경이 RL 에이전트와 연동될 수 있는지 확인 (Observation, Action Space 정의).
*   기본적인 게임 실행 및 플레이 테스트를 통해 환경의 안정성 검증.

### 2.3. 로깅 시스템 초기화
*   `Log Collector`를 위한 기본 로깅 시스템 (Python `logging` 모듈) 설정.
*   `JSONL` 또는 `Parquet` 형식으로 로그를 저장할 디렉토리 구조 생성 및 파일명 규칙 정의.

## 3. Definition of Done (DoD)
*   Python 3.10+ 가상 환경이 성공적으로 생성 및 활성화되었고, 모든 필수 라이브러리가 `requirements.txt`에 명시된 버전으로 설치되었음.
*   Git 저장소가 초기화되었고, 개발 브랜치가 설정되었음.
*   RL 에이전트가 게임 환경과 성공적으로 상호작용(Observation 수신, Action 전송)할 수 있음을 확인하는 간단한 테스트 스크립트가 실행되었음.
*   기본 로깅 시스템이 설정되었고, 지정된 형식(`JSONL` 또는 `Parquet`)으로 로그 파일을 생성할 수 있는 디렉토리 구조가 준비되었음.