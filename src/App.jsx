import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function App() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const [overviewData, setOverviewData] = useState([]); 
  const [agentData, setAgentData] = useState({});       
  const [activeTab, setActiveTab] = useState('overview'); 
  const [error, setError] = useState(null);

  // 🌟 追加：期間選択と履歴データ用のState
  const [timeRange, setTimeRange] = useState('live'); // 'live', '1h', '24h', '7d'
  const [historyData, setHistoryData] = useState([]); // 過去データ保存用
  const [isLoading, setIsLoading] = useState(false);  // ローディング状態

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

  // ==========================================
  // ② 過去データ取得 (REST API) エフェクト
  // ==========================================
  useEffect(() => {
    // リアルタイム画面、または全体(overview)タブの時は履歴を取らない
    if (timeRange === 'live' || activeTab === 'overview') return;

    const fetchHistory = async () => {
      setIsLoading(true); // くるくるローディング開始
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/metrics/history?agent=${activeTab}&range=${timeRange}`);
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data = await res.json();
        setHistoryData(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false); // くるくるローディング終了
      }
    };

    fetchHistory();
  }, [activeTab, timeRange]);

  // UI用スタイル
  const colors = ['#63b3ed', '#f6ad55', '#68d391', '#fc8181', '#b794f4'];
  const agents = Object.keys(agentData);

  const getTabStyle = (tabName) => ({
    padding: '0.75rem 1.5rem', cursor: 'pointer',
    backgroundColor: activeTab === tabName ? '#4a5568' : 'transparent',
    color: activeTab === tabName ? '#f7fafc' : '#a0aec0',
    border: 'none', borderBottom: activeTab === tabName ? '3px solid #63b3ed' : '3px solid transparent',
    fontSize: '1rem', fontWeight: 'bold', transition: 'all 0.2s',
  });

  const getRangeButtonStyle = (range) => ({
    padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: 'none',
    backgroundColor: timeRange === range ? '#63b3ed' : '#2d3748',
    color: timeRange === range ? '#1a202c' : '#a0aec0',
    fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s'
  });

  // 🌟 グラフに渡すデータを動的に切り替える（ライブデータか、過去データか）
  const chartDataToDisplay = timeRange === 'live' 
    ? (agentData[activeTab] ? [...agentData[activeTab]].reverse() : [])
    : historyData;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto', background: '#1a202c', color: '#e2e8f0', minHeight: '100vh' }}>
      
      <div style={{ borderBottom: '1px solid #2d3748', marginBottom: '2rem' }}>
        <h1 style={{ color: '#f7fafc', marginBottom: '1rem' }}>🚀 Hyb-Core Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={getTabStyle('overview')} onClick={() => { setActiveTab('overview'); setTimeRange('live'); }}>🌐 全体 (Overview)</button>
          {agents.map(agent => (
            <button key={agent} style={getTabStyle(agent)} onClick={() => setActiveTab(agent)}>💻 {agent}</button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: '#fc8181', fontWeight: 'bold', padding: '1rem', background: '#4A1C1C', borderRadius: '4px' }}>⚠️ {error}</p>}

      {/* ==================== 概要タブ ==================== */}
      {activeTab === 'overview' && (
        <div style={{ background: '#2d3748', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '1.5rem' }}>Network CPU Usage (Live)</h2>
          {agents.length === 0 ? <p style={{ color: '#a0aec0', textAlign: 'center', padding: '2rem' }}>エージェント待機中...</p> : (
            <div style={{ width: '100%', height: 450 }}>
              <ResponsiveContainer>
                <LineChart data={overviewData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis dataKey="time" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                  <Legend />
                  {agents.map((agent, i) => (
                    <Line key={agent} type="monotone" dataKey={agent} stroke={colors[i % colors.length]} strokeWidth={3} dot={false} connectNulls={true} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ==================== 個別タブ ==================== */}
      {activeTab !== 'overview' && (
        <div>
          {/* 🌟 期間選択コントロールパネル */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2d3748', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{activeTab} Analytics</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={getRangeButtonStyle('live')} onClick={() => setTimeRange('live')}>Live</button>
              <button style={getRangeButtonStyle('1h')} onClick={() => setTimeRange('1h')}>1時間 (Raw)</button>
              <button style={getRangeButtonStyle('24h')} onClick={() => setTimeRange('24h')}>24時間 (Rollup)</button>
              <button style={getRangeButtonStyle('7d')} onClick={() => setTimeRange('7d')}>7日間 (Rollup)</button>
            </div>
          </div>

          <div style={{ background: '#2d3748', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '2rem' }}>
            <h2 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: '1.5rem' }}>Resource Chart</h2>
            
            {/* 🌟 プロ仕様のローディングUX */}
            {isLoading ? (
              <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#63b3ed', fontSize: '1.5rem' }}>
                Loading Data... ⏳
              </div>
            ) : (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={chartDataToDisplay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="time" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" name="CPU Usage" stroke="#63b3ed" strokeWidth={3} dot={timeRange === 'live' ? {r:4} : false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="memory" name="Memory Usage" stroke="#f6ad55" strokeWidth={3} dot={timeRange === 'live' ? {r:4} : false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}