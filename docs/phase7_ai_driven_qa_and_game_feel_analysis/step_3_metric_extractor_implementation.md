# Phase 7: Step 3 - Metric Extractor 구현 (Advanced Metric Calculation)

## 1. 목표
수집된 원시 로그 데이터에서 4대 QA 계층에 해당하는 정량적 지표를 추출하고, 특히 '손맛'과 '리듬' 기반의 고급 지표를 계산하여 `Report Database`에 저장합니다.

## 2. 상세 계획

### 2.1. 기존 QA 계층별 메트릭 추출
*   **기본 메트릭 추출 로직 구현:** `StabilityScore` (충돌 없는 평균 프레임 유지율), `BalanceScore` (캐릭터 간 승률의 표준편차 역수), `ResponsivenessScore` (평균 입력 레이턴시의 역수) 등 Phase 7 문서에 정의된 기본 메트릭 계산 로직 개발.
*   **데이터 파싱 및 계산:** `Pandas`, `NumPy`를 활용하여 `JSONL` 로그 파일에서 필요한 데이터를 효율적으로 파싱하고 계산.

### 2.2. '손맛' (Immersion) 및 '리듬' 기반 지표 추가
*   **새로운 지표 계산 로직 구현:** `TensionIndex`, `ComboRhythmScore`, `CounterPlayScore` 등 '리듬' 기반 지표 계산 알고리즘 개발.
*   **시계열 데이터 분석:** 액션 시퀀스의 시계열 데이터를 분석하여 지표를 도출하는 로직 구현. `Scikit-learn` 등의 통계/머신러닝 라이브러리 활용 가능성 검토.

### 2.3. 메트릭 저장 및 관리
*   추출된 모든 메트릭을 `Report Database` (예: `SQLite` 또는 `PostgreSQL`)에 저장하는 인터페이스 구현.
*   **메트릭 정의서 작성:** 각 메트릭의 계산 방식, 단위, 의미를 명확히 기술한 내부 문서 작성.

## 3. Definition of Done (DoD)
*   `StabilityScore`, `BalanceScore`, `ResponsivenessScore` 등 기본 QA 메트릭 추출 로직이 구현되었고, 단위 테스트를 통해 정확성을 검증했음.
*   `TensionIndex`, `ComboRhythmScore`, `CounterPlayScore` 등 '손맛' 및 '리듬' 기반 고급 지표 계산 로직이 구현되었고, 단위 테스트를 통해 정확성을 검증했음.
*   `Pandas` 및 `NumPy`를 활용하여 `JSONL` 로그 파일에서 데이터를 효율적으로 파싱하고 메트릭을 계산하는 파이프라인이 구축되었음.
*   추출된 모든 메트릭을 `Report Database`에 저장하는 인터페이스가 구현되었고, 데이터베이스에 성공적으로 저장됨을 확인했음.
*   모든 메트릭에 대한 계산 방식, 단위, 의미를 명확히 기술한 내부 메트릭 정의서가 작성되었음.