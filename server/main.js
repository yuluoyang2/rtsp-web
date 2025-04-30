const express = require("express");
const expressWebSocket = require("express-ws");
const ffmpeg = require("fluent-ffmpeg");
const webSocketStream = require("websocket-stream/stream");
const NodeMediaServer = require("node-media-server");
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

ffmpeg.setFfmpegPath("ffmpeg");

// RTSP源
const rtspUrl = 'rtsp://localhost:8554/mystream';

// RTSP转websocket-flv
const rtspServerPort = 9998;
const app = express();
app.use(express.static(__dirname));
expressWebSocket(app, null, {
    perMessageDeflate: true
});

// 处理 RTSP 请求并转换为 WebSocket-FLV
function handleRtspToWebsocketFlv() {
    app.ws("*", (ws) => {
        console.log("RTSP request handle");
        const stream = webSocketStream(ws, {
            binary: true,
            browserBufferTimeout: 1000000
        }, {
            browserBufferTimeout: 1000000
        });

        ffmpeg(rtspUrl)
           .addInputOption("-rtsp_transport", "tcp", "-buffer_size", "102400")
           .on("start", () => {
                console.log("Stream started.");
            })
           .on("codecData", () => {
                console.log("Stream codecData.");
            })
           .on("error", (err) => {
                console.log("An error occurred: ", err.message);
            })
           .on("end", () => {
                console.log("Stream ended!");
            })
           .outputFormat("flv")
           .videoCodec("libx264")
           .audioCodec("aac")
           .pipe(stream);
    });

    app.listen(rtspServerPort, () => {
        console.log("Express WebSocket server listening on port: " + rtspServerPort);
    });
}

// RTSP WebSocket-jsmpeg 播放
function startRtspWebSocketJsmpeg() {
    const Stream = require('node-rtsp-stream');
    new Stream({
        name: 'socket',
        streamUrl: rtspUrl,
        wsPort: 9999,
        ffmpegOptions: {
            '-stats': '',
            '-r': 20,
            '-s': '1280x720',
            '-an': '' //  禁用音频
        }
    });
}
// 将 FFmpeg 路径定义为常量
const FFMPEG_PATH = "D:/software/ffmpeg-7.0.2-full_build/bin/ffmpeg.exe";

// NodeMediaServer RTSP转RTMP 生成HTTP-FLV和HLS和DASH
function startNodeMediaServer() {
    const nmsConfig = {
        rtmp: {
            port: 9997,
            chunk_size: 60000,
            gop_cache: true,
            ping: 60,
            ping_timeout: 30
        },
        http: {
            port: 8099,
            mediaroot: './media/', // 建议写
            allow_origin: '*'
        },
        trans: {
            ffmpeg: FFMPEG_PATH,
            tasks: [
                {
                    app: 'live',
                    ac: 'aac',
                    vc: 'libx264',
                    hls: true,
                    hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                    dash: true,
                    dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
                }
            ]
        },
    };

    const nms = new NodeMediaServer(nmsConfig);
    nms.run();
    console.log("NodeMediaServer running with HLS support on port 8099");
}

// 自动拉流并推送到 RTMP
function pushRtspToRtmp() {
    ffmpeg(rtspUrl)
       .inputOptions('-rtsp_transport', 'tcp')
       .videoCodec('copy')
       .audioCodec('copy')
       .outputFormat('flv')
       .output('rtmp://localhost:9997/live/mystream')
       .on('start', (commandLine) => {
            console.log('FFmpeg 启动，执行命令: ' + commandLine);
        })
       .on('error', (err) => {
            console.log('FFmpeg 错误: ' + err.message);
        })
       .on('end', () => {
            console.log('FFmpeg 推流完成');
        })
       .run();
}

