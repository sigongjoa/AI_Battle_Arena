# 📚 AI Battle Arena - 프로젝트 문서

**마지막 정리**: 2025-11-20

---

## 🎯 현재 진행 중인 Phases

```
✅ Phase 1: 기본 게임 엔진            (완료)
✅ Phase 2: RL 강화학습 & CI/CD       (완료)
✅ Phase 4: React 프론트엔드          (완료)
✅ Phase 5: Battle Rhythm 시스템      (완료)
🟡 Phase 6: AI 캐릭터 생성             (진행 중)
🟡 Phase 7: AI QA & 게임 필 분석       (진행 중)
🔵 Phase 8: 3D 리깅 시스템           (조사 완료, 구현 준비)
```

> **Phase 문서 표준화**: `_PHASE_TEMPLATE/` 참조 - 모든 Phase는 일관된 템플릿을 따릅니다.

---

## 📁 문서 구조

```
docs/
├── README.md                                (이 파일)
├── _PHASE_TEMPLATE/                         ⭐ 표준 Phase 템플릿 (모든 Phase 참조)
│   ├── README.md                            (Phase 개요 템플릿)
│   ├── 01_planning.md                       (기획 및 문제 정의 템플릿)
│   ├── 02_technical_spec.md                 (기술 명세서 템플릿)
│   ├── 03_implementation_plan.md             (구현 계획 템플릿)
│   ├── 04_test_plan.md                      (테스트 계획 템플릿)
│   ├── 05_progress_report.md                (진행 현황 보고서 템플릿)
│   ├── 06_lessons_learned.md                (완료 보고서 템플릿)
│   └── TEMPLATE_GUIDE.md                    📖 템플릿 사용 가이드
│
├── phase1/                                  게임 엔진 (Pygame) ✅ 완료
│   ├── pygame_fight.md
│   ├── detailed_software_design_ko.md
│   ├── technical_design_spec_ko.md
│   └── [8개]
│
├── phase2/                                  RL 학습 & CI/CD ✅ 완료
│   ├── 강화학습_기획서.md
│   ├── ci_cd_and_rl_training_automation_plan.md
│   └── [10개]
│
├── phase4/                                  React 프론트엔드 ✅ 완료
│   ├── 기획서.md
│   ├── frontend_wireframe.md
│   └── [5개]
│
├── phase5_battle_rhythm/                    리듬 기반 배틀 ✅ 완료
│   ├── 기획_및_문제_정의서.md
│   ├── 기술_명세서.md
│   └── [8개]
│
├── phase6_character_creation_system/        AI 캐릭터 생성 🟡 진행중
│   ├── 기획_및_문제_정의서.md
│   └── [5개]
│
├── phase7_ai_driven_qa_and_game_feel_analysis/  AI QA 🟡 진행중
│   ├── step_0_foundation_setup.md
│   └── [18개]
│
├── phase8_3d_rigging_system/                3D 리깅 시스템 🔵 조사완료
│   ├── README.md
│   ├── 01_research_plan.md
│   ├── 02_phase1_findings.md
│   └── 03_phase2_poc_plan.md
│
├── protocal_WebRTC/                         WebRTC 통신 프로토콜
│   ├── 기획서.md
│   └── [16개]
│
└── coding_guidelines/                       코딩 가이드라인
    └── coding_conventions.md
```

### 📌 템플릿 표준화 (2025-11-20)

**새로운 Phase 시작 시 체크리스트**:
```
[ ] _PHASE_TEMPLATE/ 폴더 내용 복사
[ ] README.md에서 Phase X를 실제 번호로 변경
[ ] 기획 단계 진행 (01_planning.md 작성)
[ ] 설계 단계 진행 (02_technical_spec.md 작성)
[ ] 나머지 문서는 단계별로 진행하며 작성
```

---

## 🚀 빠른 시작

### Phase 1: 게임 엔진 이해하기
```
1. phase1/pygame_fight.md                    (게임 기본 로직)
2. phase1/detailed_software_design_ko.md     (시스템 아키텍처)
3. phase1/rl_ai_fighter_design_ko.md         (RL 파이터 설계)
```

### Phase 2: RL 학습 설정
```
1. phase2/강화학습_기획서.md                 (개요)
2. phase2/기술_명세서.md                     (상세 기술)
3. phase2/ci_cd_and_rl_training_automation_plan.md  (자동화)
```

### Phase 4: 프론트엔드 개발
```
1. phase4/기획서.md                          (기획)
2. phase4/frontend_wireframe.md              (UI 구조)
3. protocal_WebRTC/communication_protocol_and_code_spec.md  (통신)
```

### Phase 5: 리듬 시스템 구현
```
1. phase5_battle_rhythm/기획_및_문제_정의서.md
2. phase5_battle_rhythm/기술_명세서.md
3. phase5_battle_rhythm/구현_알고리즘_명세서.md
```

### Phase 6: AI 캐릭터 생성
```
1. phase6_character_creation_system/기획_및_문제_정의서.md
2. phase6_character_creation_system/기술_명세서.md
```

