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

  return (
    <div className="container">
      <h1>HLS 播放器 2</h1>
      <div className="player-wrapper">
        <video ref={videoRef} className="video-player" controls />
      </div>
    </div>
  );
}

export default HlsPlayer2;
