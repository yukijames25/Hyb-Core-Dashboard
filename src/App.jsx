import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import styled, { ThemeProvider } from 'styled-components';
import AgentDashboard from './AgentDashboard.jsx';
import JSZip from 'jszip';
import { formatTickTime, formatTooltipTime, formatNumber } from './i18n.js';
import { useTranslation } from 'react-i18next';

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

const LanguageSelect = styled.select`
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.textColor};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s, color 0.2s;
`;

const AgentDownloadButton = styled.a`
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.textColor};
  border: 1px solid ${({ theme }) => theme.borderColor};
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  &:hover { background-color: ${({ theme }) => theme.buttonBg}; }
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

// 🌟 モーダル用UIコンポーネント
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  padding: 2rem; border-radius: 8px; width: 400px; max-width: 90vw;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
`;

const RadioLabel = styled.label`
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: 0.8rem; cursor: pointer;
  color: ${({ theme }) => theme.textColor};
  font-size: 1rem;
`;

const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;
`;

const ModalButton = styled.button`
  padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold; border: none;
  background: ${({ primary, theme }) => primary ? theme.accentColor : theme.buttonBg};
  color: ${({ primary, theme }) => primary ? theme.background : theme.buttonText};
  transition: opacity 0.2s;
  &:hover { opacity: 0.8; }
