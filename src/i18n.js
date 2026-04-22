import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 🌐 翻訳データ
const resources = {
  en: { translation: {
    agentDownload: 'Agent Download',
    darkMode: '🌙 Dark Mode',
    lightMode: '☀️ Light Mode',
    downloadReport: 'Download Report',
    overviewTab: 'Overview',
    connectionLost: 'Connection lost. Reconnecting...',
    fetchError: 'Failed to fetch data',
    networkCpuLive: 'Network CPU Usage (Live / Local Time)',
    waitingAgents: 'Waiting for agents...',
    downloading: 'Downloading...',
    fetchingData: 'Fetching and generating data. Please wait.',
    selectReport: 'Select Report to Download',
    currentData: 'Current displayed data',
    hour: 'h',
    days: 'd',
    allAboveZip: 'All of the above (Save as a single ZIP file)',
    cancel: 'Cancel',
    downloadExec: 'Download',
    alertOverviewLiveOnly: 'Only Live data can be downloaded from the Overview tab.',
    alertNoDataFor: 'No data available for {{range}}.',
    alertNoDownloadable: 'No downloadable data available.',
    confirmDownload: 'Are you sure you want to download?',
    pinWindow: 'Pin to Top',
    unpinWindow: 'Unpin',
    autostartOn: 'Auto-start: ON',
    autostartOff: 'Auto-start: OFF',
    unknown: 'Unknown',
    uptimeFormat: '{{d}}d {{h}}h {{m}}m',
    analytics: 'Analytics',
    uptimeLabel: 'Uptime',
    resourceChart: 'Resource Chart (Local Time)',
    loadingData: 'Loading Data... ⏳',
    cpuUsage: 'CPU Usage',
    memoryUsage: 'Memory Usage',
    diskUsage: 'Disk Usage',
    networkTraffic: 'Network Traffic (Bytes/sec / Local Time)',
    downloadRx: 'Download (Rx)',
    uploadTx: 'Upload (Tx)',
    reportFilename: '{{tab}}_{{range}}_report.csv',
    allReportsZip: '{{tab}}_all_reports_{{date}}.zip'
  } },
  ja: { translation: {
    agentDownload: 'エージェントダウンロード',
    darkMode: '🌙 ダークモード',
    lightMode: '☀️ ライトモード',
    downloadReport: 'レポートをダウンロード',
    overviewTab: '全体 (Overview)',
    connectionLost: 'サーバーとの接続が切れました。再接続中...',
    fetchError: 'データの取得に失敗しました',
    networkCpuLive: 'ネットワーク CPU 使用率 (ライブ / ローカルタイム)',
    waitingAgents: 'エージェント待機中...',
    downloading: 'ダウンロード中...',
    fetchingData: 'データを取得・生成しています。しばらくお待ちください。',
    selectReport: 'ダウンロードするレポートを選択',
    currentData: '現在の表示データ',
    hour: '時間',
    days: '日間',
    allAboveZip: '上記全て (1つのZIPファイルとして保存)',
    cancel: 'キャンセル',
    downloadExec: 'ダウンロード実行',
    alertOverviewLiveOnly: '全体 (Overview) タブではLiveデータのみダウンロード可能です。',
    alertNoDataFor: '{{range}} のデータがありません。',
    alertNoDownloadable: 'ダウンロード可能なデータがありませんでした。',
    confirmDownload: 'ダウンロードを実行しますか？',
    pinWindow: '最前面にピン留め',
    unpinWindow: 'ピン留め解除',
    autostartOn: '自動起動: オン',
    autostartOff: '自動起動: オフ',
    unknown: '不明',
    uptimeFormat: '{{d}}日 {{h}}時間 {{m}}分',
    analytics: '分析',
    uptimeLabel: '連続稼働',
    resourceChart: 'リソースチャート (ローカルタイム)',
    loadingData: 'データ読み込み中... ⏳',
    cpuUsage: 'CPU使用率',
    memoryUsage: 'メモリ使用率',
    diskUsage: 'ディスク使用率',
    networkTraffic: 'ネットワークトラフィック (Bytes/sec / ローカルタイム)',
    downloadRx: 'ダウンロード (受信)',
    uploadTx: 'アップロード (送信)',
    reportFilename: '{{tab}}_{{range}}_レポート.csv',
    allReportsZip: '{{tab}}_全レポート_{{date}}.zip'
  } },
  zh: { translation: {
    agentDownload: '下载 Agent',
    darkMode: '🌙 暗黑模式',
    lightMode: '☀️ 明亮模式',
    downloadReport: '下载报告',
    overviewTab: '总览 (Overview)',
    connectionLost: '与服务器的连接已断开。正在重新连接...',
    fetchError: '获取数据失败',
    networkCpuLive: '网络 CPU 使用率 (实时 / 本地时间)',
    waitingAgents: '等待代理连接...',
    downloading: '下载中...',
    fetchingData: '正在获取并生成数据。请稍候。',
    selectReport: '选择要下载的报告',
    currentData: '当前显示数据',
    hour: '小时',
    days: '天',
    allAboveZip: '以上全部 (保存为一个 ZIP 文件)',
    cancel: '取消',
    downloadExec: '执行下载',
    alertOverviewLiveOnly: '在总览 (Overview) 选项卡中只能下载实时数据。',
    alertNoDataFor: '没有 {{range}} 的数据。',
    alertNoDownloadable: '没有可下载的数据。',
    confirmDownload: '确定要下载吗？',
    pinWindow: '置顶显示',
    unpinWindow: '取消置顶',
    autostartOn: '开机启动: 开启',
    autostartOff: '开机启动: 关闭',
    unknown: '未知',
    uptimeFormat: '{{d}}天 {{h}}小时 {{m}}分钟',
    analytics: '分析',
    uptimeLabel: '连续运行',
    resourceChart: '资源图表 (本地时间)',
    loadingData: '数据加载中... ⏳',
    cpuUsage: 'CPU 使用率',
    memoryUsage: '内存 使用率',
    diskUsage: '磁盘 使用率',
    networkTraffic: '网络流量 (Bytes/sec / 本地时间)',
    downloadRx: '下载 (接收)',
    uploadTx: '上传 (发送)',
    reportFilename: '{{tab}}_{{range}}_报告.csv',
    allReportsZip: '{{tab}}_所有报告_{{date}}.zip'
  } },
  ko: { translation: {
    agentDownload: '에이전트 다운로드',
    darkMode: '🌙 다크 모드',
    lightMode: '☀️ 라이트 모드',
    downloadReport: '보고서 다운로드',
    overviewTab: '전체 (Overview)',
    connectionLost: '서버와의 연결이 끊어졌습니다. 재연결 중...',
    fetchError: '데이터를 가져오는 데 실패했습니다',
    networkCpuLive: '네트워크 CPU 사용률 (라이브 / 로컬 시간)',
    waitingAgents: '에이전트 대기 중...',
    downloading: '다운로드 중...',
    fetchingData: '데이터를 가져오고 생성하는 중입니다. 잠시만 기다려주세요.',
    selectReport: '다운로드할 보고서 선택',
    currentData: '현재 표시된 데이터',
    hour: '시간',
    days: '일',
    allAboveZip: '위의 모든 항목 (하나의 ZIP 파일로 저장)',
    cancel: '취소',
    downloadExec: '다운로드 실행',
    alertOverviewLiveOnly: '전체 (Overview) 탭에서는 라이브 데이터만 다운로드할 수 있습니다.',
    alertNoDataFor: '{{range}}에 대한 데이터가 없습니다.',
    alertNoDownloadable: '다운로드할 수 있는 데이터가 없습니다.',
    confirmDownload: '다운로드를 실행하시겠습니까?',
    pinWindow: '항상 위로',
    unpinWindow: '고정 해제',
    autostartOn: '자동 시작: 켜짐',
    autostartOff: '자동 시작: 꺼짐',
    unknown: '알 수 없음',
    uptimeFormat: '{{d}}일 {{h}}시간 {{m}}분',
    analytics: '분석',
    uptimeLabel: '연속 가동',
    resourceChart: '리소스 차트 (로컬 시간)',
    loadingData: '데이터 로딩 중... ⏳',
    cpuUsage: 'CPU 사용률',
    memoryUsage: '메모리 사용률',
    diskUsage: '디스크 사용률',
    networkTraffic: '네트워크 트래픽 (Bytes/sec / 로컬 시간)',
    downloadRx: '다운로드 (수신)',
    uploadTx: '업로드 (송신)',
    reportFilename: '{{tab}}_{{range}}_보고서.csv',
    allReportsZip: '{{tab}}_모든_보고서_{{date}}.zip'
  } }
};

i18n
  .use(LanguageDetector) // ユーザーのブラウザ言語を自動検知
  .use(initReactI18next) // react-i18nextを初期化
  .init({
    resources,
    fallbackLng: 'ja',
    interpolation: { escapeValue: false }
  });

export default i18n;

// 🌐 時刻フォーマットヘルパー関数
export function formatTickTime(lang, val) {
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const locale = lang === 'zh' ? 'zh-CN' : lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
    return d.toLocaleTimeString(locale);
  }
  return val;
}

export function formatTooltipTime(lang, val) {
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const locale = lang === 'zh' ? 'zh-CN' : lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
    return d.toLocaleString(locale, { timeZoneName: 'short' }); // ツールチップ用には日付と時刻の両方＋タイムゾーン（JSTなど）を表示
  }
  return val;
}

// 🌐 数値フォーマットヘルパー関数
export function formatNumber(lang, val, options = {}) {
  const locale = lang === 'zh' ? 'zh-CN' : lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
  // 小数点の桁数などを指定して、各ロケールに適した形式（カンマ区切りなど）に変換
  return new Intl.NumberFormat(locale, options).format(val);
}