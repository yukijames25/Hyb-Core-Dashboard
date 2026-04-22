import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import styled, { ThemeProvider } from 'styled-components';
import AgentDashboard from './AgentDashboard.jsx';
import JSZip from 'jszip';
import { formatTickTime, formatTooltipTime, formatNumber } from './i18n.js';
import { useTranslation } from 'react-i18next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/dpi';
import { TrayIcon } from '@tauri-apps/api/tray';
import { defaultWindowIcon } from '@tauri-apps/api/app';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

// ==========================================
// 💅 Styled Components
// ==========================================
const TitleBar = styled.div`
  height: 30px;
  background: ${({ theme }) => theme.cardBackground};
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
`;

const DragRegion = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
`;

const WindowControls = styled.div`
  display: flex;
  height: 100%;
`;

const WindowButton = styled.div`
  width: 46px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: ${({ theme }) => theme.textColor};
  background: ${({ isActive, theme }) => isActive ? theme.buttonBg : 'transparent'};
  transition: background 0.2s;
  &:hover {
    background: ${({ theme, closeBtn }) => closeBtn ? '#e81123' : theme.buttonBg};
    color: ${({ theme, closeBtn }) => closeBtn ? '#ffffff' : theme.textColor};
  }
`;

const AppWrapper = styled.div`
  padding: ${({ isTauri }) => isTauri ? 'calc(1.5rem + 30px)' : '1.5rem'} 1.5rem 1.5rem;
  font-family: sans-serif;
  max-width: 100%;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.background};
  background-image: ${({ theme }) => theme.backgroundImage};
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
  color: ${({ theme }) => theme.textColor};
  min-height: 100vh;
  transition: background-color 0.2s, color 0.2s;
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
  const isTauri = '__TAURI_INTERNALS__' in window;
  
  // 🌟 getCurrentWindow()が毎レンダリングごとに新しいオブジェクトを返して枠がズレる（ドリフトする）のを防ぐ
  const appWindow = useMemo(() => isTauri ? getCurrentWindow() : null, [isTauri]);
  const [isPinned, setIsPinned] = useState(false);
  const [isAutostart, setIsAutostart] = useState(false);

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

  // 🌟 app.haikei.app 風の Polygon Scatter SVG背景を生成する関数
  const getPolygonScatterSvg = (fillColor) => {
    const encodedColor = encodeURIComponent(fillColor);
    return `url("data:image/svg+xml,%3Csvg id='visual' viewBox='0 0 900 600' width='900' height='600' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3Cg fill='${encodedColor}'%3E%3Cpolygon points='75,34 94,62 61,77 42,49'/%3E%3Cpolygon points='835,100 848,135 813,126'/%3E%3Cpolygon points='455,263 487,281 472,316 440,298'/%3E%3Cpolygon points='265,496 235,516 209,491'/%3E%3Cpolygon points='755,488 757,523 723,526 721,491'/%3E%3Cpolygon points='56,453 69,486 35,491'/%3E%3Cpolygon points='580,105 605,129 577,151 552,127'/%3E%3Cpolygon points='248,153 281,159 272,192'/%3E%3Cpolygon points='615,316 636,346 605,355'/%3E%3Cpolygon points='150,335 174,364 142,379 118,350'/%3E%3Cpolygon points='365,65 398,67 387,97'/%3E%3Cpolygon points='815,321 848,328 837,360'/%3E%3Cpolygon points='412,460 442,476 421,504 391,488'/%3E%3Cpolygon points='880,520 890,550 860,560'/%3E%3Cpolygon points='10,10 30,20 20,40'/%3E%3Cpolygon points='500,550 530,560 520,590 490,580'/%3E%3C/g%3E%3C/svg%3E")`;
  };

  // 🎨 テーマ定義
  const themes = {
    light: {
      background: '#f7fafc',
      backgroundImage: getPolygonScatterSvg('#e2e8f0'),
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
      backgroundImage: getPolygonScatterSvg('#2d3748'),
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
  // 📌 常に最前面に表示（ピン留め）の切り替え
  // ==========================================
  const togglePin = async () => {
    if (appWindow) {
      const nextPinned = !isPinned;
      await appWindow.setAlwaysOnTop(nextPinned);
      setIsPinned(nextPinned);
    }
  };

  // ==========================================
  // 🚀 PC起動時の自動起動（スタートアップ）の確認と切り替え
  // ==========================================
  useEffect(() => {
    if (!isTauri) return;
    const checkAutostart = async () => {
      try {
        const enabled = await isEnabled();
        setIsAutostart(enabled);
      } catch (err) {
        console.error("Failed to check autostart status:", err);
      }
    };
    checkAutostart();
  }, [isTauri]);

  const toggleAutostart = async () => {
    try {
      if (isAutostart) {
        await disable();
        setIsAutostart(false);
      } else {
        await enable();
        setIsAutostart(true);
      }
    } catch (err) {
      console.error("Failed to toggle autostart:", err);
    }
  };

  // ==========================================
  // 📥 システムトレイ（タスクトレイ）の初期化
  // ==========================================
  useEffect(() => {
    if (!appWindow) return;

    const setupTray = async () => {
      try {
        await TrayIcon.new({
          icon: await defaultWindowIcon(),
          tooltip: 'Hyb-Core Dashboard\n(Right-click to Quit)',
          action: (event) => {
            if (event.type === 'Click') {
              if (event.button === 'Left') {
                appWindow.show();
                appWindow.setFocus();
              } else if (event.button === 'Right') {
                if (window.confirm('アプリを完全に終了しますか？ (Are you sure you want to quit?)')) {
                  appWindow.destroy(); // 🌟 ウィンドウを破棄してアプリを完全終了
                }
              }
            }
          }
        });
      } catch (err) {
        console.log("Tray icon already exists or failed:", err);
      }
    };
    setupTray();
  }, [appWindow]);

  // ==========================================
  // 🪟 ウィンドウの状態（サイズ・位置）を保存・復元
  // ==========================================
  useEffect(() => {
    if (!appWindow) return;
    let unlistenResize;
    let unlistenMove;
    let unlistenClose;
    let timeoutId;

    const saveState = async () => {
      try {
        const size = await appWindow.innerSize();
        const pos = await appWindow.innerPosition();
        localStorage.setItem('tauriWindowState', JSON.stringify({
          width: size.width,
          height: size.height,
          x: pos.x,
          y: pos.y
        }));
      } catch (err) {
        console.error('Failed to save window state:', err);
      }
    };

    const debouncedSave = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveState, 500); // 500msのデバウンスで負荷軽減
    };

    const restoreState = async () => {
      const saved = localStorage.getItem('tauriWindowState');
      if (saved) {
        try {
          const { width, height, x, y } = JSON.parse(saved);
          // 🌟 前回のサイズと位置を復元
          await appWindow.setSize(new PhysicalSize(width, height));
          await appWindow.setPosition(new PhysicalPosition(x, y));
        } catch (err) {
          console.error('Failed to restore window state:', err);
        }
      }
    };

    restoreState().then(() => {
      appWindow.onResized(debouncedSave).then(u => unlistenResize = u);
      appWindow.onMoved(debouncedSave).then(u => unlistenMove = u);
      
      // 🌟 OS標準の閉じる操作（Alt+F4やタスクバーから閉じる）を横取りして隠す
      appWindow.onCloseRequested((event) => {
        event.preventDefault();
        appWindow.hide();
      }).then(u => unlistenClose = u);
    });

    return () => {
      clearTimeout(timeoutId);
      if (unlistenResize) unlistenResize();
      if (unlistenMove) unlistenMove();
      if (unlistenClose) unlistenClose();
    };
  }, [appWindow]);

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

        // 🌟 バックエンドのJSONキー名が想定と違う場合（大文字小文字、省略形など）に備えて幅広くチェック！
        const cpuVal = raw.cpu ?? raw.cpu_usage ?? raw.cpuUsage ?? raw.Cpu;
        if (cpuVal == null) return; // CPUデータが無い場合は無効なパケットとして無視

        const memVal = raw.memory ?? raw.memory_usage ?? raw.memoryUsage ?? raw.Memory ?? 0;
        const diskVal = raw.disk ?? raw.disk_usage ?? raw.diskUsage ?? raw.Disk ?? raw.disk_percent ?? raw.diskPercent ?? 0;
        
        const netTx = raw.network_tx ?? raw.net_tx ?? raw.networkTx ?? raw.NetworkTx ?? raw.bytes_sent ?? raw.bytesSent ?? raw.tx_bytes ?? raw.txBytes ?? raw.network?.tx ?? 0;
        const netRx = raw.network_rx ?? raw.net_rx ?? raw.networkRx ?? raw.NetworkRx ?? raw.bytes_recv ?? raw.bytesRecv ?? raw.rx_bytes ?? raw.rxBytes ?? raw.network?.rx ?? 0;
        const uptimeVal = raw.uptime ?? raw.Uptime ?? raw.up_time ?? 0;

        // 💡 サーバーから届いた生データのキー名をコンソールに出力します！（F12で確認してください）
        console.log("📦 サーバーから届いた生データ:", raw);

        setOverviewData((prev) => [...prev, { time: timeString, [agentName]: cpuVal }].slice(-30));

        setAgentData((prev) => {
          const currentHistory = prev[agentName] || [];
          
          // 🌟 ここに追加：updatedHistory の中に network_tx, network_rx, uptime を詰め込む！
          const updatedHistory = [{ 
            time: timeString, 
            cpu: cpuVal, 
            memory: memVal, 
            disk: diskVal,
            network_tx: netTx,     // 👈 これ！
            network_rx: netRx,     // 👈 これ！
            uptime: uptimeVal      // 👈 これ！
          }, ...currentHistory];
          
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
    // 🌟 ダウンロード前に確認ダイアログを表示
    if (!window.confirm(t('confirmDownload'))) return;

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
      {isTauri && (
        <TitleBar>
          {/* data-tauri-drag-region 属性をつけることで、ここを掴んでウィンドウを移動できるようになります */}
          {/* 🌟 ダブルクリックで最大化/元に戻す機能を追加 */}
          <DragRegion data-tauri-drag-region onDoubleClick={() => appWindow?.toggleMaximize()}>
            <span style={{ paddingLeft: '10px', fontSize: '12px', fontWeight: 'bold', pointerEvents: 'none' }}>
              🚀 Hyb-Core Dashboard
            </span>
          </DragRegion>
          <WindowControls>
            <WindowButton onClick={togglePin} isActive={isPinned} title={isPinned ? t('unpinWindow') : t('pinWindow')}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                 <path d="M10 4L11 1L5 1L6 4L4 9L7 9L7 15L8 16L9 15L9 9L12 9L10 4Z"/>
              </svg>
            </WindowButton>
            <WindowButton onClick={() => appWindow?.minimize()}>
              <svg width="11" height="11" viewBox="0 0 11 11"><line x1="1" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1"/></svg>
            </WindowButton>
            <WindowButton onClick={() => appWindow?.toggleMaximize()}>
              <svg width="11" height="11" viewBox="0 0 11 11"><rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
            </WindowButton>
            <WindowButton closeBtn onClick={() => {
              appWindow?.hide(); // 🌟 アプリを終了せず、バックグラウンド（タスクトレイ）に隠す
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11"><path d="M1.5,1.5 L9.5,9.5 M1.5,9.5 L9.5,1.5" stroke="currentColor" strokeWidth="1"/></svg>
            </WindowButton>
          </WindowControls>
        </TitleBar>
      )}
      <AppWrapper isTauri={isTauri}>
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
                {isTauri && (
                  <ThemeToggleButton onClick={toggleAutostart} title="PC起動時に自動でアプリを立ち上げます">
                    🚀 {isAutostart ? t('autostartOn') : t('autostartOff')}
                  </ThemeToggleButton>
                )}
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
                <ResponsiveContainer width="100%" height={450}>
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
                    <Brush dataKey="time" height={40} travellerWidth={15} stroke={currentTheme.accentColor} fill={currentTheme.background} tickFormatter={(val) => formatTickTime(currentLang, val)} />
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