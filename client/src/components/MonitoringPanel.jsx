import React, { useEffect, useRef } from'react';
import JSMpeg from "@cycjimmy/jsmpeg-player";
import flvjs from 'flv.js';
import Hls from 'hls.js';
import dashjs from 'dashjs'; // 引入 dashjs 库
import '../index.css';

function MonitoringPanel() {
    const jsmpegContainerRef = useRef(null);
    const flvVideoRef = useRef(null);
    const hlsVideoRef = useRef(null);
    const flvVideoRef2 = useRef(null);
    const additionalHlsVideoRef = useRef(null);
    const dashVideoRef = useRef(null); // 新增 DASH 视频元素的 ref

    const jsmpegPlayerRef = useRef(null);
    const flvPlayerRef = useRef(null);
    const hlsInstanceRef = useRef(null);
    const flvPlayerRef2 = useRef(null);
    const additionalHlsInstanceRef = useRef(null);
    const dashPlayerRef = useRef(null); // 新增 DASH 播放器实例的 ref

    useEffect(() => {
        // 初始化 JSMpeg 播放器
        const jsmpegPlayer = new JSMpeg.VideoElement(
            jsmpegContainerRef.current,
            "ws://localhost:9999",
            {
                autoplay: true,
                loop: true,
                audio: true,
            }
        );
        jsmpegPlayerRef.current = jsmpegPlayer;

        // 初始化 flv.js 播放器
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
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                hlsVideoRef.current.play();
            });
            hlsInstanceRef.current = hls;
        } else if (hlsVideoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            hlsVideoRef.current.src = "http://localhost:8099/live/mystream/index.m3u8";
            hlsVideoRef.current.addEventListener('loadedmetadata', () => {
                hlsVideoRef.current.play();
            });
        }

        // 初始化第二个 flv.js 播放器
        if (flvjs.isSupported()) {
            const flvPlayer2 = flvjs.createPlayer(
                {
                    type: "flv",
                    url: "http://localhost:8099/live/mystream.flv"
                }
            );
            flvPlayer2.attachMediaElement(flvVideoRef2.current);
            flvPlayer2.load();
            flvPlayer2.play();
            flvPlayerRef2.current = flvPlayer2;
        }

        // 初始化新增的 HLS 播放器
        if (Hls.isSupported()) {
            const additionalHls = new Hls();
            additionalHls.loadSource("http://localhost:3000/stream.m3u8");
            additionalHls.attachMedia(additionalHlsVideoRef.current);
            additionalHls.on(Hls.Events.MANIFEST_PARSED, () => {
                additionalHlsVideoRef.current.play();
            });
            additionalHlsInstanceRef.current = additionalHls;
        } else if (additionalHlsVideoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            additionalHlsVideoRef.current.src = "http://localhost:3000/stream.m3u8";
            additionalHlsVideoRef.current.addEventListener('loadedmetadata', () => {
                additionalHlsVideoRef.current.play();
            });
        }

        // 初始化 DASH 播放器
        const dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(dashVideoRef.current, "http://localhost:8099/live/mystream/index.mpd", true);
        dashPlayerRef.current = dashPlayer;

        return () => {
            // 暂停视频元素
            if (flvVideoRef.current) flvVideoRef.current.pause();
            if (hlsVideoRef.current) hlsVideoRef.current.pause();
            if (flvVideoRef2.current) flvVideoRef2.current.pause();
            if (additionalHlsVideoRef.current) additionalHlsVideoRef.current.pause();
            if (dashVideoRef.current) dashVideoRef.current.pause(); // 暂停 DASH 视频

            // 销毁播放器实例
            if (jsmpegPlayerRef.current) {
                try {
                    jsmpegPlayerRef.current.destroy();
                } catch (error) {
                    console.error('Error destroying JSMpeg player:', error);
                }
                jsmpegPlayerRef.current = null;
            }
            if (flvPlayerRef.current) {
                flvPlayerRef.current.destroy();
                flvPlayerRef.current = null;
            }
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
            if (flvPlayerRef2.current) {
                flvPlayerRef2.current.destroy();
                flvPlayerRef2.current = null;
            }
            if (additionalHlsInstanceRef.current) {
                additionalHlsInstanceRef.current.destroy();
                additionalHlsInstanceRef.current = null;
            }
            if (dashPlayerRef.current) {
                dashPlayerRef.current.destroy();
                dashPlayerRef.current = null;
            } // 销毁 DASH 播放器实例
        };
    }, []);

    return (
        <div className="monitoring-container">
            <h1>监控视频面板</h1>
            <div className="video-grid">
                <div className="top-row">
                    <div className="video-box">
                        <h3>JSMpeg 播放器</h3>
                        <div ref={jsmpegContainerRef} className="video-player" />
                    </div>
                    <div className="video-box">
                        <h3>Flv.js 播放器 1</h3>
                        <video ref={flvVideoRef} controls className="video-player" />
                    </div>
                </div>
                <div className="bottom-row">
                    <div className="video-box">
                        <h3>HLS 播放器</h3>
                        <video
                            ref={hlsVideoRef}
                            controls
                            className="video-player"
                        />
                    </div>
                    <div className="video-box">
                        <h3>Flv.js 播放器 2</h3>
                        <video
                            ref={flvVideoRef2}
                            controls
                            className="video-player"
                        />
                    </div>
                </div>
                <div className="bottom-row">
                    <div className="video-box">
                        <h3>HLS 播放器 2</h3>
                        <video
                            ref={additionalHlsVideoRef}
                            controls
                            className="video-player"
                        />
                    </div>
                    <div className="video-box">
                        <h3>DASH 播放器</h3>
                        <video
                            ref={dashVideoRef}
                            controls
                            className="video-player"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MonitoringPanel;
