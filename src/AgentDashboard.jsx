import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import styled, { useTheme } from 'styled-components';
import { formatTickTime, formatTooltipTime, formatNumber } from './i18n.js';
import { useTranslation } from 'react-i18next';

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

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  padding: 1.2rem;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border-left: 4px solid ${({ borderColor, theme }) => borderColor || theme.accentColor};
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
`;

const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.tabInactiveText};
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const SummaryValue = styled.span`
  color: ${({ theme }) => theme.textColor};
  font-size: 1.5rem;
  font-weight: bold;
`;

export default function AgentDashboard({ agentName, liveData, timeRange, setTimeRange, API_BASE_URL, setError, onDataUpdate }) {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme(); // Get theme from ThemeProvider context
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || 'ja';

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
        if (!res.ok) throw new Error("FETCH_ERROR");
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

  // 秒数を「〇日 〇時間 〇分」に変換する関数
  const formatUptime = (seconds) => {
    if (!seconds) return t('unknown');
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return t('uptimeFormat', { d, h, m });
  };

  // 最新のUptimeを取得（chartDataToDisplay の最後の要素）
  const currentUptime = chartDataToDisplay.length > 0 
    ? chartDataToDisplay[chartDataToDisplay.length - 1].uptime 
    : null;

  // 🌟 ネットワークトラフィックの単位を動的に変換する関数
  const formatTraffic = (value, isTick = false) => {
    const num = Number(value);
    const fractionDigits = isTick ? 0 : 2; // Y軸は小数なし、ツールチップは小数第2位まで
    const options = { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits };
    
    if (num >= 1024 * 1024 * 1024) { // 1GB以上
      return `${formatNumber(currentLang, num / (1024 * 1024 * 1024), options)} GB${isTick ? '' : '/s'}`;
    } else if (num >= 1024 * 1024) { // 1MB以上
      return `${formatNumber(currentLang, num / (1024 * 1024), options)} MB${isTick ? '' : '/s'}`;
    } else { // 1MB未満はKB
      return `${formatNumber(currentLang, num / 1024, options)} KB${isTick ? '' : '/s'}`;
    }
  };

  // 🌟 最新のデータを取得（サマリーパネル表示用）
  const latestData = chartDataToDisplay.length > 0 ? chartDataToDisplay[chartDataToDisplay.length - 1] : {};
  const latestCpu = latestData.cpu ?? 0;
  const latestMem = latestData.memory ?? 0;
  const latestDisk = latestData.disk ?? 0;
  const latestRx = latestData.network_rx ?? 0;
  const latestTx = latestData.network_tx ?? 0;

  return (
    <>
      {/* 🌟 タイトル横に連続稼働時間を追加 */}
      <AnalyticsHeader as="div" mb>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AnalyticsTitle>{agentName} {t('analytics')}</AnalyticsTitle>
          {currentUptime && (
            <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', background: theme.buttonBg, borderRadius: '4px' }}>
              ⏱️ {t('uptimeLabel')}: {formatUptime(currentUptime)}
            </span>
          )}
        </div>
        <RangeButtonGroup>
          <RangeButton active={timeRange === 'live'} onClick={() => setTimeRange('live')}>Live</RangeButton>
          <RangeButton active={timeRange === '1h'} onClick={() => setTimeRange('1h')}>1{t('hour')} (Raw)</RangeButton>
          <RangeButton active={timeRange === '24h'} onClick={() => setTimeRange('24h')}>24{t('hour')} (Rollup)</RangeButton>
          <RangeButton active={timeRange === '7d'} onClick={() => setTimeRange('7d')}>7{t('days')} (Rollup)</RangeButton>
        </RangeButtonGroup>
      </AnalyticsHeader>

      {/* 🌟 サマリーパネル */}
      <SummaryGrid>
        <SummaryCard borderColor="#63b3ed">
          <SummaryLabel>{t('cpuUsage')}</SummaryLabel>
          <SummaryValue>{formatNumber(currentLang, latestCpu, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</SummaryValue>
        </SummaryCard>
        <SummaryCard borderColor="#f6ad55">
          <SummaryLabel>{t('memoryUsage')}</SummaryLabel>
          <SummaryValue>{formatNumber(currentLang, latestMem, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</SummaryValue>
        </SummaryCard>
        <SummaryCard borderColor="#b794f4">
          <SummaryLabel>{t('diskUsage')}</SummaryLabel>
          <SummaryValue>{formatNumber(currentLang, latestDisk, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</SummaryValue>
        </SummaryCard>
        <SummaryCard borderColor="#48bb78">
          <SummaryLabel>{t('downloadRx')}</SummaryLabel>
          <SummaryValue>{formatTraffic(latestRx)}</SummaryValue>
        </SummaryCard>
        <SummaryCard borderColor="#ed64a6">
          <SummaryLabel>{t('uploadTx')}</SummaryLabel>
          <SummaryValue>{formatTraffic(latestTx)}</SummaryValue>
        </SummaryCard>
      </SummaryGrid>

      <Card mb>
        <CardTitle>{t('resourceChart')}</CardTitle>
        {isLoading ? (
          <LoadingPlaceholder>
            {t('loadingData')}
          </LoadingPlaceholder>
        ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartDataToDisplay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                <XAxis dataKey="time" stroke={theme.axisStroke} tickFormatter={(val) => formatTickTime(currentLang, val)} />
                <YAxis stroke={theme.axisStroke} domain={[0, 100]} />
                <Tooltip labelFormatter={(val) => formatTooltipTime(currentLang, val)} formatter={(value) => `${formatNumber(currentLang, value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`} contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.textColor }} />
                <Legend />
                <Brush dataKey="time" height={30} stroke={theme.accentColor} tickFormatter={(val) => formatTickTime(currentLang, val)} />
                <Line type="monotone" dataKey="cpu" name={t('cpuUsage')} stroke="#63b3ed" strokeWidth={3} dot={timeRange === 'live' ? {r:4} : false} isAnimationActive={false} />
                <Line type="monotone" dataKey="memory" name={t('memoryUsage')} stroke="#f6ad55" strokeWidth={3} dot={timeRange === 'live' ? {r:4} : false} isAnimationActive={false} />
                {/* CPUとMemoryのLineの下に追加！ */}
                <Line type="monotone" dataKey="disk" name={t('diskUsage')} stroke="#b794f4" strokeWidth={3} dot={timeRange === 'live' ? {r:4} : false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
        )}
      </Card>

      {/* 🌟 これがネットワーク用の新しいグラフ！既存のCardの下に追加してね */}
      <Card mb>
        <CardTitle>{t('networkTraffic')}</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartDataToDisplay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
              <XAxis dataKey="time" stroke={theme.axisStroke} tickFormatter={(val) => formatTickTime(currentLang, val)} />
              <YAxis stroke={theme.axisStroke} tickFormatter={(val) => formatTraffic(val, true)} />
              <Tooltip labelFormatter={(val) => formatTooltipTime(currentLang, val)} formatter={(value) => formatTraffic(value, false)} contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.textColor }} />
              <Legend />
              <Brush dataKey="time" height={30} stroke={theme.accentColor} tickFormatter={(val) => formatTickTime(currentLang, val)} />
              {/* Rx(受信)を緑、Tx(送信)をピンクで描画 */}
              <Line type="monotone" dataKey="network_rx" name={t('downloadRx')} stroke="#48bb78" strokeWidth={2} dot={timeRange === 'live' ? {r:3} : false} isAnimationActive={false} />
              <Line type="monotone" dataKey="network_tx" name={t('uploadTx')} stroke="#ed64a6" strokeWidth={2} dot={timeRange === 'live' ? {r:3} : false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
      </Card>
    </>
  );
}