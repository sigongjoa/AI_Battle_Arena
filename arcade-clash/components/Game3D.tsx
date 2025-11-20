import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Character as CharacterType } from '../types';
import { CharacterLoader } from '../src/3d-rigging/CharacterLoader';
import { CharacterRenderer } from '../src/3d-rigging/CharacterRenderer';
import { BoneMapper } from '../src/3d-rigging/BoneMapper';

/**
 * 게임 상태에서의 플레이어 정보
 */
interface GamePlayer {
  id: number;
  character: string;
  x: number;
  y: number;
  health: number;
  action: 'idle' | 'walk' | 'punch';
  frame: number;
}

/**
 * Game3D 컴포넌트의 Props
 */
interface Game3DProps {
  gameState: {
    timer: number;
    players: GamePlayer[];
  };
  player1: CharacterType;
  player2: CharacterType;
  /** 캐릭터 FBX 파일 URL 맵 (character name -> FBX URL) */
  characterFbxUrls?: { [key: string]: string };
}

/**
 * 3D 리깅 시스템을 사용한 게임 렌더링 컴포넌트
 *
 * Phase 8에서 개발한 CharacterLoader, CharacterRenderer를 사용하여
 * 3D 캐릭터를 정면 2D 뷰로 렌더링합니다.
 */
