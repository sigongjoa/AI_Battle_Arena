import * as THREE from 'three';

/**
 * 렌더러 설정 옵션
 */
export interface RendererOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  pixelRatio?: number;
  antialias?: boolean;
  alpha?: boolean;
}

/**
 * 3D 캐릭터를 정면 2D 뷰로 렌더링하는 Three.js 기반 렌더러
 *
 * OrthographicCamera를 사용하여 철권(Tekken) 스타일의 정면 뷰를 구현합니다.
 */
export class CharacterRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private container: HTMLElement;

  // 성능 측정용
  private frameCount: number = 0;
  private fps: number = 0;
  private lastFpsTime: number = 0;

  constructor(container: HTMLElement, options: RendererOptions = {}) {
    const {
      width = 800,
      height = 600,
      backgroundColor = 0x1a1a1a,
      pixelRatio = window.devicePixelRatio,
      antialias = true,
      alpha = false
    } = options;

    this.container = container;

    // Scene 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(backgroundColor);

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
    this.renderer = new THREE.WebGLRenderer({ antialias, alpha });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    container.appendChild(this.renderer.domElement);

    // 조명 설정
    this.setupLighting();

    // 윈도우 리사이즈 이벤트 리스너
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  /**
   * 조명 설정
   * 정면, 배경, 환경광을 조합하여 균형잡힌 조명 구현
   */
  private setupLighting(): void {
    // 전면 조명 (주광)
    const frontLight = new THREE.DirectionalLight(0xffffff, 1);
    frontLight.position.set(0, 50, 100);
    frontLight.castShadow = true;
    frontLight.shadow.camera.left = -300;
    frontLight.shadow.camera.right = 300;
    frontLight.shadow.camera.top = 300;
    frontLight.shadow.camera.bottom = -300;
    this.scene.add(frontLight);

    // 배경 조명 (그림자 방지, 역광 효과)
    const backLight = new THREE.DirectionalLight(0x8888ff, 0.5);
    backLight.position.set(0, 0, -100);
    this.scene.add(backLight);

    // 환경광 (전반적인 밝기)
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
  }

  /**
   * 캐릭터 메시를 씬에 추가
   * @param mesh SkinnedMesh 객체
   */
  addCharacterMesh(mesh: THREE.SkinnedMesh): void {
    // 캐릭터를 씬 중앙에 배치
    mesh.position.set(0, 0, 0);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);

    // 뼈 위치 확인 (디버그용)
    if (mesh.skeleton && mesh.skeleton.bones) {
      console.log(`[CharacterRenderer] Loaded ${mesh.skeleton.bones.length} bones`);
      const boneNames = mesh.skeleton.bones.slice(0, 5).map(b => b.name);
      console.log(`[CharacterRenderer] Sample bones: ${boneNames.join(', ')}`);
    }
  }

  /**
   * 애니메이션 업데이트 루프 시작
   * @param mixer AnimationMixer 객체
   * @param onFrame 각 프레임마다 실행할 콜백 함수
   */
  startAnimationLoop(
    mixer: THREE.AnimationMixer,
    onFrame?: (deltaTime: number, fps: number) => void
  ): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const deltaTime = this.clock.getDelta();
      mixer.update(deltaTime);

      // FPS 계산
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      // 프레임 콜백 실행
      if (onFrame) {
        onFrame(deltaTime, this.fps);
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * 현재 FPS 값 조회
   * @returns 초당 프레임 수
   */
  getFPS(): number {
    return this.fps;
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
   * 장면에 객체 추가 (커스텀 디버그 객체 등)
   * @param object THREE.Object3D
   */
  addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * 정리 및 메모리 해제
   */
  dispose(): void {
    this.stopAnimationLoop();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /**
   * 뷰포트 크기 조정
   * @param width 새로운 너비
   * @param height 새로운 높이
   */
  handleWindowResize(width?: number, height?: number): void {
    const w = width || this.container.clientWidth;
    const h = height || this.container.clientHeight;

    const aspect = w / h;

    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }

  /**
   * 스크린샷 캡처
   * @param fileName 저장할 파일명
   */
  captureScreenshot(fileName: string = 'screenshot.png'): void {
    const link = document.createElement('a');
    link.href = this.renderer.domElement.toDataURL('image/png');
    link.download = fileName;
    link.click();
  }

  /**
   * 현재 씬 객체 조회
   * @returns Three.js Scene 객체
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * WebGL 렌더러 HTML 엘리먼트 조회
   * @returns Canvas 엘리먼트
   */
  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * 씬의 배경색 변경
   * @param color 색상 (16진수)
   */
  setBackgroundColor(color: number): void {
    this.scene.background = new THREE.Color(color);
  }

  /**
   * 카메라 줌 조정
   * @param zoomFactor 줌 배수 (> 1 = 확대, < 1 = 축소)
   */
  setZoom(zoomFactor: number): void {
    this.camera.zoom = zoomFactor;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 디버그 정보 조회
   * @returns 렌더러 정보 객체
   */
  getDebugInfo(): {
    fps: number;
    meshCount: number;
    lightCount: number;
    cameraType: string;
  } {
    return {
      fps: this.fps,
      meshCount: this.scene.children.filter(
        child => child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh
      ).length,
      lightCount: this.scene.children.filter(child => child instanceof THREE.Light).length,
      cameraType: this.camera.type
    };
  }
}
