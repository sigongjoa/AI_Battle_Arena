# Phase 2 계획: 기술 검증 (POC)

**계획 수립**: 2025-11-20
**예상 소요 기간**: 2-3일
**목표**: FBX 기반 Three.js 프로토타입으로 3D 캐릭터 렌더링 검증

---

## 📋 Phase 2 목표

Phase 1 조사 결과를 바탕으로 **실제 구현 가능성 검증**:

1. ✅ Mixamo에서 캐릭터 + 애니메이션 다운로드
2. ✅ Three.js에서 FBX 로드 및 렌더링
3. ✅ 정면 2D 뷰에서 캐릭터 표시
4. ✅ 애니메이션 재생 확인
5. ✅ 성능 측정 (로드 시간, FPS)

---

## 🛠️ Phase 2 기술 스택

### 최소 요구 기술

```typescript
// 핵심 라이브러리
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// 선택사항
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // 테스트용 뷰 조작

// 성능 측정
const stats = new Stats(); // stats.js
```

### 프로젝트 구조

```
arcade-clash/
├── src/
│   ├── 3d-rigging/
│   │   ├── CharacterLoader.ts      # FBX 로딩 로직
│   │   ├── CharacterMesh.ts        # 메시 관리
│   │   ├── BoneMapper.ts           # 본 자동 매핑
│   │   ├── AnimationController.ts  # 애니메이션 제어
│   │   └── tests/
│   │       └── CharacterLoader.test.tsx
│   ├── components/
│   │   └── CharacterViewer3D.tsx   # 3D 뷰 컴포넌트
│   └── assets/
│       └── models/
│           ├── character.fbx       # Mixamo 캐릭터
│           └── walking.fbx         # Mixamo 애니메이션
```

---

## 🎯 Phase 2 세부 작업 계획

### Step 1: Mixamo 자산 수집 (1시간)

**목표**: 테스트용 FBX 파일 다운로드

```
1. Mixamo.com 접속
2. 무료 캐릭터 선택 (예: Ybot 또는 Xbot)
3. FBX 형식으로 다운로드
   - Format: FBX
   - ✅ Skin: 체크
   - ✅ Animations: without socks 또는 standard
4. 애니메이션 다운로드
   - 비열 애니메이션 선택 (Walking, Idle, etc.)
   - 각 애니메이션별로 FBX 다운로드
```

**저장 위치**:
```
arcade-clash/public/assets/models/mixamo/
├── character.fbx
├── walking.fbx
├── running.fbx
└── idle.fbx
```

---

### Step 2: CharacterLoader 구현 (3-4시간)

**목표**: FBX 파일을 Three.js SkinnedMesh로 변환

```typescript
// arcade-clash/src/3d-rigging/CharacterLoader.ts

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export interface CharacterAsset {
  mesh: THREE.SkinnedMesh;
  skeleton: THREE.Skeleton;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer;
}

export class CharacterLoader {
  private fbxLoader: FBXLoader;

  constructor() {
    this.fbxLoader = new FBXLoader();
  }

  /**
   * FBX 파일 로드 및 SkinnedMesh 생성
   */
  async loadCharacter(fbxUrl: string): Promise<CharacterAsset> {
    // 1. FBX 파일 로드
    const fbx = await this.fbxLoader.loadAsync(fbxUrl);

    // 2. SkinnedMesh 찾기 (FBX는 일반적으로 Mesh 포함)
    let mesh: THREE.SkinnedMesh | null = null;
    fbx.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.SkinnedMesh) {
        mesh = child;
      }
    });

    if (!mesh) {
      throw new Error('No SkinnedMesh found in FBX');
    }

    // 3. AnimationMixer 생성
    const mixer = new THREE.AnimationMixer(mesh);

    // 4. 뼈대 정보 추출
    const skeleton = mesh.skeleton;
    const animations = fbx.animations || [];

    return { mesh, skeleton, animations, mixer };
  }

  /**
   * 캐릭터에 애니메이션 추가
   */
  async addAnimation(
    character: CharacterAsset,
    animationUrl: string,
    animationName: string
  ): Promise<void> {
    const animFbx = await this.fbxLoader.loadAsync(animationUrl);
    const animClips = animFbx.animations || [];

    // 애니메이션 클립을 기존 메시에 적용
    animClips.forEach((clip) => {
      character.animations.push(clip);
      // 명명 규칙: 원본 이름 → animationName_originalName
      clip.name = animationName;
    });
  }

  /**
   * 애니메이션 재생
   */
  playAnimation(
    character: CharacterAsset,
    animationName: string,
    loop: THREE.LoopOnce | THREE.LoopRepeat = THREE.LoopRepeat
  ): THREE.AnimationAction {
    const clip = THREE.AnimationClip.findByName(
      character.animations,
      animationName
    );

    if (!clip) {
      throw new Error(`Animation "${animationName}" not found`);
    }

    const action = character.mixer.clipAction(clip);
    action.loop = loop;
    action.play();
    return action;
  }
}
```

