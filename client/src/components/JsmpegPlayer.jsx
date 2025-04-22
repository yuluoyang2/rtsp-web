import React, { useEffect } from "react";
import JSMpeg from "@cycjimmy/jsmpeg-player";
import './index.css'; // 引入当前目录下的 index.css

export default function JsmpegPlayer() {

  useEffect(() => {
    // 根据你后端 RTSP 推流服务转的 WebSocket 地址修改
    new JSMpeg.VideoElement('#video', 'ws://localhost:9999');
  }, []);
  const handleSnapshot = async () => {
    try {
        const response = await fetch('http://localhost:3001/capture-snapshot');
        if (response.ok) {
            const blob = await response.blob();
            // 创建一个临时 URL 用于下载图片
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download ='snapshot.jpg';
            a.click();
            // 释放临时 URL
            URL.revokeObjectURL(url);
            alert('截取成功'); // 提示截取成功
        } else {
            const errorText = await response.text();
            alert(`请求出错: ${errorText}`);
        }
    } catch (error) {
        alert(`请求出错: ${error.message}`);
    }
  };
  return (
    <div className="container">
      <h1>Jsmpeg Player</h1>
      <div className="player-wrapper">
        <div id="video" style={{ width: 640, height: 360 }}></div>
      </div>
      <br />
      <button onClick={handleSnapshot} className="button">截取快照</button>
    </div>
  );
}
