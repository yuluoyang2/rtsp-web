import React, { useEffect, useRef } from 'react';
import flvjs from 'flv.js';
import './index.css'; // 引入当前目录下的 index.css

function FlvPlayer1() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (flvjs.isSupported()) {
      const player = flvjs.createPlayer({
        type: 'flv',
        isLive: true,
        url: 'ws://localhost:9998',
      });
      player.attachMediaElement(videoRef.current);
      player.load();
      player.play();
      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="container">
      <h2>Flv.js 播放器 1</h2>
      <div className="player-wrapper">
        <video ref={videoRef} className="video-player" controls />
      </div>
    </div>
  );
}

export default FlvPlayer1;


