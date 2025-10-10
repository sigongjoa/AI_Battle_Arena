# Phase 2: 강화학습 AI 파이터 구현 진행 상황

이 문서는 Phase 2의 주요 구현 과제 진행 상황을 추적합니다.

---

## 1. 보상 계산 로직 분리 및 백엔드 이전

*   **상태:** 🟢 Done
*   **목표:** 프론트엔드에 구현된 보상 계산 로직을 백엔드로 이전하여 아키텍처를 개선합니다.
*   **완료 내용:**
    *   `fighting_env.py`에 `_calculate_reward` 메서드를 구현하여 보상 계산 로직을 이전했습니다.
    *   `RLAgentController.tsx`에서는 보상 관련 코드를 모두 제거하고, 게임의 원시 상태(raw state)만 백엔드로 전달하도록 수정했습니다.
    *   WebRTC를 통해 주고받는 메시지 타입을 `step_result`에서 `action_result`로 변경하여 새로운 데이터 구조를 반영했습니다.

### 완료 조건 (Definition of Done)
1.  Python 백엔드에 `RewardCalculator` 클래스 또는 그에 준하는 보상 계산 전용 모듈이 구현되어 있다.
2.  기존 프론트엔드(`RLAgentController.tsx`)에 있던 보상 계산 코드가 모두 제거되고, 백엔드로부터 받은 보상 값을 그대로 사용한다.
3.  `FightingEnv`의 `step` 함수가 백엔드의 보상 계산 모듈을 호출하여 리워드를 결정한다.
4.  새로운 보상 계산 로직에 대한 단위 테스트(pytest)가 작성되고, 모든 테스트를 통과한다.
5.  `evaluate_agent.py`를 실행했을 때, 에이전트가 보상을 정상적으로 받아 학습이 가능함이 확인된다.

---

## 2. 정책(Policy) 관리 시스템 구현

*   **상태:** 🟡 To Do
*   **목표:** `config.yaml`을 통해 여러 강화학습 알고리즘을 쉽게 교체하며 실험할 수 있는 유연한 시스템을 구축합니다.

### 완료 조건 (Definition of Done)
1.  `PolicyFactory`와 `PolicyManager` 클래스가 Python 백엔드에 구현되어 있다.
2.  `config.yaml` 파일에 `active_policy` 항목이 있으며, 이 값을 변경하는 것만으로 PPO, A2C 등 최소 2개 이상의 다른 알고리즘으로 학습을 시작할 수 있다.
3.  `train_rl_agent.py` 스크립트는 `PolicyManager`를 통해 `config.yaml`에 명시된 정책을 로드하여 학습을 진행한다.
4.  코드 수정 없이 설정 변경만으로 다른 정책을 사용한 학습이 오류 없이 시작되는 것이 확인된다.

---

## 3. CI/CD 파이프라인 완성

*   **상태:** 🟡 To Do
*   **목표:** `main` 브랜치에 코드가 병합될 때, 훈련 서버에서 AI 학습을 자동으로 실행하는 CI/CD 파이프라인을 완성합니다.

### 완료 조건 (Definition of Done)
1.  `.github/workflows/phase2-ci-cd.yml` 파일이 `main` 브랜치에 존재한다.
2.  `main` 브랜치에 코드가 푸시(push)되면 GitHub Actions 워크플로우가 자동으로 실행된다.
3.  워크플로우의 CI 단계(코드 린팅, 단위 테스트)가 모두 성공적으로 통과한다.
4.  워크플로우의 CD 단계가 훈련 서버에 SSH로 접속하는 데 성공한다.
5.  서버에서 `train_rl_agent.py` 스크립트가 성공적으로 실행되어, AI 모델 학습이 시작되는 것이 서버 로그 등을 통해 확인된다.

---

## 4. 시연용 웹 페이지 개발

*   **상태:** 🟡 To Do
*   **목표:** 학습된 AI 모델의 성능과 학습 과정을 보여주는 웹 페이지를 개발합니다.

### 완료 조건 (Definition of Done)
*   **A: 라이브 데모 페이지**
    1.  학습된 AI 모델을 선택할 수 있는 UI가 존재한다.
    2.  '대전 시작' 버튼을 누르면, 백엔드가 선택된 모델을 로드하고 게임을 시작한다.
    3.  웹 화면에 AI가 조종하는 캐릭터가 등장하여 실시간으로 플레이하는 모습이 렌더링된다.
*   **B: 학습 대시보드 페이지**
    1.  GitHub Pages를 통해 배포된 대시보드 페이지가 존재한다.
    2.  페이지에 접속하면 특정 학습 세션의 보상 곡선, 승률, 에피소드 길이 그래프가 시각적으로 표시된다.
    3.  표시되는 데이터는 실제 TensorBoard 로그를 기반으로 한다.

---

