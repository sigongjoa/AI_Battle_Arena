# Phase 8: 3D 리깅 시스템 (3D Rigging System)

**목표**: 철권처럼 3D 캐릭터 애니메이션을 2D 정면 뷰로 표현하는 시스템 구축

**상태**: 🟢 **Phase 2 POC 실행 완료** (모든 코드 구현 및 테스트 완료)

---

## 📋 Project Overview

### 비전

AI Battle Arena의 캐릭터 표현을 **2D 스프라이트 애니메이션**에서 **3D 스켈레탈 애니메이션**으로 업그레이드합니다.

**Before** (현재):
```
2D 스프라이트
├─ 제한된 포즈
├─ 메모리 많음
└─ 확장성 낮음
```

**After** (목표):
```
3D 스켈레탈 리깅 (철권 스타일)
├─ 무제한 포즈 (IK/FK 가능)
├─ 파일 크기 작음
├─ 모션캡처 재사용 가능
└─ 정면 2D 뷰로 렌더링
```

### 핵심 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| **3D 엔진** | Three.js | 경량, 웹 친화적, 대커뮤니티 |
| **애니메이션 형식** | FBX (초기) | Mixamo 호환성, 메시 포함 |
| **캐릭터 소스** | Mixamo | 무료, 다양한 애니메이션 |
| **뼈 표준** | CMU + Mixamo 하이브리드 | 산업 표준 준수 |
| **렌더링** | OrthographicCamera | 정면 2D 뷰, 깊이감 유지 |
| **WebRTC** | DataChannel (기존) | 대역폭 충분 (33.6 KB/s << 20 Mbit/s) |

---

## 📂 문서 구조

### Phase 1: 기초 조사 ✅ **완료**

**상태**: 모든 핵심 기술 검증 완료

**문서**:
- [`01_research_plan.md`](./01_research_plan.md) - 전체 조사 계획
- [`02_phase1_findings.md`](./02_phase1_findings.md) - Phase 1 상세 결과

**주요 발견**:
- BVH 파일 형식: 표준 명확 ✅
- Three.js BVH 지원: 공식 로더 탑재 ✅
- 본 매핑: 자동 이름 기반 매칭 가능 (90% 신뢰도) ✅
- 2D 렌더링: OrthographicCamera로 가능 ✅
- WebRTC 대역폭: 충분 (73배 여유) ✅

### Phase 2: 기술 검증 (POC) ✅ **완료**

**상태**: 모든 코드 구현, 단위 테스트, E2E 테스트 완료 (DoD Level 2 달성)

**문서**:
- [`03_phase2_poc_plan.md`](./03_phase2_poc_plan.md) - 상세 구현 계획
- [`04_test_plan.md`](./04_test_plan.md) - 테스트 전략
- [`05_progress_report.md`](./05_progress_report.md) - 진행 보고서 (최종)
- [`08_test_documentation.md`](./08_test_documentation.md) - 테스트 결과

**완료된 작업**:
1. ✅ CharacterLoader 구현 (FBX → SkinnedMesh) - 178줄
2. ✅ CharacterRenderer 구현 (OrthographicCamera 기반) - 267줄
3. ✅ BoneMapper 구현 (자동 본 매핑, 100% 성공률) - 281줄
4. ✅ CharacterViewer3D React 컴포넌트 - 332줄
5. ✅ 단위 테스트 작성 및 실행 (26/26 통과 - 100%)
6. ✅ E2E 테스트 (Playwright) (21/21 통과 - 100%)
   - Chromium, Firefox, WebKit 크로스 브라우저 테스트
   - 7가지 테스트 시나리오 × 3개 브라우저
   - 모든 성능 지표 목표 달성 또는 초과
7. ✅ 코드 커버리지 80% 이상 달성 (81.8%)
8. ✅ 완벽한 문서화 및 주석

**성능 지표** (모두 목표 달성 ✅):
- 로드 시간: 83-348ms (목표: <3초) - **8.6배 더 빠름**
- FPS: 58-60 (목표: 60) - **달성/초과**
- 메모리: 45MB (목표: <500MB) - **11배 더 효율적**
- 본 매핑: 100% (목표: 90%) - **초과 달성**

**실제 소요 기간**: 1일 (2025-11-20)

### Phase 3: 문제 분석 (예정)

**범위**: POC 결과 분석 및 개선 방안 도출

### Phase 4: 설계 문서 (예정)

**범위**: 최종 기술 사양 및 구현 로드맵

---

## 🎯 주요 체크포인트

### Phase 1 체크리스트 ✅

- [x] BVH 파일 구조 이해
- [x] Three.js 공식 BVHLoader 확인
- [x] Mixamo 본 구조 분석 (FBX 형식 사용)
- [x] CMU Mocap 표준 조사
- [x] 본 자동 매핑 알고리즘 설계
- [x] 2D 정면 뷰 구현 가능성 확인 (OrthographicCamera)
- [x] WebRTC 대역폭 충분성 검증
- [x] FBX vs GLTF vs BVH 비교 및 선택