### Phase 7: AI QA 시스템
```
1. phase7_ai_driven_qa_and_game_feel_analysis/step_0_foundation_setup.md
2. phase7_ai_driven_qa_and_game_feel_analysis/step_1_advanced_simulation_environment.md
3. [step 2-6 순서대로]
```

---

## 📊 Phase별 상태

| Phase | 이름 | 상태 | 문서 수 |
|-------|------|------|--------|
| 1 | 게임 엔진 | ✅ 완료 | 9개 |
| 2 | RL & CI/CD | ✅ 완료 | 10개 |
| 4 | React 프론트엔드 | ✅ 완료 | 7개 |
| 5 | Battle Rhythm | ✅ 완료 | 10개 |
| 6 | AI 캐릭터 생성 | 🟡 진행 중 | 7개 |
| 7 | AI QA | 🟡 진행 중 | 20개 |
| WebRTC | 통신 프로토콜 | ✅ 완료 | 16개 |

**총 문서**: 79개

---

## 🎓 역할별 추천 읽기

### 🎮 게임 개발자
```
1. phase1/pygame_fight.md
2. phase1/detailed_software_design_ko.md
3. phase5_battle_rhythm/기술_명세서.md
4. phase5_battle_rhythm/구현_알고리즘_명세서.md
```

### 🤖 RL/AI 개발자
```
1. phase2/강화학습_기획서.md
2. phase2/기술_명세서.md
3. phase1/rl_ai_fighter_design_ko.md
4. phase6_character_creation_system/기술_명세서.md
5. phase7_ai_driven_qa_and_game_feel_analysis/conceptual_design.md
```

### 🌐 프론트엔드 개발자
```
1. phase4/기획서.md
2. phase4/frontend_wireframe.md
3. protocal_WebRTC/communication_protocol_and_code_spec.md
4. protocal_WebRTC/frontend_spec.md
```

### 🔧 백엔드 개발자
```
1. protocal_WebRTC/backend_spec.md
2. protocal_WebRTC/communication_protocol_and_code_spec.md
3. phase2/ci_cd_and_rl_training_automation_plan.md
```

### ✅ QA/테스트 담당자
```
1. phase7_ai_driven_qa_and_game_feel_analysis/step_0_foundation_setup.md
2. phase7_ai_driven_qa_and_game_feel_analysis/step_6_integration_and_testing.md
3. phase5_battle_rhythm/테스트_계획_및_성공_기준.md
```

---

## 📝 각 Phase의 핵심 문서

### Phase 1: 게임 엔진
- `pygame_fight.md` ⭐ **시작하기 좋은 문서**
- `detailed_software_design_ko.md` - 시스템 아키텍처
- `rl_ai_fighter_design_ko.md` - RL 파이터 설계

### Phase 2: RL & CI/CD
- `강화학습_기획서.md` ⭐ **한글 가이드**
- `기술_명세서.md` - RL 시스템
- `ci_cd_and_rl_training_automation_plan.md` - 자동화

### Phase 4: React 프론트엔드
- `기획서.md` ⭐ **프론트엔드 기획**
- `frontend_wireframe.md` - UI 구조
- `기술_명세서.md` - React 아키텍처

### Phase 5: Battle Rhythm
- `기획_및_문제_정의서.md` ⭐ **리듬 시스템 설계**
- `기술_명세서.md` - 상세 기술
- `구현_알고리즘_명세서.md` - 알고리즘

### Phase 6: AI 캐릭터 생성
- `기획_및_문제_정의서.md` ⭐ **캐릭터 생성 설계**
- `기술_명세서.md` - Gemini API 통합

### Phase 7: AI QA
- `step_0_foundation_setup.md` ⭐ **시작점**
- `step_1_advanced_simulation_environment.md`
- [Step 2-6: 각 컴포넌트별 구현]
- `metric_definition_document.md` - 메트릭 정의

### WebRTC 프로토콜
- `기획서.md` ⭐ **전략 문서**
- `communication_protocol_and_code_spec.md` - 통신 프로토콜
- `system_flow_use_cases.md` - 시스템 플로우

---

## 🔗 관련 파일

**프로젝트 루트**:
- `CLAUDE.md` - 개발 가이드
- `FINAL_TEST_REPORT.md` - 최종 테스트 리포트

**코드**:
- `src/game_engine/` - Phase 1 구현
- `src/rl_training/` - Phase 2 구현
- `arcade-clash/` - Phase 4 구현
- `src/log_collector/` - Phase 7 구현
- `src/metric_extractor/` - Phase 7 구현

---

## 💡 팁

### 문서를 찾을 수 없을 때
1. Phase 폴더 내에서 한글/영문 제목 검색
2. 문서 이름 패턴: `{기획|기술|구현|테스트}_*.md`
3. Phase 7은 Step 0-6으로 구성

### 버전 관리
- 모든 Phase는 마크다운 형식
- 각 Phase는 독립적인 폴더
- merge_plans/, archive/ 제거됨 (불필요)

### 다음 단계
- Phase 6 진행 중 (AI 캐릭터 생성)
- Phase 7 진행 중 (AI QA & 게임 필 분석)

---

**마지막 업데이트**: 2025-11-20 | **정리 완료** ✅
