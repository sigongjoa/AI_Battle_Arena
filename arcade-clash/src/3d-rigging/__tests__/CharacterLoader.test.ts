import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CharacterLoader } from '../CharacterLoader';

describe('CharacterLoader', () => {
  let loader: CharacterLoader;

  beforeEach(() => {
    loader = new CharacterLoader();
  });

  it('should initialize CharacterLoader', () => {
    expect(loader).toBeDefined();
    expect(loader).toBeInstanceOf(CharacterLoader);
  });

  it('should have getAnimationNames method', () => {
    expect(loader.getAnimationNames).toBeDefined();
    expect(typeof loader.getAnimationNames).toBe('function');
  });

  it('should have stopAllAnimations method', () => {
    expect(loader.stopAllAnimations).toBeDefined();
    expect(typeof loader.stopAllAnimations).toBe('function');
  });

  it('should have dispose method', () => {
    expect(loader.dispose).toBeDefined();
    expect(typeof loader.dispose).toBe('function');
  });

  it('should have getBoneInfo method', () => {
    expect(loader.getBoneInfo).toBeDefined();
    expect(typeof loader.getBoneInfo).toBe('function');
  });

  describe('Animation Management', () => {
    it('should return empty array for character without animations', () => {
      // 목(mock) SkinnedMesh 생성
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);
      const skeleton = new THREE.Skeleton([]);
      mesh.bind(skeleton);

      const character = {
        mesh,
        skeleton,
        animations: [],
        mixer: new THREE.AnimationMixer(mesh)
      };

      const names = loader.getAnimationNames(character);
      expect(names).toEqual([]);
    });

    it('should return animation names', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);
      const skeleton = new THREE.Skeleton([]);
      mesh.bind(skeleton);

      const clip1 = new THREE.AnimationClip('Walk', 2, []);
      const clip2 = new THREE.AnimationClip('Run', 2, []);

      const character = {
        mesh,
        skeleton,
        animations: [clip1, clip2],
        mixer: new THREE.AnimationMixer(mesh)
      };

      const names = loader.getAnimationNames(character);
      expect(names).toEqual(['Walk', 'Run']);
    });
  });

  describe('Bone Information', () => {
    it('should get bone info', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);

      const bone1 = new THREE.Bone();
      bone1.name = 'Hips';
      bone1.position.set(0, 0, 0);

      const bone2 = new THREE.Bone();
      bone2.name = 'Spine';
      bone2.position.set(0, 1, 0);

      const skeleton = new THREE.Skeleton([bone1, bone2]);
      mesh.bind(skeleton);

      const character = {
        mesh,
        skeleton,
        animations: [],
        mixer: new THREE.AnimationMixer(mesh)
      };

      const boneInfo = loader.getBoneInfo(character);

      expect(boneInfo).toHaveLength(2);
      expect(boneInfo[0].name).toBe('Hips');
      expect(boneInfo[1].name).toBe('Spine');
      expect(boneInfo[0].position).toEqual(new THREE.Vector3(0, 0, 0));
    });
  });

  describe('Error Handling', () => {
    it('should throw error when loading invalid FBX URL', async () => {
      const invalidUrl = '/invalid/path/does/not/exist.fbx';

      await expect(loader.loadCharacter(invalidUrl)).rejects.toThrow();
    });

    it('should throw error when adding animation from invalid URL', async () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);
      const skeleton = new THREE.Skeleton([]);
      mesh.bind(skeleton);

      const character = {
        mesh,
        skeleton,
        animations: [],
        mixer: new THREE.AnimationMixer(mesh)
      };

      const invalidUrl = '/invalid/animation.fbx';

      await expect(loader.addAnimation(character, invalidUrl, 'Invalid')).rejects.toThrow();
    });

    it('should throw error when playing non-existent animation', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);
      const skeleton = new THREE.Skeleton([]);
      mesh.bind(skeleton);

      const character = {
        mesh,
        skeleton,
        animations: [],
        mixer: new THREE.AnimationMixer(mesh)
      };

      expect(() => {
        loader.playAnimation(character, 'NonExistentAnimation');
      }).toThrow();
    });
  });

  describe('Animation Playback', () => {
    it('should play animation and return AnimationAction', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);
      const skeleton = new THREE.Skeleton([]);
      mesh.bind(skeleton);

      const clip = new THREE.AnimationClip('Walk', 2, []);
      const character = {
        mesh,
        skeleton,
        animations: [clip],
        mixer: new THREE.AnimationMixer(mesh)
      };

      const action = loader.playAnimation(character, 'Walk');

      expect(action).toBeDefined();
      expect(action.isRunning()).toBe(true);
    });

    it('should stop all animations', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);
      const skeleton = new THREE.Skeleton([]);
      mesh.bind(skeleton);

      const clip = new THREE.AnimationClip('Walk', 2, []);
      const character = {
        mesh,
        skeleton,
        animations: [clip],
        mixer: new THREE.AnimationMixer(mesh)
      };

      loader.playAnimation(character, 'Walk');
      loader.stopAllAnimations(character);

      // 모든 액션이 멈춰야 함
      const actions = character.mixer._actions;
      actions.forEach((action: any) => {
        expect(action.isRunning()).toBe(false);
      });
    });
  });
});
