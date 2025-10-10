import React, { useState, useEffect } from 'react';

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // Placeholder data
      setRewardData({
        labels: Array.from({ length: 10 }, (_, i) => `Episode ${i * 100}`),
        values: Array.from({ length: 10 }, (_, i) => Math.random() * 100 - 50 + i * 5),
      });
      setWinRateData({
        labels: Array.from({ length: 10 }, (_, i) => `Episode ${i * 100}`),
        values: Array.from({ length: 10 }, (_, i) => Math.random() * 0.3 + 0.5 + i * 0.02),
      });
      setEpisodeLengthData({
        labels: Array.from({ length: 10 }, (_, i) => `Episode ${i * 100}`),
        values: Array.from({ length: 10 }, (_, i) => Math.random() * 50 + 100 - i * 2),
      });

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

  const renderChartPlaceholder = (title: string, data: MetricData | null) => (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fff' }}>
      <h3>{title}</h3>
      {data ? (
        <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' }}>
          <p>Chart Placeholder for {title}</p>
          {/* In a real implementation, a charting library (e.g., Chart.js, Recharts) would render the data here */}
          {/* Example: <LineChart data={data} /> */}
        </div>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );

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

      {renderChartPlaceholder('Reward Over Episodes', rewardData)}
      {renderChartPlaceholder('Win Rate Over Episodes', winRateData)}
      {renderChartPlaceholder('Episode Length Over Episodes', episodeLengthData)}
    </div>
  );
};

export default RLDashboardPage;
