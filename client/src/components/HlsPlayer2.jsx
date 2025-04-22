import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import './index.css'; // 引入当前目录下的 index.css

function HlsPlayer2() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource("http://localhost:3000/stream.m3u8");
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = "http://localhost:3000/stream.m3u8";
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
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
  return (
    <div className="container">
      <h1>HLS 播放器 2</h1>
      <div className="player-wrapper">
        <video ref={videoRef} className="video-player" controls />
      </div>
      <br />
      <button onClick={handleSnapshot} className="button">截取快照</button>
    </div>
  );
}

export default HlsPlayer2;
