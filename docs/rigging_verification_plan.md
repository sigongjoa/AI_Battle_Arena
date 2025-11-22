# 3D 리깅 모델 렌더링 검증 계획 (Independent Environment)

## 1. 개요
현재 메인 프로젝트(`arcade-clash`)에서 3D 캐릭터 모델이 정상적으로 렌더링되지 않는 문제(점만 보이거나 보이지 않음)가 발생하고 있습니다. 복잡한 게임 로직과 UI 요소들의 간섭을 배제하고, 순수하게 3D 모델 로딩 및 리깅 시스템이 동작하는지 확인하기 위해 **독립된 프론트엔드 환경(POC)**을 구축하여 검증을 진행합니다.

## 2. 목표
*   최소한의 코드로 3D 모델(`remy.fbx`)을 화면에 렌더링.
*   `CharacterLoader` 및 `CharacterRenderer` 클래스의 정상 동작 확인.
*   모델의 스케일, 위치, 조명 설정이 올바른지 시각적으로 검증.
*   백엔드 의존성 없이 순수 프론트엔드 로직으로 리깅이 가능한지 확인.

## 3. 환경 구축 계획

### 3.1. 프로젝트 구조
`d:\progress\AI_Battle_Arena\rigging-poc` 폴더에 새로운 Vite + React + TypeScript 프로젝트를 생성합니다.

```
rigging-poc/
├── public/
│   └── models/
│       └── remy.fbx  (메인 프로젝트에서 복사)
├── src/
│   ├── 3d-rigging/   (메인 프로젝트에서 복사)
│   │   ├── CharacterLoader.ts
│   │   ├── CharacterRenderer.ts
│   │   └── BoneMapper.ts
│   ├── App.tsx       (검증용 메인 페이지)
│   └── main.tsx
└── ...
```

### 3.2. 주요 작업
1.  **프로젝트 초기화:** `npm create vite@latest rigging-poc -- --template react-ts`
2.  **의존성 설치:** `three`, `@types/three` 설치.
3.  **자산 복사:** `arcade-clash/public/models/remy.fbx` -> `rigging-poc/public/models/remy.fbx`
4.  **코드 복사:** `arcade-clash/src/3d-rigging/` -> `rigging-poc/src/3d-rigging/`
5.  **검증 코드 작성:** `App.tsx`에서 `CharacterRenderer`를 초기화하고 모델을 로드하여 화면에 표시.

## 4. 검증 절차
1.  `rigging-poc` 디렉토리에서 개발 서버 실행 (`npm run dev`).
2.  브라우저로 접속하여 화면 중앙에 캐릭터가 보이는지 확인.
3.  캐릭터가 보이지 않을 경우:
    *   배경색 변경을 통해 실루엣 확인.
    *   디버그 큐브(Red/Green Box)를 추가하여 씬 렌더링 여부 확인.
    *   카메라 줌/위치 조정을 통해 모델이 화면 밖으로 나갔는지 확인.

## 5. 백엔드 관련 사항
*   현재 백엔드(`backend/`)에는 `CharacterGenerator` 등 메타데이터 생성 로직은 존재하나, **실제 3D 렌더링 및 리깅 로직은 포함되어 있지 않음**.
*   따라서 이번 검증은 **백엔드 서버 실행 여부와 무관하게** 프론트엔드 단독으로 진행 가능함.
