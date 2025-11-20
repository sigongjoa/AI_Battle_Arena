import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterLoader } from './CharacterLoader';
import { CharacterRenderer } from './CharacterRenderer';
import { BoneMapper } from './BoneMapper';

/**
 * CharacterViewer3D 컴포넌트의 Props
 */
export interface CharacterViewer3DProps {
  /** 캐릭터 FBX 파일 URL */
  characterFbxUrl: string;
  /** 애니메이션 FBX 파일 URL (선택사항) */
  animationFbxUrl?: string;
  /** 뷰어 너비 (기본값: 800) */
  width?: number;
  /** 뷰어 높이 (기본값: 600) */
  height?: number;
  /** 자동 실행 애니메이션 이름 (선택사항) */
  autoPlayAnimation?: string;
  /** FPS 카운터 표시 여부 (기본값: true) */
  showFPS?: boolean;
  /** 뼈 정보 표시 여부 (기본값: false) */
  showBoneInfo?: boolean;
}

/**
 * 3D 캐릭터를 렌더링하는 React 컴포넌트
 *
 * Mixamo 캐릭터를 로드하고 애니메이션을 재생합니다.
 * - FBX 로딩 및 SkinnedMesh 렌더링
 * - 자동 본 매핑
 * - 애니메이션 재생
 * - 실시간 FPS 측정
 */
export const CharacterViewer3D: React.FC<CharacterViewer3DProps> = ({
  characterFbxUrl,
  animationFbxUrl,
  width = 800,
  height = 600,
  autoPlayAnimation,
  showFPS = true,
  showBoneInfo = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CharacterRenderer | null>(null);
  const loaderRef = useRef<CharacterLoader | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [boneCount, setBoneCount] = useState(0);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadAndRender = async () => {
      try {
        const startTime = performance.now();

        // CharacterLoader 생성
        loaderRef.current = new CharacterLoader((progress) => {
          console.log(`[CharacterViewer3D] Loading progress: ${progress.loaded}/${progress.total}`);
        });

        // 1. 캐릭터 로드
        console.log(`[CharacterViewer3D] Loading character from: ${characterFbxUrl}`);
        const character = await loaderRef.current.loadCharacter(characterFbxUrl);

        // 2. 본 자동 매핑
        console.log('[CharacterViewer3D] Auto-mapping bones...');
        const boneMapping = BoneMapper.autoMapBones(character.skeleton.bones);
        BoneMapper.applyMapping(character.mesh, boneMapping);

        // 본 검증
        const validation = BoneMapper.validateBones(character.mesh);
        console.log(`[CharacterViewer3D] Bone validation: ${validation.isValid ? 'PASS' : 'FAIL'}`);

        if (showBoneInfo) {
          BoneMapper.printBoneHierarchy(character.mesh);
          const stats = BoneMapper.getBoneStatistics(character.mesh);
          console.log('[CharacterViewer3D] Bone statistics:', stats);
        }

        setBoneCount(character.skeleton.bones.length);

        // 3. 애니메이션 추가 (선택사항)
        if (animationFbxUrl) {
          console.log(`[CharacterViewer3D] Loading animation from: ${animationFbxUrl}`);
          await loaderRef.current.addAnimation(character, animationFbxUrl, 'Walk');
        }

        // 애니메이션 목록 업데이트
        const animNames = loaderRef.current.getAnimationNames(character);
        setAnimationNames(animNames);
        console.log(`[CharacterViewer3D] Available animations: ${animNames.join(', ')}`);

        // 4. 렌더러 생성
        rendererRef.current = new CharacterRenderer(containerRef.current!, {
          width,
          height,
          backgroundColor: 0x1a1a1a,
          pixelRatio: window.devicePixelRatio
        });

        // 5. 메시 추가
        rendererRef.current.addCharacterMesh(character.mesh);

        // 6. 애니메이션 재생
        if (character.animations.length > 0) {
          let animToPlay = autoPlayAnimation;

          // autoPlayAnimation이 지정되지 않았으면 첫 번째 애니메이션 재생
          if (!animToPlay) {
            animToPlay = character.animations[0].name;
          }

          try {
            loaderRef.current.playAnimation(character, animToPlay);
            setCurrentAnimation(animToPlay);
            console.log(`[CharacterViewer3D] Playing animation: ${animToPlay}`);
          } catch (err) {
            console.warn(`[CharacterViewer3D] Could not play animation: ${err}`);
          }
        }

        // 7. 렌더링 시작
        rendererRef.current.startAnimationLoop(character.mixer, (deltaTime, currentFps) => {
          setFps(currentFps);
        });

        const endTime = performance.now();
        const totalLoadTime = endTime - startTime;
        setLoadTime(totalLoadTime);
        console.log(`[CharacterViewer3D] Total load time: ${totalLoadTime.toFixed(2)}ms`);

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[CharacterViewer3D] Error:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    loadAndRender();

    // 윈도우 리사이즈 처리
    const handleResize = () => {
      if (containerRef.current && rendererRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        rendererRef.current.handleWindowResize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // 정리 함수
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [characterFbxUrl, animationFbxUrl, width, height, autoPlayAnimation, showBoneInfo]);

  // 애니메이션 변경 핸들러
  const handleAnimationChange = (animationName: string) => {
    if (loaderRef.current && rendererRef.current) {
      try {
        // 구현 필요: 현재 실행 중인 AnimationMixer 참조 필요
        console.log(`[CharacterViewer3D] Requested animation change: ${animationName}`);
        setCurrentAnimation(animationName);
      } catch (err) {
        console.error(`[CharacterViewer3D] Error changing animation: ${err}`);
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a'
      }}
      data-testid="character-viewer-3d"
    >
      {/* 3D 렌더러 컨테이너 */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        data-testid="3d-canvas-container"
      />

      {/* 로딩 상태 */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '18px',
            fontFamily: 'monospace',
            textAlign: 'center',
            zIndex: 10
          }}
          data-testid="loading-indicator"
        >
          <div>로딩 중...</div>
          <div style={{ fontSize: '12px', marginTop: '10px', color: '#aaa' }}>
            캐릭터 로드 중
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            color: '#ff6b6b',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 20,
            overflow: 'auto',
            maxHeight: '150px'
          }}
          data-testid="error-message"
        >
          <strong>오류:</strong> {error}
        </div>
      )}

      {/* FPS 카운터 */}
      {!isLoading && showFPS && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            color: fps >= 50 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ff6b6b',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 15
          }}
          data-testid="fps-counter"
        >
          FPS: {fps}
        </div>
      )}

      {/* 캐릭터 정보 */}
      {!isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            color: '#aaa',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 15
          }}
          data-testid="character-info"
        >
          <div>Bones: {boneCount}</div>
          <div>Load: {loadTime.toFixed(0)}ms</div>
          {currentAnimation && <div>Anim: {currentAnimation}</div>}
        </div>
      )}

      {/* 애니메이션 선택 드롭다운 */}
      {!isLoading && animationNames.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 15
          }}
        >
          <select
            value={currentAnimation || ''}
            onChange={(e) => handleAnimationChange(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: '#2a2a2a',
              color: '#aaa',
              border: '1px solid #444',
              fontFamily: 'monospace',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            data-testid="animation-selector"
          >
            {animationNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default CharacterViewer3D;
