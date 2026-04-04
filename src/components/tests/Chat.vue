<template>
  <div class="container">
    <h2>Libp2p P2P 音视频传输 Demo</h2>

    <div class="video-box">
      <div>
        <h3>本地摄像头</h3>
        <video ref="localVideo" autoplay muted playsinline></video>
      </div>
      <div>
        <h3>P2P 接收画面</h3>
        <video ref="remoteVideo" autoplay playsinline></video>
      </div>
    </div>

    <div class="controls">
      <button @click="startCamera" :disabled="isCameraRunning">开启摄像头</button>
      <button @click="initP2P" :disabled="isP2PInitialized">初始化P2P节点</button>
      <button @click="startStream" :disabled="!isP2PInitialized || !isCameraRunning">
        启动P2P传输
      </button>
      <p>本地PeerID: {{ peerId }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invoke, channel } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event'

// DOM引用
const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

// 状态
const peerId = ref('')
const isCameraRunning = ref(false)
const isP2PInitialized = ref(false)
let mediaRecorder: MediaRecorder | null = null
let remoteStream: MediaSource | null = null
let sourceBuffer: SourceBuffer | null = null

// 开启摄像头+麦克风
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    if (localVideo.value) localVideo.value.srcObject = stream

    // 初始化MediaRecorder（WebRTC采集→二进制传输）
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8'
    })

    mediaRecorder.ondataavailable = async (e) => {
      if (!e.data.size) return
      const buffer = await e.data.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      // 发送到Rust后端→P2P传输
      await invoke('send_video_data', { data: Array.from(bytes) })
    }

    isCameraRunning.value = true
  } catch (err) {
    alert('权限错误：' + err)
  }
}

// 初始化Libp2P节点
const initP2P = async () => {
  const id = await invoke('init_p2p_node')
  peerId.value = id as string
  isP2PInitialized.value = true

  // 监听Rust回传的P2P视频数据
  const videoChannel = channel<Vec<u8>>('video-channel')
  await invoke('listen_video_data', { callback: videoChannel })

  // 初始化MediaSource渲染远端视频
  remoteStream = new MediaSource()
  if (remoteVideo.value) {
    remoteVideo.value.src = URL.createObjectURL(remoteStream)
  }

  remoteStream.addEventListener('sourceopen', () => {
    sourceBuffer = remoteStream!.addSourceBuffer('video/webm;codecs=vp8')
  })

  videoChannel.onmessage = async (data) => {
    if (!sourceBuffer || sourceBuffer.updating) return
    sourceBuffer.appendBuffer(new Uint8Array(data))
  }
}

// 启动推流
const startStream = () => {
  if (mediaRecorder) mediaRecorder.start(100)
}
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.video-box {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}
video {
  width: 400px;
  height: 300px;
  background: #000;
  border-radius: 8px;
}
.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}
button {
  padding: 10px 16px;
  background: #4a6cf7;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>