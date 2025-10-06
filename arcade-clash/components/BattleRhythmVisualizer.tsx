import React from 'react';
import './BattleRhythmVisualizer.css'; // Assuming a CSS file for styling

// 데이터 항목 인터페이스
interface ActionLogItem {
  action: string; // 행동의 종류
  frame: number;  // 시작 프레임
  duration?: number; // 지속 시간 (프레임 단위, 옵션)
}

// 컴포넌트 Props 인터페이스
interface BattleRhythmVisualizerProps {
  player1Log: ActionLogItem[];
  player2Log: ActionLogItem[];
  totalFrames: number;
}

const BattleRhythmVisualizer: React.FC<BattleRhythmVisualizerProps> = ({ player1Log, player2Log, totalFrames }) => {
  if (totalFrames === 0) {
    return (
      <div className="battle-rhythm-visualizer no-data">
        <p>No match data to display.</p>
      </div>
    );
  }

  const timelineWidth = 800; // Fixed width for the timeline for now
  const frameToPx = totalFrames > 0 ? timelineWidth / totalFrames : 0;

  const renderActionBar = (item: ActionLogItem, player: 1 | 2) => {
    const left = item.frame * frameToPx;
    const width = (item.duration || 1) * frameToPx; // Default duration to 1 frame if not specified
    const backgroundColor = player === 1 ? 'lightblue' : 'lightcoral'; // Differentiate players
    
    // Basic color coding for action types (can be expanded)
    let actionColor = '';
    if (item.action.includes('punch') || item.action.includes('kick') || item.action === 'ATTACK') {
      actionColor = 'red'; // Offensive
    } else if (item.action.includes('guard') || item.action === 'GUARD') {
      actionColor = 'green'; // Defensive
    } else if (item.action.includes('move') || item.action === 'MOVE' || item.action === 'JUMP') {
      actionColor = 'blue'; // Movement
    } else {
      actionColor = 'gray'; // Other/Idle
    }

    const barStyle: React.CSSProperties = {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: actionColor,
      position: 'absolute',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.7em',
      color: 'white',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      cursor: 'pointer',
    };

    const tooltipText = `Action: ${item.action}, Frame: ${item.frame}${item.duration ? `, Duration: ${item.duration}` : ''}`;

    return (
      <div
        key={`${player}-${item.frame}-${item.action}`}
        className="action-bar"
        style={barStyle}
        title={tooltipText} // Tooltip on hover
      >
        {item.action}
      </div>
    );
  };

  return (
    <div className="battle-rhythm-visualizer" style={{ width: timelineWidth + 20, padding: '10px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Battle Rhythm Visualizer</h3>
      <p>Total Frames: {totalFrames}</p>

      <div className="timeline-container" style={{ width: timelineWidth, position: 'relative', marginBottom: '10px' }}>
        <div className="timeline-track" style={{ height: '30px', borderBottom: '1px dashed #ccc', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0 }}>Frame 0</span>
          <span style={{ position: 'absolute', right: 0 }}>Frame {totalFrames}</span>
        </div>
      </div>

      <div className="player-track-wrapper" style={{ marginBottom: '10px' }}>
        <h4>Player 1</h4>
        <div className="player-track" style={{ position: 'relative', height: '40px', border: '1px solid #eee', background: '#f9f9f9' }}>
          {player1Log.map(item => renderActionBar(item, 1))}
        </div>
      </div>

      <div className="player-track-wrapper">
        <h4>Player 2</h4>
        <div className="player-track" style={{ position: 'relative', height: '40px', border: '1px solid #eee', background: '#f9f9f9' }}>
          {player2Log.map(item => renderActionBar(item, 2))}
        </div>
      </div>
    </div>
  );
};

export default BattleRhythmVisualizer;
