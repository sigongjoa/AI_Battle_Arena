import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { BoneMapper } from '../BoneMapper';

describe('BoneMapper', () => {
  it('should have standard bones defined', () => {
    expect(BoneMapper.STANDARD_BONES).toBeDefined();
    expect(BoneMapper.STANDARD_BONES.ROOT).toBe('Hips');
    expect(BoneMapper.STANDARD_BONES.SPINE).toBe('Spine');
    expect(BoneMapper.STANDARD_BONES.HEAD).toBe('Head');
    expect(BoneMapper.STANDARD_BONES.LEFT_ARM).toBe('LeftArm');
    expect(BoneMapper.STANDARD_BONES.RIGHT_ARM).toBe('RightArm');
  });

  describe('Auto Bone Mapping', () => {
    it('should map Mixamo bones to standard names', () => {
      const bones = [
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'mixamorig:Hips';
      bones[1].name = 'mixamorig:Spine';
      bones[2].name = 'mixamorig:Head';
      bones[3].name = 'mixamorig:LeftArm';
      bones[4].name = 'mixamorig:RightArm';

      const mapping = BoneMapper.autoMapBones(bones);

      expect(mapping.get('mixamorig:Hips')).toBe('Hips');
      expect(mapping.get('mixamorig:Spine')).toBe('Spine');
      expect(mapping.get('mixamorig:Head')).toBe('Head');
      expect(mapping.get('mixamorig:LeftArm')).toBe('LeftArm');
      expect(mapping.get('mixamorig:RightArm')).toBe('RightArm');
    });

    it('should map CMU bones to standard names', () => {
      const bones = [
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'Hips';
      bones[1].name = 'Chest';
      bones[2].name = 'Head';

      const mapping = BoneMapper.autoMapBones(bones);

      expect(mapping.get('Hips')).toBe('Hips');
      expect(mapping.get('Chest')).toBe('Spine');
      expect(mapping.get('Head')).toBe('Head');
    });

    it('should handle alternative bone naming conventions', () => {
      const bones = [
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'root';
      bones[1].name = 'torso';
      bones[2].name = 'l_arm';

      const mapping = BoneMapper.autoMapBones(bones);

      expect(mapping.get('root')).toBe('Hips');
      expect(mapping.get('torso')).toBe('Spine');
      expect(mapping.get('l_arm')).toBe('LeftArm');
    });

    it('should handle left/right bones', () => {
      const bones = [
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'LeftShoulder';
      bones[1].name = 'RightShoulder';
      bones[2].name = 'LeftLeg';
      bones[3].name = 'RightLeg';

      const mapping = BoneMapper.autoMapBones(bones);

      expect(mapping.get('LeftShoulder')).toBe('LeftShoulder');
      expect(mapping.get('RightShoulder')).toBe('RightShoulder');
      expect(mapping.get('LeftLeg')).toBe('LeftLeg');
      expect(mapping.get('RightLeg')).toBe('RightLeg');
    });

    it('should return mapping with success and failures', () => {
      const bones = [
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'mixamorig:Hips';
      bones[1].name = 'unknownBone123'; // 매핑 불가능
      bones[2].name = 'Head';

      const mapping = BoneMapper.autoMapBones(bones);

      expect(mapping.size).toBe(2); // 2개만 매핑됨
      expect(mapping.has('unknownBone123')).toBe(false);
    });
  });

  describe('Apply Mapping', () => {
    it('should apply bone name mapping to SkinnedMesh', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);

      const bone1 = new THREE.Bone();
      bone1.name = 'mixamorig:Hips';

      const bone2 = new THREE.Bone();
      bone2.name = 'mixamorig:Spine';

      const skeleton = new THREE.Skeleton([bone1, bone2]);
      mesh.bind(skeleton);

      const mapping = new Map([
        ['mixamorig:Hips', 'Hips'],
        ['mixamorig:Spine', 'Spine']
      ]);

      BoneMapper.applyMapping(mesh, mapping);

      expect(mesh.skeleton.bones[0].name).toBe('Hips');
      expect(mesh.skeleton.bones[1].name).toBe('Spine');
    });
  });

  describe('Standard Bone Validation', () => {
    it('should identify standard bones', () => {
      expect(BoneMapper.isStandardBone('Hips')).toBe(true);
      expect(BoneMapper.isStandardBone('Spine')).toBe(true);
      expect(BoneMapper.isStandardBone('LeftArm')).toBe(true);
      expect(BoneMapper.isStandardBone('unknownBone')).toBe(false);
    });

    it('should validate bone structure', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);

      const bones = [
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'Hips';
      bones[1].name = 'Spine';
      bones[2].name = 'Head';
      bones[3].name = 'LeftArm';
      bones[4].name = 'RightArm';
      bones[5].name = 'LeftLeg';
      bones[6].name = 'RightLeg';

      const skeleton = new THREE.Skeleton(bones);
      mesh.bind(skeleton);

      const validation = BoneMapper.validateBones(mesh);

      expect(validation.isValid).toBe(true);
      expect(validation.missingBones).toHaveLength(0);
      expect(validation.foundBones).toHaveLength(7);
    });

    it('should report missing critical bones', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);

      const bones = [
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'Hips';
      bones[1].name = 'Spine';
      // 다른 주요 본들이 없음

      const skeleton = new THREE.Skeleton(bones);
      mesh.bind(skeleton);

      const validation = BoneMapper.validateBones(mesh);

      expect(validation.isValid).toBe(false);
      expect(validation.missingBones.length).toBeGreaterThan(0);
      expect(validation.missingBones).toContain('Head');
    });
  });

  describe('Bone Statistics', () => {
    it('should calculate bone statistics', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial();
      const mesh = new THREE.SkinnedMesh(geometry, material);

      const bones = [
        new THREE.Bone(),
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'Hips';
      bones[1].name = 'Spine';
      bones[2].name = 'unknownBone';

      const skeleton = new THREE.Skeleton(bones);
      mesh.bind(skeleton);

      const stats = BoneMapper.getBoneStatistics(mesh);

      expect(stats.totalBones).toBe(3);
      expect(stats.standardBones).toBe(2);
      expect(stats.nonStandardBones).toBe(1);
      expect(parseFloat(stats.standardPercentage as any)).toBe(66.7);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty bone array', () => {
      const mapping = BoneMapper.autoMapBones([]);

      expect(mapping).toBeDefined();
      expect(mapping.size).toBe(0);
    });

    it('should handle bones with special characters', () => {
      const bones = [
        new THREE.Bone(),
        new THREE.Bone()
      ];

      bones[0].name = 'mixamorig_Hips-001';
      bones[1].name = 'mixamorig:Spine.002';

      const mapping = BoneMapper.autoMapBones(bones);

      // 특수 문자가 있어도 기본 이름이 인식되어야 함
      expect(mapping.get('mixamorig_Hips-001')).toBe('Hips');
      expect(mapping.get('mixamorig:Spine.002')).toBe('Spine');
    });
  });
});
