import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styled, { ThemeProvider } from 'styled-components';
import AgentDashboard from './AgentDashboard.jsx';

// ==========================================
// 💅 Styled Components
// ==========================================
const AppWrapper = styled.div`
  padding: 1.5rem;
  font-family: sans-serif;
  max-width: 100%;
  margin: 0 auto;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.textColor};
  min-height: 100vh;
  transition: background 0.2s, color 0.2s;
`;

const HeaderWrapper = styled.header`
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  margin-bottom: 1.5rem;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.tabActiveText};
  margin: 0;
`;

const ThemeToggleButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.textColor};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s, color 0.2s;
`;

const DownloadButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.accentColor};
  color: ${({ theme }) => theme.background}; /* 文字色を背景の反転にして目立たせる */
  border: none;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.8;
  }
`;

// ボタンを横に並べるためのラッパーも追加しておくと綺麗よ！
const HeaderActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
`;

const TabGroup = styled.nav`
  display: flex;
  gap: 0.5rem;
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  background-color: ${({ active, theme }) => active ? theme.tabActiveBg : 'transparent'};
  color: ${({ active, theme }) => active ? theme.tabActiveText : theme.tabInactiveText};
  border: none;
  border-bottom: 3px solid ${({ active, theme }) => active ? theme.accentColor : 'transparent'};
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.errorText};
  font-weight: bold;
  padding: 1rem;
  background: ${({ theme }) => theme.errorBg};
  border-radius: 4px;
`;

const Card = styled.section`
  background: ${({ theme }) => theme.cardBackground};
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  margin-bottom: ${({ mb }) => mb ? '1.5rem' : '0'};
`;

const CardTitle = styled.h2`
  color: ${({ theme }) => theme.textColor};
  margin-top: 0;
  margin-bottom: 1.5rem;
`;

const InfoText = styled.p`
  color: ${({ theme }) => theme.tabInactiveText};
  text-align: center;
  padding: 2rem;