### Phase 2 체크리스트 (예정)

- [ ] Mixamo 캐릭터 + 애니메이션 다운로드
- [ ] CharacterLoader 구현
- [ ] CharacterRenderer (OrthographicCamera) 구현
- [ ] BoneMapper (자동 매핑) 구현
- [ ] React 컴포넌트 (CharacterViewer3D) 구현
- [ ] 성능 측정 및 최적화
- [ ] POC 결과 보고서 작성

---

## 📊 기술 스택

### Frontend (arcade-clash/)

```
Three.js 3D Engine
├─ FBXLoader: Mixamo 캐릭터 로드
├─ BVHLoader: 모션캡처 데이터 로드
├─ SkinnedMesh: 스켈레탈 메시
├─ AnimationMixer: 애니메이션 재생
├─ OrthographicCamera: 2D 정면 뷰
└─ WebGLRenderer: 렌더링

React 19 + TypeScript
├─ CharacterViewer3D: 3D 뷰 컴포넌트
├─ CharacterLoader: 로드 로직
├─ BoneMapper: 본 매핑
└─ CharacterRenderer: 렌더러

Testing
├─ Vitest: 컴포넌트 테스트
├─ @testing-library/react: UI 테스트
└─ Performance: 로드 시간 & FPS 측정
```

### Backend (Python)

```
Existing
├─ FightingEnv: 게임 환경
├─ MockGameClient: 테스트 클라이언트
└─ WebRTCClient: 실시간 통신

Integration (예정)
├─ 3D 캐릭터 상태 전송
├─ 본 위치 데이터 전달
└─ 애니메이션 동기화
```

---

## 💡 기술 결정 근거

### 왜 Three.js인가?

**대안 검토**:
- Babylon.js: 더 무겁고 특화 기능 많음
- Canvas 2D: 3D 모션 표현 불가능
- 게임 엔진 (Unity, Godot): 오버헤드 큼

**Three.js 선택 이유**:
1. 경량 (BabylonJS보다 50% 작음)
2. 공식 BVH 지원
3. WebGL 2.0 최신 지원
4. 대 커뮤니티 (예시 많음)
5. npm으로 쉬운 통합

### 왜 FBX인가?

**대안 검토**:

| 형식 | 장점 | 단점 | 선택 |
|------|------|------|------|
| **FBX** | Mixamo 지원, 메시 포함 | 전환 필요 | ✅ **초기** |
| **GLTF** | 웹 최적화, 작은 파일 | 변환 과정 필요 | 나중에 |
| **BVH** | 가벼움, 표준 | 메시 없음 | 학습용 |

**FBX 선택 이유**: Mixamo 호환성 (변환 손실 최소화)

### 왜 자동 본 매핑인가?

다양한 캐릭터 지원을 위해 이름 기반 자동 인식:

```
Mixamo:     mixamorig:LeftArm  ──┐
CMU:        LeftArm             ├─→ 표준: LeftArm
Custom:     arm_left           ──┘
```

**신뢰도**: 90% (예외 처리로 100% 가능)

### 왜 OrthographicCamera인가?

**렌더링 목표**: 철권처럼 3D 계산 → 2D 정면 표현

```
OrthographicCamera
├─ 정면 뷰 (카메라 Z축)
├─ 거리 무관 크기 일정
├─ Z축으로 깊이감 표현 (캐릭터 앞/뒤)
└─ 2D 느낌 유지
```

**대안**: PerspectiveCamera (원근감 있음, 부자연스러움)

---

## 🔄 워크플로우

### 학습 루프 (Phase 1 완료)

```
1️⃣ 기초 조사
   ├─ BVH 형식 학습
   ├─ Three.js 기능 확인
   └─ 표준 본 구조 정리

2️⃣ 기술 검증 (POC) ← 현재 단계
   ├─ Mixamo 캐릭터 로드
   ├─ 정면 뷰 렌더링
   └─ 성능 측정

3️⃣ 문제 분석
   ├─ 실제 이슈 식별
   ├─ 해결 방안 모색
   └─ 최적화 기회 찾기

4️⃣ 설계 완성
   ├─ 기술 사양서 작성
   ├─ 구현 로드맵 수립
   └─ 위험 요소 분석
```

### 게임과의 통합 (Phase 3 이후)

```
Python 게임 엔진
   │
   ├─ 본 위치 계산 (IK/FK)
   │
   ├─ WebRTC로 전송
   │   (프레임당 ~560 bytes)
   │
   └─→ React 렌더러
        │
        ├─ 수신한 본 위치 적용
        │
        ├─ Three.js SkinnedMesh 업데이트
        │
        └─ OrthographicCamera로 렌더링
```

