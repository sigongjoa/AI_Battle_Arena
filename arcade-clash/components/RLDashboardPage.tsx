import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface MetricData {
  labels: string[];
  values: number[];
}

const RLDashboardPage: React.FC = () => {
  const [rewardData, setRewardData] = useState<MetricData | null>(null);
  const [winRateData, setWinRateData] = useState<MetricData | null>(null);
  const [episodeLengthData, setEpisodeLengthData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/mock_dashboard_data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      setRewardData(data.rewardData);
      setWinRateData(data.winRateData);
      setEpisodeLengthData(data.episodeLengthData);

    } catch (err) {
      setError('Failed to fetch dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderChart = (title: string, data: MetricData | null) => {
    if (!data) return <p>No data available.</p>;

    const chartData = {
      labels: data.labels,
      datasets: [
        {
          label: title,
          data: data.values,
          fill: false,
          backgroundColor: 'rgb(75, 192, 192)',
          borderColor: 'rgba(75, 192, 192, 0.2)',
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: title,
        },
      },
    };

    return (
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fff' }}>
        <h3>{title}</h3>
        <Line data={chartData} options={options} />
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>RL Training Dashboard</h1>

      <button 
        onClick={fetchDashboardData} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        {loading ? 'Loading...' : 'Refresh Data'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {renderChart('Reward Over Episodes', rewardData)}
      {renderChart('Win Rate Over Episodes', winRateData)}
      {renderChart('Episode Length Over Episodes', episodeLengthData)}
    </div>
  );
};

export default RLDashboardPage;
