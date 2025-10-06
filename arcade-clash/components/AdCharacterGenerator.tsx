import React, { useState } from 'react';
import { CharacterData, CharacterThemeResponse } from '@/types'; // Import CharacterData interfaces

interface AdCharacterGeneratorProps {
  onCharacterGenerated: (characterData: CharacterData) => void;
}

const AdCharacterGenerator: React.FC<AdCharacterGeneratorProps> = ({ onCharacterGenerated }) => {
  const [adText, setAdText] = useState<string>('');
  const [themeResponse, setThemeResponse] = useState<CharacterThemeResponse | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const backendBaseUrl = 'http://localhost:8000'; // FastAPI 백엔드 URL

  const handleExtractTheme = async () => {
    setLoading(true);
    setError(null);
    setThemeResponse(null);
    setCharacterData(null);

    try {
      const response = await fetch(`${backendBaseUrl}/character-theme?ad_text=${encodeURIComponent(adText)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CharacterThemeResponse = await response.json();
      setThemeResponse(data);
    } catch (e: any) {
      setError(`테마 추출 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCharacter = async () => {
    if (!themeResponse) {
      setError('먼저 테마를 추출해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setCharacterData(null);

    try {
      const response = await fetch(`${backendBaseUrl}/generate-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: themeResponse.theme,
          attributes: themeResponse.attributes,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CharacterData = await response.json();
      setCharacterData(data);
      onCharacterGenerated(data); // Call the prop with the generated character data
    } catch (e: any) {
      setError(`캐릭터 생성 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>광고 기반 캐릭터 생성기 (Phase 6)</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="adText" style={{ display: 'block', marginBottom: '5px' }}>광고 텍스트 입력:</label>
        <input
          id="adText"
          type="text"
          value={adText}
          onChange={(e) => setAdText(e.target.value)}
          placeholder="예: F1 레이싱, 건설 현장, 맛있는 요리"
          style={{ width: '300px', padding: '8px', marginRight: '10px' }}
        />
        <button onClick={handleExtractTheme} disabled={loading || !adText}>
          {loading ? '추출 중...' : '테마 추출'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {themeResponse && (
        <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h2>추출된 테마:</h2>
          <p><strong>테마:</strong> {themeResponse.theme}</p>
          <p><strong>속성:</strong> {themeResponse.attributes.join(', ')}</p>
          <button onClick={handleGenerateCharacter} disabled={loading}>
            {loading ? '생성 중...' : '캐릭터 생성'}
          </button>
        </div>
      )}

      {characterData && (
        <div style={{ border: '1px solid #007bff', padding: '10px', backgroundColor: '#e7f3ff' }}>
          <h2>생성된 캐릭터 데이터:</h2>
          <p><strong>ID:</strong> {characterData.id}</p>
          <p><strong>테마:</strong> {characterData.theme}</p>
          <h3>외형:</h3>
          <p>모델 ID: {characterData.appearance.modelId}</p>
          <p>텍스처 ID: {characterData.appearance.textureId}</p>
          <p>색상: {characterData.appearance.colorScheme.join(', ')}</p>
          <p>파츠: {characterData.appearance.parts.join(', ')}</p>
          <h3>스킬:</h3>
          <ul>
            {characterData.skills.map((skill, index) => (
              <li key={index}>{skill.name} (효과: {skill.effect}, 애니메이션: {skill.animationId})</li>
            ))}
          </ul>
          <h3>능력치:</h3>
          <p>체력: {characterData.parameters.health}</p>
          <p>공격력: {characterData.parameters.attackPower}</p>
          <p>방어력: {characterData.parameters.defense}</p>
          <p>속도: {characterData.parameters.speed}</p>
        </div>
      )}
    </div>
  );
};

export default AdCharacterGenerator;
