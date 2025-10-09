# Phase 2 - 강화학습(RL) 기반 AI 파이터 개발을 위한 CI/CD 및 배포 자동화 계획

Phase 1을 건너뛰고, Phase 2의 강화학습(RL) 기반 AI 파이터 개발에 초점을 맞춘 CI/CD 및 배포 자동화 계획을 제안합니다.

Phase 2의 핵심은 웹 애플리케이션 배포보다는 강화학습 모델의 훈련 과정을 자동화하고, 그 결과물(학습된 모델, 로그)을 체계적으로 관리하는 것입니다.

## Phase 2를 위한 CI/CD 및 배포(훈련 자동화) 계획

Phase 2의 목표는 안정적인 강화학습 환경을 구축하고 Baseline AI 파이터를 학습시키는 것입니다. CI/CD 파이프라인은 이 과정을 자동화하여 코드 변경이 있을 때마다 AI 모델이 일관된 환경에서 안정적으로 학습되고 검증되도록 보장합니다.

### 🏗️ 파이프라인 구조 (GitHub Actions 기준)

main 브랜치에 코드가 통합(merge)되면, 지정된 서버에서 자동으로 강화학습 훈련을 실행하고 결과물을 저장하는 것을 목표로 합니다.

#### 1. CI (Continuous Integration): 코드 통합 자동화

**실행 시점**: main 또는 develop 브랜치에 코드를 Push 하거나 Pull Request를 생성할 때.

**주요 작업**:

*   **Python Backend 검증**:
    *   Python 환경을 설정하고 `requirements.txt` 기반으로 의존성을 설치합니다.
    *   `flake8`, `black` 등으로 코드 스타일을 검사합니다.
    *   `pytest`를 사용하여 강화학습 환경(FightingEnv) 및 핵심 로직에 대한 단위 테스트를 실행하여 환경의 신뢰성을 확보합니다.

#### 2. CD (Continuous Deployment): 훈련 및 결과물 관리 자동화

**실행 시점**: main 브랜치에 코드가 병합(Merge)되었을 때.

**주요 작업**:

*   **훈련 서버에 접속**: SSH를 통해 강화학습 훈련을 진행할 서버에 접속합니다. (필요시 GPU 서버)
*   **훈련 환경 설정**:
    *   최신 코드를 `git pull` 합니다.
    *   `pip install -r backend/requirements.txt` 명령어로 최신 의존성을 설치합니다.
*   **강화학습 훈련 실행**:
    *   `train_rl_agent.py` 스크립트를 실행하여 AI 모델 학습을 시작합니다.
*   **결과물 아카이빙**:
    *   훈련이 완료되면 생성된 **학습 모델 파일(\*.zip)**과 TensorBoard 로그를 GitHub Actions의 Artifacts나 외부 저장소(예: AWS S3)에 업로드하여 버전을 관리하고 결과를 추적할 수 있도록 합니다.

### ⚙️ Phase 2를 위한 샘플 GitHub Actions 워크플로우

`.github/workflows/phase2-ci-cd.yml`

```yaml
name: Phase 2 - RL Training CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # --- CI: 코드 무결성 검사 ---
  ci-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r backend/requirements.txt
        pip install pytest flake8
    - name: Lint with flake8
      run: flake8 backend/ --count --select=E9,F63,F7,F82 --show-source --statistics
    - name: Test with pytest
      run: pytest tests/

  # --- CD: 강화학습 훈련 자동화 ---
  cd-training:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [ci-backend]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    # 1. 훈련 서버에 접속하여 훈련 스크립트 실행
    - name: Run RL Training on Server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.TRAINING_SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /path/to/your/project/AI_Battle_Arena
          git pull origin main
          pip install -r backend/requirements.txt
          # 백그라운드에서 훈련 실행 (nohup)
          nohup python train_rl_agent.py > training.log 2>&1 &

    # 2. (훈련이 끝난 후) 결과물을 다운로드하여 Artifacts로 저장
    # 이 단계는 훈련 시간에 따라 별도의 워크플로우로 분리하거나 수동으로 관리할 수 있습니다.
    - name: Archive Training Results
      run: |
        echo "훈련이 시작되었습니다. 결과물은 훈련 완료 후 서버에서 확인하거나 별도 워크플로우를 통해 수집할 수 있습니다."
