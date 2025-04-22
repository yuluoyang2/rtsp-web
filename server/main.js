const express = require("express");
const expressWebSocket = require("express-ws");
const ffmpeg = require("fluent-ffmpeg");
const webSocketStream = require("websocket-stream/stream");
const NodeMediaServer = require("node-media-server");
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath("ffmpeg");

const rtspServerPort = 9998;

const rtspUrl = 'rtsp://localhost:8554/mystream';


// 创建 express app 和 websocket
const app = express();
app.use(express.static(__dirname));
expressWebSocket(app, null, {
    perMessageDeflate: true
});

app.ws("*", (ws) => {
    console.log("RTSP request handle");
    const stream = webSocketStream(ws, {
        binary: true,
        browserBufferTimeout: 1000000
    }, {
        browserBufferTimeout: 1000000
    });

    try {
        ffmpeg(rtspUrl)
           .addInputOption("-rtsp_transport", "tcp", "-buffer_size", "102400")
           .on("start", function () {
                console.log("Stream started.");
            })
           .on("codecData", function () {
                console.log("Stream codecData.");
            })
           .on("error", function (err) {
                console.log("An error occurred: ", err.message);
            })
           .on("end", function () {
                console.log("Stream ended!");
            })
           .outputFormat("flv")
           .videoCodec("libx264")
           .audioCodec("aac")
           .pipe(stream);
    } catch (error) {
        console.log(error);
    }
});

app.listen(rtspServerPort, () => {
    console.log("Express WebSocket server listening on port: " + rtspServerPort);
});

// RTSP 软游技术 WebSocket 播放
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

// NodeMediaServer 
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
        // 使用双反斜杠表示路径
        ffmpeg: "D:/software/ffmpeg-7.0.2-full_build/bin/ffmpeg.exe",
        tasks: [
            {
                app: 'live',
                ac: 'aac',
                vc: 'libx264',
                hls: true,
                hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                dash: false,
                dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
            }
        ]
    },

};

const nms = new NodeMediaServer(nmsConfig);
nms.run();
console.log("NodeMediaServer running with HLS support on port 8099");

// 自动拉流并推送到 RTMP
const ffmpegCmd = `"D:/software/ffmpeg-7.0.2-full_build/bin/ffmpeg.exe" -rtsp_transport tcp -i ${rtspUrl} -c:v copy -c:a copy -f flv rtmp://localhost:9997/live/mystream`;

exec(ffmpegCmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`FFmpeg 错误: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`FFmpeg 警告/错误: ${stderr}`);
        return;
    }
    console.log(`FFmpeg 输出: ${stdout}`);
});



// 新增：RTSP 转 M3U8 并提供服务
const m3u8Port = 3000;
//const m3u8Path = 'stream.m3u8';
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
const convertRtspToM3u8 = () => {
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
};

// 提供 M3U8 文件的访问接口
const m3u8app = new express();
m3u8app.use(cors())
m3u8app.get('/stream.m3u8', (req, res) => {
    res.sendFile(m3u8Path,  (err) => {
        if (err) {
            console.error('发送 M3U8 文件出错:', err);
            res.status(500).send('无法提供 M3U8 文件');
        }
    });
});
// 提供 .ts 文件的访问接口
m3u8app.get('/:filename.ts', (req, res) => {
    // 从请求参数中获取文件名，并添加 .ts 扩展名
    const filename = req.params.filename + '.ts';
    // 发送文件给客户端
    res.sendFile(filename, {root :m3u8Folder}, (err) => {
        // 若发送文件时出现错误
        if (err) {
            // 记录错误日志
            console.error('发送 .ts 文件出错:', err);
            // 向客户端返回 500 状态码和错误信息
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
//抓取快照功能
const captureApp = new express();
captureApp.use(cors());
const { v4: uuidv4 } = require('uuid');
captureApp.get('/capture-snapshot', (req, res) => {
    const snapshotId = uuidv4();
    const snapshotPath = `${snapshotId}.jpg`;
    const snapshotCommand = `"D:/software/ffmpeg-7.0.2-full_build/bin/ffmpeg.exe" -i ${rtspUrl} -vframes 1 ${snapshotPath}`;

    exec(snapshotCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行命令时出错: ${error.message}`);
            res.status(500).send('截取快照失败');
            return;
        } 
        if (stderr) {
            console.log(`命令执行过程中的错误信息: ${stderr}`);
        }
        res.sendFile(snapshotPath, { root: __dirname }, (err) => {
            if (err) {
                console.error('发送快照文件出错:', err);
                res.status(500).send('无法提供快照文件');
            }
        });
    });
});
// 保存 RTSP 流到本地的路由
captureApp.get('/save-rtsp', (req, res) => {
    const saveRtspId = uuidv4();
    const saveFileName = `${saveRtspId}.mp4`;
    const saveFolder = path.join(__dirname, 'rtspSave');

    // 检查文件夹是否存在，如果不存在则创建
    if (!fs.existsSync(saveFolder)) {
        fs.mkdirSync(saveFolder, { recursive: true });
    }

    const saveFilePath = path.join(saveFolder, saveFileName);
    const saveCommand = `"D:/software/ffmpeg-7.0.2-full_build/bin/ffmpeg.exe" -i ${rtspUrl} -t 10 -c copy ${saveFilePath}`;

    exec(saveCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行命令时出错: ${error.message}`);
            res.status(500).send('保存 RTSP 流失败');
            return;
        }
        if (stderr) {
            console.log(`命令执行过程中的错误信息: ${stderr}`);
        }
        res.sendFile(saveFilePath,  (err) => {
            if (err) {
                console.error('发送视频文件出错:', err);
                res.status(500).send('无法提供视频文件');
            }
        });
    });
});
const port = 3001;
captureApp.listen(port, () => {
    console.log(`Capture 服务运行在 http://localhost:${port}`);
});