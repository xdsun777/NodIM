<template>
  <div class="p2p-chat-container">
    <div class="header">
      <h2>📹 去中心化 P2P 视频聊天</h2>
      <button @click="toggleCamera" class="start-btn">
        {{ isStreaming ? '关闭摄像头' : '开启摄像头并传输' }}
      </button>
    </div>

    <div class="video-wrapper">
      <!-- 本地摄像头 -->
      <div class="video-box">
        <p class="label">本地画面</p>
        <video
          ref="localVideoRef"
          autoplay
          muted
          playsinline
          class="video-player"
        />
      </div>

      <!-- 远程 P2P 画面 -->
      <div class="video-box">
        <p class="label">远程画面</p>
        <video
          ref="remoteVideoRef"
          autoplay
          playsinline
          class="video-player"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
// import {
//   checkPermissions,
//   requestPermissions,
// } from '@tauri-apps/plugin-barcode-scanner';

// async function requestMediaPermissions() {
//   // 1. 检查状态
//   const state = await checkPermissions();
//   if (state === 'granted') return true;

//   // 2. 申请（CAMERA + RECORD_AUDIO 会一起弹）
//   const result = await requestPermissions();
//   return result === 'granted';
// }
// requestMediaPermissions()



// 视频 DOM 引用
const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRef = ref<HTMLVideoElement | null>(null)

// 状态
const isStreaming = ref(false)
let mediaStream: MediaStream | null = null
let sendFrameTimer: number | null = null
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!

// 配置
const VIDEO_WIDTH = 480
const VIDEO_HEIGHT = 360
const SEND_INTERVAL = 80 // 80ms = 12fps

// 打开/关闭摄像头
const toggleCamera = async () => {
  if (isStreaming.value) {
    stopCamera()
    return
  }

  try {
    // 获取摄像头权限
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT, frameRate: 15 },
      audio: false,
    })

    // 播放本地视频
    if (localVideoRef.value) {
      localVideoRef.value.srcObject = mediaStream
    }

    isStreaming.value = true
    startSendVideoFrame()
  } catch (err) {
    console.error('摄像头打开失败：', err)
    alert('无法访问摄像头，请检查权限')
  }
}

// 循环发送视频帧到 Rust
const startSendVideoFrame = () => {
  canvas.width = VIDEO_WIDTH
  canvas.height = VIDEO_HEIGHT

  const sendFrame = async () => {
    if (!isStreaming.value || !localVideoRef.value) return

    try {
      // 绘制视频到画布
      ctx.drawImage(localVideoRef.value, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT)

      // 转为 JPEG 二进制
      canvas.toBlob(
        async (blob) => {
          if (!blob) return
          const buffer = await blob.arrayBuffer()
          const data = Array.from(new Uint8Array(buffer))

          // 调用 Tauri Rust 命令 → 发送 P2P
          await invoke('send_video_frame', { data })
        },
        'image/jpeg',
        0.7
      )
    } catch (err) {
      console.warn('发送视频帧失败：', err)
    }

    sendFrameTimer = window.setTimeout(sendFrame, SEND_INTERVAL)
  }

  sendFrame()
}

// 停止摄像头
const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  if (sendFrameTimer) {
    clearTimeout(sendFrameTimer)
  }
  isStreaming.value = false
}

// 监听 Rust 发来的远程视频
const listenRemoteVideo = async () => {
  await listen('remote-video-frame', (event: { payload: number[] }) => {
    try {
      const uint8 = new Uint8Array(event.payload)
      const blob = new Blob([uint8], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)

      if (remoteVideoRef.value) {
        remoteVideoRef.value.src = url
      }
    } catch (err) {
      console.warn('播放远程视频失败：', err)
    }
  })
}

// 生命周期
onMounted(() => {
  listenRemoteVideo()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.p2p-chat-container {
  width: 100%;
  height: 100vh;
  background: #111827;
  color: #fff;
  padding: 24px;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.start-btn {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.start-btn:hover {
  background: #4338ca;
}

.video-wrapper {
  display: flex;
  gap: 20px;
}

.video-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-size: 16px;
  font-weight: 500;
}

.video-player {
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 12px;
  object-fit: cover;
}
</style>