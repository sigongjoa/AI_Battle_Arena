import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BattleRhythmVisualizer from './BattleRhythmVisualizer';

describe('BattleRhythmVisualizer', () => {
  const mockPlayer1Log = [
    { action: 'light_punch', frame: 10, duration: 30 },
    { action: 'guard', frame: 50, duration: 15 },
  ];
  const mockPlayer2Log = [
    { action: 'heavy_kick', frame: 20, duration: 20 },
    { action: 'move_forward', frame: 60, duration: 10 },
  ];
  const mockTotalFrames = 100;

  it('renders without crashing', () => {
    render(
      <BattleRhythmVisualizer
        player1Log={[]}
        player2Log={[]}
        totalFrames={mockTotalFrames}
      />
    );
    expect(screen.getByText('Battle Rhythm Visualizer')).toBeInTheDocument();
  });

  it('renders player 1 and player 2 tracks', () => {
    render(
      <BattleRhythmVisualizer
        player1Log={mockPlayer1Log}
        player2Log={mockPlayer2Log}
        totalFrames={mockTotalFrames}
      />
    );
    expect(screen.getByRole('heading', { name: /Player 1/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Player 2/i })).toBeInTheDocument();
  });

  it('renders correct number of action bars for player 1', () => {
    render(
      <BattleRhythmVisualizer
        player1Log={mockPlayer1Log}
        player2Log={[]}
        totalFrames={mockTotalFrames}
      />
    );
    const player1ActionBars = screen.getAllByTitle('Action: light_punch, Frame: 10, Duration: 30');
    expect(player1ActionBars).toHaveLength(1);
    const player1ActionBars2 = screen.getAllByTitle('Action: guard, Frame: 50, Duration: 15');
    expect(player1ActionBars2).toHaveLength(1);
  });

  it('renders correct number of action bars for player 2', () => {
    render(
      <BattleRhythmVisualizer
        player1Log={[]}
        player2Log={mockPlayer2Log}
        totalFrames={mockTotalFrames}
      />
    );
    const player2ActionBars = screen.getAllByTitle('Action: heavy_kick, Frame: 20, Duration: 20');
    expect(player2ActionBars).toHaveLength(1);
    const player2ActionBars2 = screen.getAllByTitle('Action: move_forward, Frame: 60, Duration: 10');
    expect(player2ActionBars2).toHaveLength(1);
  });

  it('displays "No match data to display." when totalFrames is 0', () => {
    render(
      <BattleRhythmVisualizer
        player1Log={[]}
        player2Log={[]}
        totalFrames={0}
      />
    );
    expect(screen.getByText('No match data to display.')).toBeInTheDocument();
  });
});