`;

export default function App() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || 'ja'; // 現在の言語を取得

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
  // 🎨 テーマ切り替え関数
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
        const timeString = new Date().toISOString(); // 日時としてパースできるようにISO文字列に変更

        const cpuVal = raw.cpu !== undefined ? raw.cpu : raw.cpu_usage;
        const memVal = raw.memory !== undefined ? raw.memory : raw.memory_usage;
        const diskVal = raw.disk !== undefined ? raw.disk : raw.disk_usage;
        if (cpuVal === undefined) return; 

        setOverviewData((prev) => [...prev, { time: timeString, [agentName]: cpuVal }].slice(-30));

        setAgentData((prev) => {
          const currentHistory = prev[agentName] || [];
          const updatedHistory = [{ time: timeString, cpu: cpuVal, memory: memVal, disk: diskVal }, ...currentHistory];
          return { ...prev, [agentName]: updatedHistory.slice(0, 20) };
        });
        setError(null);
      } catch (err) {
        console.error("Parse Error:", err);
      }
    };

    eventSource.onerror = () => setError('SSE_ERROR');
    return () => eventSource.close();
  }, [timeRange]); // timeRange が変わるたびに再評価

  // UI用スタイル
  const colors = ['#63b3ed', '#f6ad55', '#68d391', '#fc8181', '#b794f4'];
  const agents = Object.keys(agentData);

  // ==========================================
  // 🌟 CSVダウンロード機能
  // ==========================================
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadRange, setDownloadRange] = useState('live');
  const [isDownloading, setIsDownloading] = useState(false); // 🌟 ダウンロード中ステート

  const generateCSVBlob = (data) => {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // 1行目（ヘッダー）
      ...data.map(row => headers.map(fieldName => {
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
    return new Blob([bom, csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  };

  const executeDownload = async () => {
    setIsDownloading(true);
    const ranges = downloadRange === 'all' ? ['live', '1h', '24h', '7d'] : [downloadRange];
    let downloadedCount = 0;
    const zip = new JSZip(); // 🌟 ZIPインスタンスを作成
    const tabNameLocal = activeTab === 'overview' ? t('overviewTab') : activeTab;

    for (const range of ranges) {
      let dataToDownload = [];

      if (range === 'live') {
        dataToDownload = currentChartData;
      } else {
        if (activeTab === 'overview') {
          if (downloadRange !== 'all') alert(t('alertOverviewLiveOnly'));
          continue; // 全体タブの過去データ取得はスキップ
        }
        try {
          // バックエンドから該当期間の履歴データを取得
          const res = await fetch(`${API_BASE_URL}/api/metrics/history?agent=${activeTab}&range=${range}`);
          if (res.ok) dataToDownload = await res.json();
        } catch (err) {
          console.error(`Failed to fetch ${range} data:`, err);
        }
      }

      if (dataToDownload && dataToDownload.length > 0) {
        const blob = generateCSVBlob(dataToDownload);
        const filename = t('reportFilename', { tab: tabNameLocal, range });

        if (ranges.length > 1) {
          zip.file(filename, blob); // 🌟 複数の場合はZIPに追加
        } else {
          // 単一ファイルの場合はそのままダウンロード
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
        }
        downloadedCount++;
      } else if (downloadRange !== 'all') {
        alert(t('alertNoDataFor', { range }));
      }
    }

    if (ranges.length > 1 && downloadedCount > 0) {
      const zipBlob = await zip.generateAsync({ type: 'blob' }); // 🌟 ZIPを生成
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      link.download = t('allReportsZip', { tab: tabNameLocal, date: `${yyyy}${mm}${dd}` });
      link.click();
    } else if (downloadRange === 'all' && downloadedCount === 0) {
      alert(t('alertNoDownloadable'));
    }
    
    setIsDownloading(false);
    setIsDownloadModalOpen(false);
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <AppWrapper>
        <HeaderWrapper>
          <HeaderContent>
            <Title>🚀 Hyb-Core Dashboard</Title>
            <HeaderActions>
              <AgentDownloadButton href="/HybCore-Agent-Installer.zip" download>
                📦 {t('agentDownload')}
              </AgentDownloadButton>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <LanguageSelect value={currentLang} onChange={(e) => i18n.changeLanguage(e.target.value)}>
                  <option value="ja">🌐 日本語</option>
                  <option value="en">🌐 English</option>
                  <option value="zh">🌐 中文</option>
                  <option value="ko">🌐 한국어</option>
                </LanguageSelect>
                <ThemeToggleButton onClick={toggleTheme}>
                  {theme === 'light' ? t('darkMode') : t('lightMode')}
                </ThemeToggleButton>
              </div>
              <DownloadButton onClick={() => setIsDownloadModalOpen(true)}>
                📊 {t('downloadReport')}
              </DownloadButton>
            </HeaderActions>
        </HeaderContent>
        <TabGroup>
            <TabButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setTimeRange('live'); }}>🌐 {t('overviewTab')}</TabButton>
            {agents.map(agent => (
              <TabButton key={agent} active={activeTab === agent} onClick={() => setActiveTab(agent)}>💻 {agent}</TabButton>
            ))}
          </TabGroup>
        </HeaderWrapper>

        {error && <ErrorMessage>⚠️ {
          error === 'SSE_ERROR' ? t('connectionLost') :
          error === 'FETCH_ERROR' ? t('fetchError') :
          error
        }</ErrorMessage>}

        {/* ==================== 概要タブ ==================== */}
        {activeTab === 'overview' && (
          <Card>
            <CardTitle>{t('networkCpuLive')}</CardTitle>
            {agents.length === 0 ? <InfoText>{t('waitingAgents')}</InfoText> : (
              <div style={{ width: '100%', height: 450 }}>
                <ResponsiveContainer>
                  <LineChart data={overviewData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.gridStroke} />
                    <XAxis dataKey="time" stroke={currentTheme.axisStroke} tickFormatter={(val) => formatTickTime(currentLang, val)} />
                    <YAxis stroke={currentTheme.axisStroke} domain={[0, 100]} />
                    <Tooltip labelFormatter={(val) => formatTooltipTime(currentLang, val)} formatter={(value) => `${formatNumber(currentLang, value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`} contentStyle={{ backgroundColor: currentTheme.tooltipBg, border: `1px solid ${currentTheme.tooltipBorder}`, color: currentTheme.textColor }} />
                    <Legend 
                      onClick={(e) => {
                        if (e && e.dataKey) {
                          setActiveTab(String(e.dataKey));
                          setTimeRange('live');
                        }
                      }}
                      wrapperStyle={{ cursor: 'pointer' }}
                    />
                    <Brush dataKey="time" height={30} stroke={currentTheme.accentColor} tickFormatter={(val) => formatTickTime(currentLang, val)} />
                    {agents.map((agent, i) => (
                      <Line 
                        key={agent} 
                        type="monotone" 
                        dataKey={agent} 
                        stroke={colors[i % colors.length]} 
                        strokeWidth={3} 
                        dot={false} 
                        connectNulls={true} 
                        isAnimationActive={false} 
                        activeDot={{ onClick: () => { setActiveTab(agent); setTimeRange('live'); }, cursor: 'pointer' }}
                      />
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

        {/* 🌟 ダウンロード用モーダル */}
        {isDownloadModalOpen && (
          <ModalOverlay onClick={() => !isDownloading && setIsDownloadModalOpen(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              {isDownloading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <h3 style={{ color: currentTheme.accentColor }}>⏳ {t('downloading')}</h3>
                  <p style={{ color: currentTheme.textColor }}>{t('fetchingData')}</p>
                </div>
              ) : (
                <>
                  <h2 style={{ marginTop: 0, color: currentTheme.textColor }}>{t('selectReport')}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', margin: '1.5rem 0' }}>
                    <RadioLabel>
                      <input type="radio" name="downloadRange" value="live" checked={downloadRange === 'live'} onChange={(e) => setDownloadRange(e.target.value)} />
                      Live ({t('currentData')})
                    </RadioLabel>
                    <RadioLabel>
                      <input type="radio" name="downloadRange" value="1h" checked={downloadRange === '1h'} onChange={(e) => setDownloadRange(e.target.value)} />
                      1{t('hour')} (Raw)
                    </RadioLabel>
                    <RadioLabel>
                      <input type="radio" name="downloadRange" value="24h" checked={downloadRange === '24h'} onChange={(e) => setDownloadRange(e.target.value)} />
                      24{t('hour')} (Rollup)
                    </RadioLabel>
                    <RadioLabel>
                      <input type="radio" name="downloadRange" value="7d" checked={downloadRange === '7d'} onChange={(e) => setDownloadRange(e.target.value)} />
                      7{t('days')} (Rollup)
                    </RadioLabel>
                    <RadioLabel>
                      <input type="radio" name="downloadRange" value="all" checked={downloadRange === 'all'} onChange={(e) => setDownloadRange(e.target.value)} />
                      {t('allAboveZip')}
                    </RadioLabel>
                  </div>
                  <ModalActions>
                    <ModalButton onClick={() => setIsDownloadModalOpen(false)}>{t('cancel')}</ModalButton>
                    <ModalButton primary onClick={executeDownload}>{t('downloadExec')}</ModalButton>
                  </ModalActions>
                </>
              )}
            </ModalContent>
          </ModalOverlay>
        )}
      </AppWrapper>
    </ThemeProvider>
  );
}