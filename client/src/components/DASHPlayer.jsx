import React, { useEffect, useRef } from'react';
import dashjs from 'dashjs';
import './index.css'; // 引入当前目录下的 index.css

function DASHPlayer() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const player = dashjs.MediaPlayer().create();
    player.initialize(videoRef.current, 'http://localhost:8099/live/mystream/index.mpd', true);
    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
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

  const handleSaveRTSP = async () => {
    try {
      alert("正在截取当前10s的RTSP流");

      const response = await fetch("http://localhost:3001/save-rtsp");

      if (response.ok) {
        alert("已经保存到本地文件夹rtspSave");
      } else {
        const errorText = await response.text();
        alert(`保存失败: ${errorText}`);
      }
    } catch (error) {
      alert(`请求出错: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <h1>DASH 播放器</h1>
      <div className="player-wrapper">
        <video ref={videoRef} className="video-player" controls />
      </div>
      <br />
      <button onClick={handleSnapshot} className="button">截取快照</button>
      <br />
      <button onClick={handleSaveRTSP} className="button">保存 RTSP 流到本地</button>
    </div>
  );
}

export default DASHPlayer;
