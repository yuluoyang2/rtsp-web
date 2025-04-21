import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import JSMpeg from "@cycjimmy/jsmpeg-player";
import flvjs from 'flv.js';
import Hls from 'hls.js';
import './index.css';

function MonitoringPanel() {
    const [activePlayer, setActivePlayer] = useState('jsmpeg'); // 添加状态管理

    const jsmpegContainerRef = useRef(null);
    const flvVideoRef = useRef(null);
    const hlsVideoRef = useRef(null);
    const flvVideoRef2 = useRef(null);
    const additionalHlsVideoRef = useRef(null);

    const jsmpegPlayerRef = useRef(null);
    const flvPlayerRef = useRef(null);
    const hlsInstanceRef = useRef(null);
    const flvPlayerRef2 = useRef(null);
    const additionalHlsInstanceRef = useRef(null);

    useEffect(() => {
        // 初始化 JSMpeg 播放器
        jsmpegPlayerRef.current = new JSMpeg.VideoElement(
            jsmpegContainerRef.current,
            "ws://localhost:9999",
            { autoplay: true, loop: true, audio: true }
        );

        // 初始化 flv.js 播放器 1
        if (flvjs.isSupported()) {
            const flvPlayer = flvjs.createPlayer({
                type: 'flv',
                isLive: true,
                url: 'ws://localhost:9998',
            });
            flvPlayer.attachMediaElement(flvVideoRef.current);
            flvPlayer.load();
            flvPlayer.play();
            flvPlayerRef.current = flvPlayer;
        }

        // 初始化 HLS 播放器
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource("http://localhost:8099/live/mystream/index.m3u8");
            hls.attachMedia(hlsVideoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => hlsVideoRef.current.play());
            hlsInstanceRef.current = hls;
        } else if (hlsVideoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            hlsVideoRef.current.src = "http://localhost:8099/live/mystream/index.m3u8";
            hlsVideoRef.current.addEventListener('loadedmetadata', () => hlsVideoRef.current.play());
        }

        // 初始化 flv.js 播放器 2
        if (flvjs.isSupported()) {
            const flvPlayer2 = flvjs.createPlayer({
                type: "flv",
                url: "http://localhost:8099/live/mystream.flv"
            });
            flvPlayer2.attachMediaElement(flvVideoRef2.current);
            flvPlayer2.load();
            flvPlayer2.play();
            flvPlayerRef2.current = flvPlayer2;
        }

        // 初始化新增 HLS 播放器
        if (Hls.isSupported()) {
            const additionalHls = new Hls();
            additionalHls.loadSource("http://localhost:3000/stream.m3u8");
            additionalHls.attachMedia(additionalHlsVideoRef.current);
            additionalHls.on(Hls.Events.MANIFEST_PARSED, () => additionalHlsVideoRef.current.play());
            additionalHlsInstanceRef.current = additionalHls;
        } else if (additionalHlsVideoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            additionalHlsVideoRef.current.src = "http://localhost:3000/stream.m3u8";
            additionalHlsVideoRef.current.addEventListener('loadedmetadata', () => additionalHlsVideoRef.current.play());
        }

        return () => {
            if (jsmpegPlayerRef.current) jsmpegPlayerRef.current.destroy();
            if (flvPlayerRef.current) flvPlayerRef.current.destroy();
            if (hlsInstanceRef.current) hlsInstanceRef.current.destroy();
            if (flvPlayerRef2.current) flvPlayerRef2.current.destroy();
            if (additionalHlsInstanceRef.current) additionalHlsInstanceRef.current.destroy();
        };
    }, []);

    return (
        <div className="monitoring-container">
            <h1>监控视频面板</h1>
            <div className="button-container">
                <button onClick={() => setActivePlayer('jsmpeg')} style={{ backgroundColor: '#007bff', color: 'white' }}>
                    JSMpeg 播放器
                </button>
                <button onClick={() => setActivePlayer('flv1')} style={{ backgroundColor: '#28a745', color: 'white' }}>
                    Flv.js 播放器 1
                </button>
                <button onClick={() => setActivePlayer('hls')} style={{ backgroundColor: '#ffc107', color: 'black' }}>
                    HLS 播放器
                </button>
                <button onClick={() => setActivePlayer('flv2')} style={{ backgroundColor: '#dc3545', color: 'white' }}>
                    Flv.js 播放器 2
                </button>
                <button onClick={() => setActivePlayer('additionalHls')} style={{ backgroundColor: '#6c757d', color: 'white' }}>
                    新增 HLS 播放器
                </button>
            </div>

            <div className="video-container">
                <div className="video-box" style={{ display: activePlayer === 'jsmpeg' ? 'block' : 'none' }}>
                    <h3>JSMpeg 播放器</h3>
                    <div ref={jsmpegContainerRef} className="video-player" />
                </div>

                <div className="video-box" style={{ display: activePlayer === 'flv1' ? 'block' : 'none' }}>
                    <h3>Flv.js 播放器 1</h3>
                    <video ref={flvVideoRef} controls className="video-player" />
                </div>

                <div className="video-box" style={{ display: activePlayer === 'hls' ? 'block' : 'none' }}>
                    <h3>HLS 播放器</h3>
                    <video ref={hlsVideoRef} controls className="video-player" />
                </div>

                <div className="video-box" style={{ display: activePlayer === 'flv2' ? 'block' : 'none' }}>
                    <h3>Flv.js 播放器 2</h3>
                    <video ref={flvVideoRef2} controls className="video-player" />
                </div>

                <div className="video-box" style={{ display: activePlayer === 'additionalHls' ? 'block' : 'none' }}>
                    <h3>新增 HLS 播放器</h3>
                    <video ref={additionalHlsVideoRef} controls className="video-player" />
                </div>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <MonitoringPanel />
);