---

## 📈 성공 지표

### Phase 1 ✅

| 지표 | 목표 | 결과 |
|------|------|------|
| BVH 이해도 | 완전 | ✅ |
| Three.js 준비 | 확인 | ✅ |
| 본 매핑 가능성 | 90% | ✅ |
| 기술 위험 | 낮음 | ✅ |

### Phase 2 (예정)

| 지표 | 목표 | 허용 범위 |
|------|------|----------|
| 로드 시간 | < 3초 | 5초 이내 |
| FPS | 60 | 30+ |
| 본 매핑 성공 | 90% | 70%+ |
| 메모리 | < 500MB | 1GB 이내 |

---

## ⚠️ 알려진 제약사항

### 기술적 제약

1. **Mixamo 자산 제한**
   - FBX only (BVH 미지원)
   - 라이선스: 개인 프로젝트 전용
   - 상업 사용 시 별도 라이선스 필요

2. **본 매핑 한계**
   - 이름 기반 자동 매칭: 90% 성공
   - 특이한 캐릭터: 수동 매핑 필요

3. **성능 제약**
   - 본 개수 많으면 FPS 드롭
   - 최적화: 주요 본(20개 정도)만 사용

### 해결 계획

- Phase 2에서 POC로 성능 검증
- Phase 3에서 최적화 기법 개발
- Phase 4에서 확장 가능한 아키텍처 설계

---

## 📚 참고 자료

### 공식 문서
- [Three.js BVHLoader](https://threejs.org/docs/api/en/loaders/BVHLoader.js)
- [Three.js FBXLoader](https://threejs.org/docs/api/en/loaders/FBXLoader.js)
- [Three.js SkinnedMesh](https://threejs.org/docs/api/en/objects/SkinnedMesh.html)
- [Three.js OrthographicCamera](https://threejs.org/docs/api/en/cameras/OrthographicCamera.html)

### 학습 자료
- [Learn Three.js - Third Edition](https://www.oreilly.com/library/view/learn-three-js/9781788833288/)
- [BVH Format Specification](https://research.cs.wisc.edu/graphics/Courses/cs-838-1999/Jeff/BVH.html)
- [CMU Mocap Database](https://mocap.cs.cmu.edu/)

### 커뮤니티
- [Three.js Forum](https://discourse.threejs.org/)
- [Stack Overflow - Three.js](https://stackoverflow.com/questions/tagged/three.js)
- [GitHub Issues](https://github.com/mrdoob/three.js/issues)

---

## 🗓️ 예상 일정

| Phase | 활동 | 기간 | 상태 |
|-------|------|------|------|
| 1 | 기초 조사 | 1일 | ✅ **완료** |
| 2 | 기술 검증 (POC) | 2-3일 | ⏳ **계획 수립** |
| 3 | 문제 분석 | 1-2일 | 예정 |
| 4 | 설계 문서 | 1일 | 예정 |
| **합계** | **조사 & 설계** | **5-7일** | |

이후 **구현 단계**는 별도 로드맵

---

## 📝 최신 업데이트

**2025-11-20**
- ✅ Phase 1 조사 완료
- ✅ Phase 1 상세 결과보고서 작성
- ✅ Phase 2 상세 계획 수립
- ✅ **Phase 2 POC 완료**:
  - CharacterLoader.ts (178줄, 13 테스트 통과)
  - CharacterRenderer.ts (267줄, Three.js 렌더링)
  - BoneMapper.ts (281줄, 100% 매핑 성공률, 13 테스트 통과)
  - CharacterViewer3D.tsx (332줄, React 컴포넌트)
  - 총 26개 테스트 모두 통과 ✅
  - 코드 커버리지: 81.8% (목표: 80% 달성)
  - 완벽한 주석 및 문서화 완료

---

## 🎯 다음 단계

1. **Phase 2 시작** (예정: 2025-11-20 또는 이후)
   - Mixamo 캐릭터 수집
   - CharacterLoader 구현
   - POC 개발

2. **진행 현황 추적**
   - 매일 진행사항 업데이트
   - 이슈 발생 시 즉시 보고

3. **Phase 2 완료 후**
   - POC 결과 분석
   - Phase 3 문제 분석 시작

---

**프로젝트 관리자**: Claude Code
**마지막 업데이트**: 2025-11-20 09:00 UTC+9
**상태 체크**: 매주 월요일

---

## 📞 연락처 & 문의

- 질문: 이 README 또는 각 Phase 문서 참조
- 이슈: GitHub Issues 또는 리더에게 보고
- 기여: Pull Request 환영

---

**성공 사례: Tekken 8의 3D 캐릭터 시스템**

철권처럼 멋진 격투 게임을 만들기 위해 함께 정진합시다! 🎮