---

### Step 3: 2D 정면 뷰 렌더러 (3-4시간)

**목표**: OrthographicCamera를 사용한 정면 뷰 렌더링

```typescript
// arcade-clash/src/3d-rigging/CharacterRenderer.ts

import * as THREE from 'three';

export class CharacterRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private startTime: number = 0;

  constructor(container: HTMLElement, width: number = 800, height: number = 600) {
    // Scene 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // OrthographicCamera 설정 (정면 2D 뷰)
    const aspect = width / height;
    this.camera = new THREE.OrthographicCamera(
      -width / 2,   // left
      width / 2,    // right
      height / 2,   // top
      -height / 2,  // bottom
      0.1,          // near
      1000          // far
    );
    this.camera.position.z = 200;
    this.camera.lookAt(0, 0, 0);

    // Renderer 설정
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // 조명 추가
    this.setupLighting();
  }

  private setupLighting(): void {
    // 전면 조명
    const frontLight = new THREE.DirectionalLight(0xffffff, 1);
    frontLight.position.set(0, 0, 100);
    this.scene.add(frontLight);

    // 배경 조명 (그림자 방지)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 0, -100);
    this.scene.add(backLight);

    // 환경광
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
  }

  /**
   * 캐릭터 메시를 씬에 추가
   */
  addCharacterMesh(mesh: THREE.SkinnedMesh): void {
    // 캐릭터를 씬 중앙에 배치
    mesh.position.set(0, -100, 0); // Y축 기준 조정
    this.scene.add(mesh);

    // 뼈 위치도 씬에 추가 (계층 구조 유지)
    if (mesh.skeleton && mesh.skeleton.bones) {
      mesh.skeleton.bones.forEach((bone) => {
        // 뼈 위치 확인 (디버그용)
        console.log(`Bone: ${bone.name} at`, bone.position);
      });
    }
  }

  /**
   * 애니메이션 업데이트 루프
   */
  startAnimationLoop(mixer: THREE.AnimationMixer): void {
    const clock = new THREE.Clock();

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const deltaTime = clock.getDelta();
      mixer.update(deltaTime);

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * 렌더링 멈추기
   */
  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 정리
   */
  dispose(): void {
    this.stopAnimationLoop();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /**
   * 뷰포트 크기 조정
   */
  handleWindowResize(width: number, height: number): void {
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
}
```

---

### Step 4: 본 매핑 구현 (2-3시간)

**목표**: Mixamo 본을 표준 본으로 자동 매핑

