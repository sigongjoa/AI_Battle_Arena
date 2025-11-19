import { render, screen, waitFor, act } from '@testing-library/react';
import RLDashboardPage from './RLDashboardPage';
import { vi } from 'vitest';

// Mock the fetch API
const mockDashboardData = {
  rewardData: {
    labels: ['E1', 'E2'],
    values: [0.1, 0.2],
  },
  winRateData: {
    labels: ['E1', 'E2'],
    values: [0.5, 0.6],
  },
  episodeLengthData: {
    labels: ['E1', 'E2'],
    values: [10, 20],
  },
};

vi.spyOn(window, 'fetch').mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockDashboardData),
  } as Response)
);

describe('RLDashboardPage', () => {
  it('renders loading state initially', () => {
    act(() => {
      render(<RLDashboardPage />);
    });
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('fetches and displays dashboard data', async () => {
    act(() => {
      render(<RLDashboardPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Reward Over Episodes')).toBeInTheDocument();
      expect(screen.getByText('Win Rate Over Episodes')).toBeInTheDocument();
      expect(screen.getByText('Episode Length Over Episodes')).toBeInTheDocument();
    });

    // Check if fetch was called
    expect(window.fetch).toHaveBeenCalledWith('/mock_dashboard_data.json');
  });

  it('displays error message on fetch failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(window, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response)
    );

    act(() => {
      render(<RLDashboardPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch dashboard data./i)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});