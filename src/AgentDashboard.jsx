import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styled, { useTheme } from 'styled-components';

// Styled Components for this dashboard
const Card = styled.section`
  background: ${({ theme }) => theme.cardBackground};
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  margin-bottom: ${({ mb }) => mb ? '1.5rem' : '0'};
`;

const AnalyticsHeader = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
`;

const CardTitle = styled.h2`
  color: ${({ theme }) => theme.textColor};
  margin-top: 0;
  margin-bottom: 1.5rem;
`;

const AnalyticsTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.textColor};
`;

const RangeButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RangeButton = styled.button`
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  border: none;
  background-color: ${({ active, theme }) => active ? theme.buttonActiveBg : theme.buttonBg};
  color: ${({ active, theme }) => active ? theme.buttonActiveText : theme.buttonText};
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s;
`;

const LoadingPlaceholder = styled.div`
  height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.accentColor};
  font-size: 1.5rem;
`;

export default function AgentDashboard({ agentName, liveData, timeRange, setTimeRange, API_BASE_URL, setError, onDataUpdate }) {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme(); // Get theme from ThemeProvider context

  useEffect(() => {
    // Don't fetch if we are in live mode.
    if (timeRange === 'live') {
      setHistoryData([]); // Clear old data
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/metrics/history?agent=${agentName}&range=${timeRange}`);
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data = await res.json();
        setHistoryData(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [agentName, timeRange, API_BASE_URL, setError]);

  const chartDataToDisplay = useMemo(() => timeRange === 'live'
    ? (liveData ? [...liveData].reverse() : [])
    : historyData, [timeRange, liveData, historyData]);

  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate(chartDataToDisplay);
    }
  }, [chartDataToDisplay, onDataUpdate]);

  return (
    <>
      <AnalyticsHeader as="div" mb>
        <AnalyticsTitle>{agentName} Analytics</AnalyticsTitle>
        <RangeButtonGroup>
          <RangeButton active={timeRange === 'live'} onClick={() => setTimeRange('live')}>Live</RangeButton>
          <RangeButton active={timeRange === '1h'} onClick={() => setTimeRange('1h')}>1時間 (Raw)</RangeButton>
          <RangeButton active={timeRange === '24h'} onClick={() => setTimeRange('24h')}>24時間 (Rollup)</RangeButton>
          <RangeButton active={timeRange === '7d'} onClick={() => setTimeRange('7d')}>7日間 (Rollup)</RangeButton>
        </RangeButtonGroup>
      </AnalyticsHeader>

      <Card mb>
        <CardTitle>Resource Chart</CardTitle>
        {isLoading ? (
          <LoadingPlaceholder>
            Loading Data... ⏳
          </LoadingPlaceholder>
        ) : (
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={chartDataToDisplay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                <XAxis dataKey="time" stroke={theme.axisStroke} />
                <YAxis stroke={theme.axisStroke} domain={[0, 100]} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.textColor }} />
                <Legend />
                <Line type="monotone" dataKey="cpu" name="CPU Usage" stroke="#63b3ed" strokeWidth={3} dot={timeRange === 'live' ? {r:4} : false} isAnimationActive={false} />
                <Line type="monotone" dataKey="memory" name="Memory Usage" stroke="#f6ad55" strokeWidth={3} dot={timeRange === 'live' ? {r:4} : false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </>
  );
}