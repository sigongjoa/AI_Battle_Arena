import React from 'react';
import characterMetadata from '../src/components/characterMetadata.json';

interface CharacterProps {
  name: string;
  x: number;
  y: number;
  action: string;
  frame: number;
  direction: 'left' | 'right';
}

const Character: React.FC<CharacterProps> = ({ name, x, y, action, frame, direction }) => {
  const metadata = characterMetadata[name.toLowerCase() as keyof typeof characterMetadata];
  if (!metadata) return null; // or a fallback

  const actionMeta = metadata.animations[action as keyof typeof metadata.animations];
  // Use idle animation as a fallback if the current action is not in the metadata
  const currentActionMeta = actionMeta || metadata.animations.idle;

  const frameIndex = frame % currentActionMeta.frames;
  
  const style: React.CSSProperties = {
    position: 'absolute',
    // Adjust position to have the feet at the (x, y) coordinate
    left: `${x - metadata.frameWidth / 2}px`,
    top: `${y - metadata.frameHeight}px`,
    width: `${metadata.frameWidth}px`,
    height: `${metadata.frameHeight}px`,
    backgroundImage: `url(${metadata.image})`,
    backgroundPosition: `-${frameIndex * metadata.frameWidth}px -${currentActionMeta.row * metadata.frameHeight}px`,
    transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)', // Flip sprite based on direction
    imageRendering: 'pixelated', // Keeps pixel art crisp
  };

  return <div style={style} />;
};

export default Character;
