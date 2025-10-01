import React from 'react';

interface CharacterProps {
  name: string;
  x: number;
  y: number;
  action: string;
  frame: number;
}

const Character: React.FC<CharacterProps> = ({ name, x, y, action, frame }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: '100px', // Placeholder width
    height: '150px', // Placeholder height
    backgroundColor: 'rgba(255, 0, 0, 0.5)', // Placeholder color
    border: '1px solid red',
    textAlign: 'center',
    color: 'white',
  };

  // This is a placeholder for sprite logic
  // In a real implementation, you would use name, action, and frame
  // to select the correct sprite image.
  const spritePath = `/assets/${name.toLowerCase()}/${action}_${frame}.png`;

  return (
    <div style={style}>
      <p>{name}</p>
      <p>Action: {action}</p>
      <p>Frame: {frame}</p>
      {/* <img src={spritePath} alt={`${name} ${action}`} /> */}
      <p>(Sprite: {spritePath})</p>
    </div>
  );
};

export default Character;