// RTSP 转 M3U8 并提供服务
function startRtspToM3u8Service() {
    const m3u8Port = 3000;
    const m3u8File = 'stream.m3u8';
    const m3u8Folder = path.join(__dirname, 'hls');
    // 如果 hls 目录不存在，先创建
    if (!fs.existsSync(m3u8Folder)) {
        fs.mkdirSync(m3u8Folder, { recursive: true });
    }

    const m3u8Path = path.join(m3u8Folder, m3u8File);

    // 删除原来的 .ts 和 .m3u8 文件
    function deleteOldFiles() {
        fs.readdir(m3u8Folder, (err, files) => {
            if (err) {
                console.error('读取目录出错:', err);
                return;
            }
            files.forEach((file) => {
                if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
                    const filePath = path.join(m3u8Folder, file);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('删除文件出错:', err);
                        } else {
                            console.log('已删除文件:', filePath);
                        }
                    });
                }
            });
        });
    }

    // 启动 FFmpeg 进行 RTSP 到 M3U8 的转换
    function convertRtspToM3u8() {
        ffmpeg(rtspUrl)
           .videoCodec('libx264')
           .audioCodec('aac')
           .format('hls')
           .outputOptions([
                '-hls_time 10',
                '-hls_list_size 6'
            ])
           .output(m3u8Path)
           .on('start', (commandLine) => {
                console.log('FFmpeg 启动，执行命令: ' + commandLine);
            })
           .on('error', (err) => {
                console.log('FFmpeg 转换出错: ' + err.message);
            })
           .on('end', () => {
                console.log('FFmpeg 转换完成');
            })
           .run();
    }

    // 提供 M3U8 文件的访问接口
    const m3u8app = new express();
    m3u8app.use(cors());
    m3u8app.get('/stream.m3u8', (req, res) => {
        res.sendFile(m3u8Path, (err) => {
            if (err) {
                console.error('发送 M3U8 文件出错:', err);
                res.status(500).send('无法提供 M3U8 文件');
            }
        });
    });
    // 提供 .ts 文件的访问接口
    m3u8app.get('/:filename.ts', (req, res) => {
        const filename = req.params.filename + '.ts';
        res.sendFile(filename, { root: m3u8Folder }, (err) => {
            if (err) {
                console.error('发送 .ts 文件出错:', err);
                res.status(500).send('无法提供 .ts 文件');
            }
        });
    });

    // 删除旧文件
    deleteOldFiles();
    // 启动 FFmpeg 转换
    convertRtspToM3u8();

    // 启动 M3U8 服务
    m3u8app.listen(m3u8Port, () => {
        console.log(`M3U8 服务运行在 http://localhost:${m3u8Port}`);
    });
}

// 抓取快照功能
function startSnapshotService() {
    const captureApp = new express();
    captureApp.use(cors());

    captureApp.get('/capture-snapshot', (req, res) => {
        const snapshotId = uuidv4();
        const snapshotPath = `${snapshotId}.jpg`;

        ffmpeg(rtspUrl)
           .frames(1)
           .output(snapshotPath)
           .on('start', (commandLine) => {
                console.log('FFmpeg 启动，执行命令: ' + commandLine);
            })
           .on('error', (err) => {
                console.error('执行命令时出错: ' + err.message);
                res.status(500).send('截取快照失败');
            })
           .on('end', () => {
                res.sendFile(snapshotPath, { root: __dirname }, (err) => {
                    if (err) {
                        console.error('发送快照文件出错:', err);
                        res.status(500).send('无法提供快照文件');
                    }
                });
            })
           .run();
    });

    return captureApp;
}

// 保存 RTSP 流到本地的路由
function addSaveRtspRoute(captureApp) {
    captureApp.get('/save-rtsp', (req, res) => {
        const saveRtspId = uuidv4();
        const saveFileName = `${saveRtspId}.mp4`;
        const saveFolder = path.join(__dirname, 'rtspSave');

        // 检查文件夹是否存在，如果不存在则创建
        if (!fs.existsSync(saveFolder)) {
            fs.mkdirSync(saveFolder, { recursive: true });
        }

        const saveFilePath = path.join(saveFolder, saveFileName);

        ffmpeg(rtspUrl)
           .inputOptions('-t', '10')
           .videoCodec('copy')
           .audioCodec('copy')
           .output(saveFilePath)
           .on('start', (commandLine) => {
                console.log('FFmpeg 启动，执行命令: ' + commandLine);
            })
           .on('error', (err) => {
                console.error('执行命令时出错: ' + err.message);
                res.status(500).send('保存 RTSP 流失败');
            })
           .on('end', () => {
                res.sendFile(saveFilePath, (err) => {
                    if (err) {
                        console.error('发送视频文件出错:', err);
                        res.status(500).send('无法提供视频文件');
                    }
                });
            })
           .run();
    });
}

// 启动所有服务
function startAllServices() {
    handleRtspToWebsocketFlv();
    startRtspWebSocketJsmpeg();
    startNodeMediaServer();
    pushRtspToRtmp();
    startRtspToM3u8Service();
    const captureApp = startSnapshotService();
    addSaveRtspRoute(captureApp);
    const port = 3001;
    captureApp.listen(port, () => {
        console.log(`Capture 服务运行在 http://localhost:${port}`);
    });
}

// 启动所有服务
startAllServices();
    