`;

export default function App() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const [overviewData, setOverviewData] = useState([]);
  const [agentData, setAgentData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  // 🌟 localStorageからテーマを読み込むか、デフォルトで'dark'を設定
  // 🌟 さらに、localStorageに設定がなければOSの設定(prefers-color-scheme)を尊重する
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // 🎨 テーマ定義
  const themes = {
    light: {
      background: '#f7fafc',
      textColor: '#1a202c',
      cardBackground: '#ffffff',
      borderColor: '#e2e8f0',
      accentColor: '#3182ce',
      tabActiveBg: '#e2e8f0',
      tabInactiveText: '#718096',
      tabActiveText: '#1a202c',
      buttonBg: '#e2e8f0',
      buttonText: '#2d3748',
      buttonActiveBg: '#3182ce',
      buttonActiveText: '#ffffff',
      errorBg: '#FED7D7',
      errorText: '#9B2C2C',
      gridStroke: '#e2e8f0',
      axisStroke: '#718096',
      tooltipBg: '#ffffff',
      tooltipBorder: '#e2e8f0',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    dark: {
      background: '#1a202c',
      textColor: '#e2e8f0',
      cardBackground: '#2d3748',
      borderColor: '#2d3748',
      accentColor: '#63b3ed',
      tabActiveBg: '#4a5568',
      tabInactiveText: '#a0aec0',
      tabActiveText: '#f7fafc',
      buttonBg: '#2d3748',
      buttonText: '#a0aec0',
      buttonActiveBg: '#63b3ed',
      buttonActiveText: '#1a202c',
      errorBg: '#4A1C1C',
      errorText: '#fc8181',
      gridStroke: '#4a5568',
      axisStroke: '#a0aec0',
      tooltipBg: '#1a202c',
      tooltipBorder: '#4a5568',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    }
  };
  const currentTheme = themes[theme];

  // 🌟 追加：期間選択と履歴データ用のState
  const [timeRange, setTimeRange] = useState('live'); // 'live', '1h', '24h', '7d'

  // 🌟 ダウンロード用にエージェントのデータを保持するState
  const [agentChartData, setAgentChartData] = useState([]);
  const currentChartData = activeTab === 'overview' ? overviewData : agentChartData;

  // ==========================================
  // 🌟 テーマをlocalStorageに保存するエフェクト
  // ==========================================
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ==========================================
  // 🎨 テーマ切り替え
  // ==========================================
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // ==========================================
  // ① リアルタイム通信 (SSE) エフェクト
  // ==========================================
  useEffect(() => {
    // 🌟 プロのUX：過去のデータを見ている時は、裏でSSEを止めてブラウザの負荷を下げる！
    if (timeRange !== 'live') return;

    const eventSource = new EventSource(`${API_BASE_URL}/api/metrics/stream`);

    eventSource.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const agentName = raw.agent_name || 'Unknown-PC';
        const timeString = new Date().toLocaleTimeString();

        const cpuVal = raw.cpu !== undefined ? raw.cpu : raw.cpu_usage;
        const memVal = raw.memory !== undefined ? raw.memory : raw.memory_usage;
        if (cpuVal === undefined) return; 

        setOverviewData((prev) => [...prev, { time: timeString, [agentName]: cpuVal }].slice(-30));

        setAgentData((prev) => {
          const currentHistory = prev[agentName] || [];
          const updatedHistory = [{ time: timeString, cpu: cpuVal, memory: memVal }, ...currentHistory];
          return { ...prev, [agentName]: updatedHistory.slice(0, 20) };
        });
        setError(null);
      } catch (err) {
        console.error("Parse Error:", err);
      }
    };

    eventSource.onerror = () => setError("サーバーとの接続が切れました。再接続中...");
    return () => eventSource.close();
  }, [timeRange]); // timeRange が変わるたびに再評価

  // UI用スタイル
  const colors = ['#63b3ed', '#f6ad55', '#68d391', '#fc8181', '#b794f4'];
  const agents = Object.keys(agentData);

  // ==========================================
  // 🌟 CSVダウンロード機能
  // ==========================================
  const handleDownloadCSV = () => {
    if (!currentChartData || currentChartData.length === 0) {
      alert("ダウンロードするデータがありません。");
      return;
    }
    
    // オブジェクトのキーをCSVのヘッダーとして取得
    const headers = Object.keys(currentChartData[0]);
    const csvRows = [
      headers.join(','), // 1行目（ヘッダー）
      ...currentChartData.map(row => headers.map(fieldName => {
        let value = row[fieldName] ?? '';
        
        // 🌟 時刻(time)列をExcelで読みやすい「YYYY/MM/DD HH:mm:ss」形式に変換
        if (fieldName === 'time' && value) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            value = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
          } else if (typeof value === 'string' && /^\d{1,2}:\d{1,2}/.test(value)) {
            // ライブデータ（"HH:mm:ss"）の場合は本日の日付を補完
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            value = `${year}/${month}/${day} ${value}`;
          }
        }
        
        return JSON.stringify(value);
      }).join(','))
    ];
    
    // 🌟 Excel文字化け対策（BOM付きUTF-8にする）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_${timeRange}_report.csv`;
    link.click();
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <AppWrapper>
        <HeaderWrapper>
          <HeaderContent>
            <Title>🚀 Hyb-Core Dashboard</Title>
            <HeaderActions>
              <ThemeToggleButton onClick={toggleTheme}>
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </ThemeToggleButton>
              <DownloadButton onClick={handleDownloadCSV}>
                📊 レポートをダウンロード
              </DownloadButton>
            </HeaderActions>
        </HeaderContent>
        <TabGroup>
            <TabButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setTimeRange('live'); }}>🌐 全体 (Overview)</TabButton>
            {agents.map(agent => (
              <TabButton key={agent} active={activeTab === agent} onClick={() => setActiveTab(agent)}>💻 {agent}</TabButton>
            ))}
          </TabGroup>
        </HeaderWrapper>

        {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}

        {/* ==================== 概要タブ ==================== */}
        {activeTab === 'overview' && (
          <Card>
            <CardTitle>Network CPU Usage (Live)</CardTitle>
            {agents.length === 0 ? <InfoText>エージェント待機中...</InfoText> : (
              <div style={{ width: '100%', height: 450 }}>
                <ResponsiveContainer>
                  <LineChart data={overviewData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.gridStroke} />
                    <XAxis dataKey="time" stroke={currentTheme.axisStroke} />
                    <YAxis stroke={currentTheme.axisStroke} domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} contentStyle={{ backgroundColor: currentTheme.tooltipBg, border: `1px solid ${currentTheme.tooltipBorder}`, color: currentTheme.textColor }} />
                    <Legend />
                    {agents.map((agent, i) => (
                      <Line key={agent} type="monotone" dataKey={agent} stroke={colors[i % colors.length]} strokeWidth={3} dot={false} connectNulls={true} isAnimationActive={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        )}

        {/* ==================== 個別タブ ==================== */}
        {activeTab !== 'overview' && (
          <AgentDashboard
            agentName={activeTab}
            liveData={agentData[activeTab]}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            API_BASE_URL={API_BASE_URL}
            setError={setError}
            onDataUpdate={setAgentChartData}
          />
        )}
      </AppWrapper>
    </ThemeProvider>
  );
}