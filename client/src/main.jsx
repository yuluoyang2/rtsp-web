import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  Link
} from 'react-router-dom';

// 使用相对路径导入组件
import JsmpegPlayer from './components/JsmpegPlayer.jsx';
import FlvPlayer1 from './components/FlvPlayer1.jsx';
import FlvPlayer2 from './components/FlvPlayer2.jsx';
import HlsPlayer1 from './components/HlsPlayer1.jsx';
import HlsPlayer2 from './components/HlsPlayer2.jsx';
import MonitoringPanel from './components/MonitoringPanel.jsx';
import DASHPlayer from './components/DASHPlayer.jsx';
import './index.css';

// 将首页内容提取为单独组件
const HomePage = () => (
  <div className="container">
    <h1>请选择一个播放器</h1>
    <div className="switch-buttons">
      <Link to="/jsmpeg">
        <button className="jsmpeg-button">JSMpeg 播放器</button>
      </Link>
      <Link to="/flv1">
        <button className="flv1-button">Flv.js 播放器 1</button>
      </Link>
      <Link to="/flv2">
        <button className="flv2-button">Flv.js 播放器 2</button>
      </Link>
      <Link to="/hls1">
        <button className="hls-button">HLS 播放器 1</button>
      </Link>
      <Link to="/hls2">
        <button className="additionalHls-button">HLS 播放器 2</button>
      </Link>
      <Link to="/dash">
        <button className="dash-button">DASH 播放器</button>
      </Link>
      <Link to="/new-route">
        <button className="new-route-button">监控视频面板</button>
      </Link>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  { path: '/jsmpeg', element: <JsmpegPlayer /> },
  { path: '/flv1', element: <FlvPlayer1 /> },
  { path: '/flv2', element: <FlvPlayer2 /> },
  { path: '/hls1', element: <HlsPlayer1 /> },
  { path: '/hls2', element: <HlsPlayer2 /> },
  { path: '/new-route', element: <MonitoringPanel /> }, // 新增的路由
  { path: '/dash', element: <DASHPlayer /> }, //  新增 DASH 播放器路由
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);