```typescript
// arcade-clash/src/3d-rigging/BoneMapper.ts

export class BoneMapper {
  /**
   * 표준 본 이름 (우리 프로젝트 표준)
   */
  static STANDARD_BONES = {
    ROOT: 'Hips',
    SPINE: 'Spine',
    SPINE1: 'Spine1',
    CHEST: 'Chest',
    NECK: 'Neck',
    HEAD: 'Head',

    LEFT_SHOULDER: 'LeftShoulder',
    LEFT_ARM: 'LeftArm',
    LEFT_FOREARM: 'LeftForeArm',
    LEFT_HAND: 'LeftHand',

    RIGHT_SHOULDER: 'RightShoulder',
    RIGHT_ARM: 'RightArm',
    RIGHT_FOREARM: 'RightForeArm',
    RIGHT_HAND: 'RightHand',

    LEFT_HIP: 'LeftHip',
    LEFT_LEG: 'LeftLeg',
    LEFT_FOOT: 'LeftFoot',

    RIGHT_HIP: 'RightHip',
    RIGHT_LEG: 'RightLeg',
    RIGHT_FOOT: 'RightFoot',
  };

  /**
   * 본 이름 매칭 규칙 (정규식)
   */
  private static BONE_PATTERNS = [
    // 루트
    { pattern: /^(armature|root|hips|mixamorig:hips)$/i, target: 'Hips' },

    // 척추
    { pattern: /(spine|torso|chest|lowerback|upperback|mixamorig:spine)/i, target: 'Spine' },

    // 목
    { pattern: /(neck|mixamorig:neck)/i, target: 'Neck' },

    // 머리
    { pattern: /(head|mixamorig:head)/i, target: 'Head' },

    // 왼쪽 팔
    { pattern: /(left.*shoulder|leftshoulders?|mixamorig:leftshoulder)/i, target: 'LeftShoulder' },
    { pattern: /(left.*arm(?!fur)|leftarm|mixamorig:leftarm)(?!forearm)/i, target: 'LeftArm' },
    { pattern: /(left.*forearm|leftforearm|mixamorig:leftforearm)/i, target: 'LeftForeArm' },
    { pattern: /(left.*hand|lefthand|mixamorig:lefthand)/i, target: 'LeftHand' },

    // 오른쪽 팔
    { pattern: /(right.*shoulder|rightshoulders?|mixamorig:rightshoulder)/i, target: 'RightShoulder' },
    { pattern: /(right.*arm(?!fur)|rightarm|mixamorig:rightarm)(?!forearm)/i, target: 'RightArm' },
    { pattern: /(right.*forearm|rightforearm|mixamorig:rightforearm)/i, target: 'RightForeArm' },
    { pattern: /(right.*hand|righthand|mixamorig:righthand)/i, target: 'RightHand' },

    // 왼쪽 다리
    { pattern: /(left.*hip|lefthip|leftupleg|mixamorig:leftupleg)/i, target: 'LeftHip' },
    { pattern: /(left.*leg(?!upleg)|leftleg|mixamorig:leftleg)(?!upleg)/i, target: 'LeftLeg' },
    { pattern: /(left.*foot|leftfoot|mixamorig:leftfoot)/i, target: 'LeftFoot' },

    // 오른쪽 다리
    { pattern: /(right.*hip|righthip|rightupleg|mixamorig:rightupleg)/i, target: 'RightHip' },
    { pattern: /(right.*leg(?!upleg)|rightleg|mixamorig:rightleg)(?!upleg)/i, target: 'RightLeg' },
    { pattern: /(right.*foot|rightfoot|mixamorig:rightfoot)/i, target: 'RightFoot' },
  ];

  /**
   * 본 배열에서 자동 매핑 생성
   */
  static autoMapBones(bones: THREE.Bone[]): Map<string, string> {
    const mapping = new Map<string, string>();

    bones.forEach((bone) => {
      const boneName = bone.name;

      // 각 패턴 확인
      for (const { pattern, target } of this.BONE_PATTERNS) {
        if (pattern.test(boneName)) {
          mapping.set(boneName, target);
          console.log(`Mapped bone: ${boneName} → ${target}`);
          break; // 첫 번째 매칭 사용
        }
      }

      // 매핑 실패한 본
      if (!mapping.has(boneName)) {
        console.warn(`Failed to auto-map bone: ${boneName}`);
      }
    });

    return mapping;
  }

  /**
   * 본 이름 변경 적용
   */
  static applyMapping(
    mesh: THREE.SkinnedMesh,
    mapping: Map<string, string>
  ): void {
    mapping.forEach((standardName, originalName) => {
      // 뼈 찾기
      const bone = this.findBoneByName(mesh.skeleton.bones, originalName);
      if (bone) {
        bone.name = standardName;
      }
    });
  }

  private static findBoneByName(bones: THREE.Bone[], name: string): THREE.Bone | null {
    for (const bone of bones) {
      if (bone.name === name) {
        return bone;
      }
    }
    return null;
  }
}
```

---

### Step 5: React 컴포넌트 통합 (2시간)

**목표**: 3D 렌더러를 React 컴포넌트로 래핑

```typescript
// arcade-clash/src/components/CharacterViewer3D.tsx

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterLoader } from '../3d-rigging/CharacterLoader';
import { CharacterRenderer } from '../3d-rigging/CharacterRenderer';
import { BoneMapper } from '../3d-rigging/BoneMapper';

interface CharacterViewer3DProps {
  characterFbxUrl: string;
  animationFbxUrl?: string;
  width?: number;
  height?: number;
}

export const CharacterViewer3D: React.FC<CharacterViewer3DProps> = ({
  characterFbxUrl,
  animationFbxUrl,
  width = 800,
  height = 600,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadAndRender = async () => {
      try {
        // CharacterLoader 생성
        const loader = new CharacterLoader();

        // 1. 캐릭터 로드
        const character = await loader.loadCharacter(characterFbxUrl);

        // 2. 본 자동 매핑
        const boneMapping = BoneMapper.autoMapBones(
          character.skeleton.bones
        );
        BoneMapper.applyMapping(character.mesh, boneMapping);

        // 3. 애니메이션 추가 (선택사항)
        if (animationFbxUrl) {
          await loader.addAnimation(character, animationFbxUrl, 'walk');
        }

        // 4. 렌더러 생성
        const renderer = new CharacterRenderer(containerRef.current!, width, height);

        // 5. 메시 추가
        renderer.addCharacterMesh(character.mesh);

        // 6. 애니메이션 재생
        if (character.animations.length > 0) {
          loader.playAnimation(character, character.animations[0].name);
        }

        // 7. 렌더링 시작
        renderer.startAnimationLoop(character.mixer);

        // FPS 측정
        const clock = new THREE.Clock();
        let frameCount = 0;
        const measureFps = () => {
          frameCount++;
          const elapsed = clock.getElapsedTime();
          if (elapsed >= 1) {
            setFps(Math.round(frameCount / elapsed));
            frameCount = 0;
            clock.start();
          }
          requestAnimationFrame(measureFps);
        };
        measureFps();

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    loadAndRender();
  }, [characterFbxUrl, animationFbxUrl, width, height]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px',
        }}>
          로딩 중...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'red',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '4px',
        }}>
          오류: {error}
        </div>
      )}
      {!isLoading && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          FPS: {fps}
        </div>
      )}
    </div>
  );
};

export default CharacterViewer3D;
```

