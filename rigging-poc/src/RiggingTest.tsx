import { useEffect, useRef, useState } from 'react';
import { CharacterLoader } from './3d-rigging/CharacterLoader';
import { CharacterRenderer } from './3d-rigging/CharacterRenderer';
import { BoneMapper } from './3d-rigging/BoneMapper';
import { FBXValidator } from './3d-rigging/FBXValidator';

function RiggingTest() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const [error, setError] = useState<string | null>(null);
    const [fps, setFps] = useState<number>(0);
    const [boneInfo, setBoneInfo] = useState<string[]>([]);
    const [cameraAngle, setCameraAngle] = useState<number>(0);
    const rendererRef = useRef<CharacterRenderer | null>(null);
    const characterRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let renderer: CharacterRenderer | null = null;
        let loader: CharacterLoader | null = null;

        const init = async () => {
            setStatus('Creating renderer...');

            // 1. Create renderer
            renderer = new CharacterRenderer(containerRef.current!, {
                width: 800,
                height: 600,
                backgroundColor: 0x2a2a3e,
                antialias: true
            });
            rendererRef.current = renderer;

            setStatus('Loading character model...');

            // 2. Create loader and load character
            loader = new CharacterLoader((progress) => {
                console.log(`Loading: ${progress.loaded}/${progress.total}`);
            });

            const character = await loader.loadCharacter('/models/Ch24_nonPBR.fbx');
            characterRef.current = character;

            // ===== FBX VALIDATION =====
            setStatus('Validating FBX model...');
            const validationResult = FBXValidator.validateFBXGroup(character.rawFbx!);

            // Print validation report to console
            FBXValidator.printValidationResult(validationResult, 'Ch24_nonPBR.fbx');

            // Check if validation failed
            if (!validationResult.isValid) {
                const errorMsg = validationResult.errors.join('\n');
                setError(errorMsg);
                setStatus('❌ FBX Validation Failed');
                console.error('[RiggingTest] FBX validation failed:', validationResult.errors);
                return; // Stop execution if validation fails
            }

            if (validationResult.warnings.length > 0) {
                console.warn('[RiggingTest] FBX validation warnings:', validationResult.warnings);
            }

            setStatus('Analyzing bones...');

            // 3. Get bone information BEFORE mapping
            const originalBones = character.skeleton.bones.map((b: any) => b.name);
            console.log('[RiggingTest] Original bones:', originalBones);
            setBoneInfo(originalBones);

            // 4. Auto-map bones
            const boneMapping = BoneMapper.autoMapBones(character.skeleton.bones);
            BoneMapper.applyMapping(character.mesh, boneMapping);

            // 5. Validate bones
            const validation = BoneMapper.validateBones(character.mesh);
            console.log('[RiggingTest] Validation:', validation);

            // 6. Get bone statistics
            const stats = BoneMapper.getBoneStatistics(character.mesh);
            console.log('[RiggingTest] Bone statistics:', stats);

            setStatus(`Bones: ${stats.totalBones} total, ${stats.standardBones} standard`);

            // 7. Add character mesh to renderer
            renderer.addCharacterMesh(character.mesh);

            // 8. Play animation if available
            if (character.animations.length > 0) {
                const animName = character.animations[0].name;
                setStatus(`Playing animation: ${animName}`);
                loader.playAnimation(character, animName);
            }

            setStatus('Starting animation loop...');

            // 9. Start animation loop
            renderer.startAnimationLoop([character.mixer], (_deltaTime, currentFps) => {
                setFps(Math.round(currentFps));
            });

            setStatus('✅ Ready! Character is rendering.');
        };

        init().catch(err => {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Error:', errorMessage);
            setError(errorMessage);
            setStatus('❌ Failed to load character');
        });

        // Cleanup
        return () => {
            if (renderer) {
                renderer.dispose();
            }
        };
    }, []);

    // Camera rotation control
    const rotateCamera = (angle: number) => {
        if (!rendererRef.current) return;

        const camera = (rendererRef.current as any).camera;
        const radius = 400;
        const angleRad = (angle * Math.PI) / 180;

        camera.position.x = Math.sin(angleRad) * radius;
        camera.position.z = Math.cos(angleRad) * radius;
        camera.lookAt(0, 0, 0);

        setCameraAngle(angle);
    };

    // Capture screenshot
    const captureScreenshot = () => {
        if (!rendererRef.current) return;
        rendererRef.current.captureScreenshot(`rigging_test_angle_${cameraAngle}.png`);
    };

    // Auto-rotate and capture
    const autoCapture = async () => {
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];
        for (const angle of angles) {
            rotateCamera(angle);
            await new Promise(resolve => setTimeout(resolve, 500));
            captureScreenshot();
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a2e',
            color: '#ffffff',
            fontFamily: 'monospace',
            padding: '20px'
        }}>
            <h1 style={{ marginBottom: '20px' }}>3D Rigging Test - Multi-Angle Verification</h1>

            <div
                ref={containerRef}
                style={{
                    width: '800px',
                    height: '600px',
                    border: '2px solid #4a4a6a',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '20px'
                }}
            />

            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <button onClick={() => rotateCamera(0)} style={buttonStyle}>Front (0°)</button>
                <button onClick={() => rotateCamera(45)} style={buttonStyle}>45°</button>
                <button onClick={() => rotateCamera(90)} style={buttonStyle}>Side (90°)</button>
                <button onClick={() => rotateCamera(135)} style={buttonStyle}>135°</button>
                <button onClick={() => rotateCamera(180)} style={buttonStyle}>Back (180°)</button>
                <button onClick={() => rotateCamera(225)} style={buttonStyle}>225°</button>
                <button onClick={() => rotateCamera(270)} style={buttonStyle}>Side (270°)</button>
                <button onClick={() => rotateCamera(315)} style={buttonStyle}>315°</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={captureScreenshot} style={{ ...buttonStyle, backgroundColor: '#4CAF50' }}>
                    📸 Capture Screenshot
                </button>
                <button onClick={autoCapture} style={{ ...buttonStyle, backgroundColor: '#2196F3' }}>
                    🎬 Auto-Capture All Angles
                </button>
            </div>

            <div style={{
                padding: '15px',
                backgroundColor: '#2a2a3e',
                borderRadius: '8px',
                minWidth: '600px',
                marginBottom: '20px'
            }}>
                <p><strong>Status:</strong> {status}</p>
                <p><strong>FPS:</strong> {fps}</p>
                <p><strong>Camera Angle:</strong> {cameraAngle}°</p>
                {error && (
                    <p style={{ color: '#ff6b6b', whiteSpace: 'pre-wrap' }}><strong>Error:</strong><br />{error}</p>
                )}
            </div>

            {boneInfo.length > 0 && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#2a2a3e',
                    borderRadius: '8px',
                    maxWidth: '800px',
                    maxHeight: '200px',
                    overflow: 'auto'
                }}>
                    <p><strong>Detected Bones ({boneInfo.length}):</strong></p>
                    <div style={{
                        fontSize: '11px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '5px',
                        marginTop: '10px'
                    }}>
                        {boneInfo.map((bone, i) => (
                            <div key={i}>{bone}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#4a4a6a',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'monospace'
};

export default RiggingTest;
