import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import RLDemoPage from './RLDemoPage';
import { vi } from 'vitest';

// Mock the fetch API
const mockGameData = [
  {
    frame: 0,
    player1: { x: 0, y: 0, hp: 100, action: "idle"},
    player2: { x: 10, y: 0, hp: 100, action: "idle"}
  },
  {
    frame: 1,
    player1: { x: 1, y: 0, hp: 100, action: "move_right"},
    player2: { x: 9, y: 0, hp: 100, action: "idle"}
  },
];

vi.spyOn(window, 'fetch').mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockGameData),
  } as Response)
);

describe('RLDemoPage', () => {
  it('renders model selection and start button', () => {
    render(<RLDemoPage />);
    expect(screen.getByLabelText(/Select AI Model:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();
  });

  it('starts game simulation on button click', async () => {
    render(<RLDemoPage />);
    fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

    await waitFor(() => {
      expect(screen.getByText(/Game Running.../i)).toBeInTheDocument();
      expect(screen.getByText(/Frame: 0/i)).toBeInTheDocument();
    });

    // Check if fetch was called
    expect(window.fetch).toHaveBeenCalledWith('/mock_game_data.json');
  });

  // it('advances frames during playback', async () => {
  //   vi.useFakeTimers();
  //   render(<RLDemoPage />);
  //   fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

  //   await waitFor(() => {
  //     expect(screen.getByText(/Frame: 0/i)).toBeInTheDocument();
  //   });

  //   act(() => {
  //     vi.advanceTimersByTime(500);
  //   });

  //   await waitFor(() => {
  //     expect(screen.getByText(/Frame: 1/i)).toBeInTheDocument();
  //   });

  //   vi.useRealTimers();
  // });

  // it('stops playback on stop button click', async () => {
  //   vi.useFakeTimers();
  //   render(<RLDemoPage />);
  //   fireEvent.click(screen.getByRole('button', { name: /Start Game/i }));

  //   await waitFor(() => {
  //     expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
  //   });

  //   fireEvent.click(screen.getByRole('button', { name: /Pause/i }));

  //   await waitFor(() => {
  //     expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();
  //   });

  //   vi.useRealTimers();
  // });
});