## 5. 사용자 수행 필요 사항 (User Action Items)

현재까지 구현된 사항들을 바탕으로, 다음 단계 진행을 위해 사용자께서 수행해주셔야 할 작업들입니다.

### 5.1. CI/CD를 위한 GitHub Secrets 설정

`deploy-to-training-server` GitHub Actions Job이 정상적으로 동작하려면, 훈련 서버 접속을 위한 SSH 자격 증명을 GitHub Secrets에 설정해야 합니다.

*   **수행 방법:**
    1.  GitHub 저장소로 이동합니다.
    2.  `Settings` 탭을 클릭합니다.
    3.  좌측 메뉴에서 `Secrets and variables` -> `Actions`를 선택합니다.
    4.  `New repository secret` 버튼을 클릭하여 다음 세 가지 Secret을 추가합니다.
        *   `SSH_USERNAME`: 훈련 서버에 로그인할 사용자 이름 (예: `ubuntu`)
        *   `SSH_HOST`: 훈련 서버의 IP 주소 또는 호스트 이름 (예: `192.168.1.100` 또는 `your-server.com`)
        *   `SSH_PRIVATE_KEY`: 훈련 서버에 접속할 수 있는 SSH Private Key 내용 전체 (-----BEGIN OPENSSH PRIVATE KEY----- 부터 -----END OPENSSH PRIVATE KEY----- 까지 모두 포함)

### 5.2. `phase2-ci-cd.yml`의 배포 및 훈련 트리거 명령 구현

현재 `.github/workflows/phase2-ci-cd.yml` 파일의 `deploy-to-training-server` Job에는 배포 및 훈련 트리거 명령이 주석 처리된 플레이스홀더로 존재합니다. 이를 실제 서버 환경에 맞게 수정해야 합니다.

*   **수행 방법:**
    1.  `.github/workflows/phase2-ci-cd.yml` 파일을 엽니다.
    2.  `Deploy and Trigger Training` 스텝 아래의 주석 처리된 `scp` 및 `ssh` 예시 명령을 참고하여, 실제 서버에 파일을 복사하고 `train_rl_agent.py` 스크립트를 실행하는 명령으로 대체합니다.
        *   **예시:**
            ```yaml
            - name: Deploy and Trigger Training
              run: |
                scp -o StrictHostKeyChecking=no -r . ${{ secrets.SSH_USERNAME }}@${{ secrets.SSH_HOST }}:/path/to/your/project
                ssh -o StrictHostKeyChecking=no ${{ secrets.SSH_USERNAME }}@${{ secrets.SSH_HOST }} "cd /path/to/your/project && python train_rl_agent.py"
            ```
        *   `/path/to/your/project`는 훈련 서버에 프로젝트 파일이 위치할 실제 경로로 변경해야 합니다.

### 5.3. 프론트엔드 로컬 테스트

`RLDemoPage` 및 `RLDashboardPage`의 기본 UI가 구현되었으며, 프론트엔드 내비게이션에 통합되었습니다. 로컬에서 프론트엔드 애플리케이션을 실행하여 UI가 예상대로 표시되는지 확인해주세요.

*   **수행 방법:**
    1.  터미널에서 `AI_Battle_Arena/arcade-clash` 디렉토리로 이동합니다.
    2.  `npm install`을 실행하여 의존성을 설치합니다 (최초 1회).
    3.  `npm start`를 실행하여 개발 서버를 시작합니다.
    4.  브라우저에서 애플리케이션에 접속하여 메인 메뉴에서 `RL Demo` 및 `RL Dashboard` 페이지로 이동하여 UI를 확인합니다.

### 5.4. 백엔드 로컬 테스트 (훈련 및 평가)

정책 관리 시스템과 `evaluate_agent.py` 스크립트가 구현되었습니다. 로컬에서 훈련 및 평가 스크립트를 실행하여 정상 동작하는지 확인해주세요.

*   **수행 방법:**
    1.  `config.yaml` 파일을 열어 `rl_training.active_policy` 값을 `PPO` 또는 `A2C`로 변경하며 훈련을 시작합니다.
    2.  터미널에서 `AI_Battle_Arena` 프로젝트 루트 디렉토리로 이동합니다.
    3.  `python train_rl_agent.py`를 실행하여 훈련이 시작되는지 확인합니다.
    4.  훈련 완료 후 생성된 모델 파일 (`./models/ppo_fighting_env_multi_agent/ppo_final_model.zip` 등)을 사용하여 `python evaluate_agent.py --model_path <모델_경로> --policy_name <정책_이름>` 명령으로 평가를 실행하고 결과가 출력되는지 확인합니다.

### 5.5. 피드백 제공

위 단계를 수행하면서 발견된 문제점이나 추가적인 개선 사항에 대한 피드백을 제공해주시면 감사하겠습니다.