const Game3D: React.FC<Game3DProps> = ({ gameState, player1, player2, characterFbxUrls = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CharacterRenderer | null>(null);
  const loadersRef = useRef<{ [key: string]: CharacterLoader }>({});
  const characterAssetsRef = useRef<{ [key: string]: any }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [loadTime, setLoadTime] = useState(0);

  // FBX URL 매핑 - 실제 모델 파일 로드
  const getCharacterFbxUrl = (characterName: string): string => {
    // 모든 캐릭터에 동일한 Remy 모델 사용 (임시)
    return characterFbxUrls[characterName.toLowerCase()] || '/models/remy.fbx';
  };

  // 디버그용 함수
  const logAssetState = (label: string) => {
    const assets = Object.keys(characterAssetsRef.current);
    console.log(`[Game3D] ${label} - Assets in ref: ${assets.join(', ')} (count: ${assets.length})`);
    Object.entries(characterAssetsRef.current).forEach(([key, asset]) => {
      console.log(`  └─ ${key}: mesh=${asset?.mesh ? 'YES' : 'NO'}, position=(${asset?.mesh?.position.x.toFixed(2)}, ${asset?.mesh?.position.y.toFixed(2)}, ${asset?.mesh?.position.z.toFixed(2)})`);
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const loadAndRender = async () => {
      try {
        const startTime = performance.now();

        // 1. 렌더러 생성 (한 번만)
        if (!rendererRef.current) {
          const width = containerRef.current!.clientWidth || 1400;
          const height = containerRef.current!.clientHeight || 600;

          console.log(`[Game3D] Creating renderer with size: ${width}x${height}`);
          console.log(`[Game3D] Container rect:`, containerRef.current!.getBoundingClientRect());

          rendererRef.current = new CharacterRenderer(containerRef.current!, {
            width,
            height,
            backgroundColor: 0x1a1a2e,
            pixelRatio: window.devicePixelRatio
          });
        }

        // 2. 플레이어별 캐릭터 로드
        const characterNames = Array.from(new Set(gameState.players.map(p => p.character.toLowerCase())));

        for (const characterName of characterNames) {
          if (characterAssetsRef.current[characterName]) {
            continue; // 이미 로드됨
          }

          try {
            // CharacterLoader 생성
            if (!loadersRef.current[characterName]) {
              loadersRef.current[characterName] = new CharacterLoader((progress) => {
                console.log(`[Game3D] Loading ${characterName}: ${progress.loaded}/${progress.total}`);
              });
            }

            const loader = loadersRef.current[characterName];
            // 모든 캐릭터에 Remy 모델 사용
            const fbxUrl = '/models/remy.fbx';

            console.log(`[Game3D] Loading character: ${characterName} from ${fbxUrl}`);
            const character = await loader.loadCharacter(fbxUrl);

            // 본 자동 매핑
            console.log(`[Game3D] Auto-mapping bones for ${characterName}...`);
            const boneMapping = BoneMapper.autoMapBones(character.skeleton.bones);
            BoneMapper.applyMapping(character.mesh, boneMapping);

            // 본 검증
            const validation = BoneMapper.validateBones(character.mesh);
            if (!validation.isValid) {
              console.warn(`[Game3D] Bone validation failed for ${characterName}`);
            }

            // 렌더러에 메시 추가
            rendererRef.current!.addCharacterMesh(character.mesh);
            // 메시 로드 후 Y 오프셋 저장 (프레임마다 리셋되는 것을 방지)
            const meshYOffset = character.mesh.position.y;
            const meshZOffset = character.mesh.position.z;
            characterAssetsRef.current[characterName] = {
              ...character,
              meshYOffset,
              meshZOffset
            };

            console.log(`[Game3D] ✅ Loaded character: ${characterName}`);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error(`[Game3D] Failed to load character ${characterName}: ${errorMessage}`);
            // 플레이스홀더 박스로 대체 - 카메라 뷰 범위 내에서 표시
            const placeholderBox = new THREE.Mesh(
              new THREE.BoxGeometry(60, 120, 40),
              new THREE.MeshStandardMaterial({
                color: 0x6db3f2,
                metalness: 0.2,
                roughness: 0.3,
                emissive: 0x4a9eff,
                emissiveIntensity: 0.5
              })
            );
            placeholderBox.castShadow = true;
            placeholderBox.receiveShadow = true;
            // 플레이어별 위치 설정 (카메라 뷰 범위 내)
            const playerIndex = gameState.players.findIndex(p => p.character.toLowerCase() === characterName);
            if (playerIndex >= 0) {
              const player = gameState.players[playerIndex];
              placeholderBox.position.x = (player.x - 600) / 10; // 스케일 조정
              placeholderBox.position.z = playerIndex === 0 ? -50 : 50;
              console.log(`[Game3D] Placeholder position for ${characterName}: (${placeholderBox.position.x}, 0, ${placeholderBox.position.z})`);
            }
            rendererRef.current!.getScene().add(placeholderBox);
            characterAssetsRef.current[characterName] = { mesh: placeholderBox, mixer: null };
            console.log(`[Game3D] ✅ Added placeholder for character: ${characterName}`);
          }
        }

        // 3. 애니메이션 렌더링 루프 시작
        // 유효한 mixer 찾기 (있으면 사용, 없으면 더미 mixer 생성)
        const mixers = Object.values(characterAssetsRef.current)
          .map(asset => asset.mixer)
          .filter(mixer => mixer !== null);

        // mixer가 없어도 항상 렌더링 루프 시작 (placeholder의 경우 mixer가 null)
        const mixerToUse = mixers.length > 0
          ? mixers[0]
          : new THREE.AnimationMixer(new THREE.Object3D());

        // 애니메이션 루프 시작 전 asset 상태 확인
        logAssetState('BEFORE animation loop start');

        rendererRef.current!.startAnimationLoop(mixerToUse, (deltaTime, currentFps) => {
          setFps(Math.round(currentFps));
          // 위치 업데이트는 별도의 useEffect에서 처리됨 (line 230-240)
        });

        console.log(`[Game3D] Animation loop started with ${mixers.length} valid mixer(s)`);
        logAssetState('AFTER animation loop start');

        const endTime = performance.now();
        const totalLoadTime = endTime - startTime;
        setLoadTime(totalLoadTime);
        console.log(`[Game3D] Total load time: ${totalLoadTime.toFixed(2)}ms`);

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[Game3D] Error:', errorMessage);
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
        rendererRef.current = null;
      }
    };
  }, []); // 초기 로드만 수행

  /**
   * 게임 상태에 따라 캐릭터 위치 업데이트
   */
  useEffect(() => {
    if (!rendererRef.current) return;

    const updatePositions = () => {
      updateCharacterPositions(gameState);
      requestAnimationFrame(updatePositions);
    };

    const frameId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(frameId);
  }, [gameState]);

  const updateCharacterPositions = (gameState: { timer: number; players: GamePlayer[] }) => {
    gameState.players.forEach((player, index) => {
      const asset = characterAssetsRef.current[player.character.toLowerCase()];
      if (asset?.mesh) {
        // 위치 업데이트 (X축만 게임 상태에 따라 움직임)
        // Y축: 메시 로드 시 계산된 중심 오프셋 유지 (절대 0으로 리셋하지 않음)
        // Z축: 플레이어 깊이 (카메라 전면 배치)
        const newX = (player.x - 600) / 100;
        const newZ = player.id === 1 ? -2 : 2;

        asset.mesh.position.x = newX;
        // Y 위치는 로드 시점의 중심 오프셋 유지 - 변경하지 않음
        // asset.mesh.position.y는 이미 CharacterRenderer.addCharacterMesh()에서 설정됨
        asset.mesh.position.z = newZ;

        // 디버그 로그 (첫 5프레임만)
        if (index === 0 && performance.now() % 1000 < 16) {
          console.log(`[Game3D] UPDATE ${player.character}: pos(${newX.toFixed(2)}, ${asset.mesh.position.y.toFixed(2)}, ${newZ}), health=${player.health}, action=${player.action}`);
        }

        // 액션에 따른 애니메이션 업데이트 (간단한 구현)
        // 실제로는 애니메이션 클립을 플레이해야 함
        if (player.action === 'punch') {
          asset.mesh.rotation.z = Math.sin(performance.now() / 100) * 0.2;
        } else {
          asset.mesh.rotation.z *= 0.95;
        }
      } else {
        // Asset이 없는 경우 로그
        if (index === 0 && performance.now() % 2000 < 16) {
          console.warn(`[Game3D] NO ASSET for ${player.character}. Available:`, Object.keys(characterAssetsRef.current));
        }
      }
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-900" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 3D 렌더러 컨테이너 */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          flex: '1 1 auto',
          minHeight: 0,
          display: 'block'
        }}
        data-testid="game-3d-container"
      />

      {/* 로딩 상태 */}
      {isLoading && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10"
          data-testid="loading-indicator"
        >
          <div className="text-white text-xl font-mono">3D 캐릭터 로딩 중...</div>
          <div className="text-gray-400 text-sm font-mono mt-2">
            모델을 준비 중입니다
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div
          className="absolute top-4 left-4 right-4 bg-red-900/80 text-red-100 p-3 rounded font-mono text-xs z-20"
          data-testid="error-message"
        >
          <strong>오류:</strong> {error}
        </div>
      )}

      {/* HUD - 게임 정보 */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-5">
        <div className="flex justify-between items-center text-white">
          {/* P1 정보 */}
          <div className="font-mono">
            <p className="font-bold text-lg">{player1.name}</p>
            <div className="mt-2 bg-black/60 p-2 rounded">
              <div className="text-sm">HP: {gameState.players[0]?.health || 100}/100</div>
              <div className="w-32 h-4 bg-gray-700 rounded mt-1">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${gameState.players[0]?.health || 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 중앙 - 타이머 */}
          <div className="text-center font-mono">
            <p className="text-5xl font-bold text-yellow-400">{Math.ceil(gameState.timer)}</p>
          </div>

          {/* P2 정보 */}
          <div className="font-mono text-right">
            <p className="font-bold text-lg">{player2.name}</p>
            <div className="mt-2 bg-black/60 p-2 rounded">
              <div className="text-sm">HP: {gameState.players[1]?.health || 100}/100</div>
              <div className="w-32 h-4 bg-gray-700 rounded mt-1">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${gameState.players[1]?.health || 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성능 정보 - 우측 하단 */}
      {!isLoading && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-gray-300 p-2 rounded font-mono text-xs z-5 pointer-events-none">
          <div>FPS: <span className={fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>{fps}</span></div>
          <div>Load: {loadTime.toFixed(0)}ms</div>
        </div>
      )}

      {/* 컨트롤 안내 - 좌측 하단 */}
      <div className="absolute bottom-4 left-4 text-white text-xs font-mono bg-black/60 p-2 rounded pointer-events-none z-5">
        <div className="text-gray-400">P1: ← → + Space</div>
        <div className="text-gray-400">P2: A/D + W</div>
      </div>
    </div>
  );
};

export default Game3D;