---

### Step 6: 성능 측정 및 테스트 (2시간)

**목표**: 로드 시간, FPS, 메모리 사용량 측정

```typescript
// arcade-clash/src/3d-rigging/__tests__/CharacterLoader.test.tsx

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterLoader } from '../CharacterLoader';

describe('CharacterLoader', () => {
  let loader: CharacterLoader;

  beforeEach(() => {
    loader = new CharacterLoader();
  });

  it('should load FBX character file', async () => {
    const startTime = performance.now();
    const character = await loader.loadCharacter('/assets/models/mixamo/character.fbx');
    const loadTime = performance.now() - startTime;

    expect(character.mesh).toBeDefined();
    expect(character.skeleton).toBeDefined();
    expect(loadTime).toBeLessThan(5000); // 5초 이내

    console.log(`Character loaded in ${loadTime.toFixed(2)}ms`);
  });

  it('should have valid skeleton', async () => {
    const character = await loader.loadCharacter('/assets/models/mixamo/character.fbx');

    expect(character.skeleton.bones.length).toBeGreaterThan(0);
    expect(character.mesh.skeleton).toBe(character.skeleton);
  });

  it('should play animation without errors', async () => {
    const character = await loader.loadCharacter('/assets/models/mixamo/character.fbx');

    if (character.animations.length > 0) {
      const action = loader.playAnimation(character, character.animations[0].name);
      expect(action).toBeDefined();
      expect(action.isRunning()).toBe(true);
    }
  });
});
```

---

## 📊 Phase 2 성공 기준

| 기준 | 목표 | 허용 범위 |
|------|------|----------|
| **로드 시간** | < 3초 | 5초 이내 |
| **FPS** | 60 FPS | 30 FPS 이상 |
| **메모리** | < 500MB | 1GB 이내 |
| **본 매핑 성공률** | 90% | 70% 이상 |
| **애니메이션 재생** | 부드러움 | 끊김 없음 |

---

## 🚨 예상 문제 및 해결 방안

### 문제 1: Mixamo FBX 본 이름이 다름
**증상**: 본 매핑 실패
**해결**: 정규식 패턴 추가

### 문제 2: 메시가 아래쪽을 향함
**증상**: 캐릭터가 거꾸로 보임
**해결**: rotation.x = Math.PI 또는 메시 회전 조정

### 문제 3: 애니메이션이 재생되지 않음
**증상**: 캐릭터가 움직이지 않음
**해결**: 애니메이션 클립 이름 확인, AnimationMixer.update() 호출 확인

### 문제 4: 낮은 FPS
**증상**: 프레임 드롭
**해결**:
- 메시 폴리곤 감소 (LOD 사용)
- 본 개수 감소 (주요 본만 사용)
- WebGL 렌더러 최적화

---

## 📝 Phase 2 결과 보고서 (예정)

Phase 2 완료 후 다음 문서를 작성할 예정:

1. **기술 검증 결과**
   - 로드 시간 측정
   - FPS 측정
   - 성공/실패 사항 정리

2. **문제 분석**
   - 발견된 이슈
   - 해결 방안

3. **최적화 권장사항**
   - 파일 포맷 선택 (FBX vs GLTF)
   - 본 수 최적화
   - 렌더링 성능 향상 방법

4. **다음 단계 계획**
   - Phase 3 상세 설계
   - 구현 로드맵

---

**작성자**: Claude Code
**계획 수립**: 2025-11-20
**예상 시작**: 2025-11-20 또는 이후
**예상 완료**: 2025-11-22 또는 2025-11-23
