<template>
  <!-- 整个页面100%占满浏览器视口，全屏覆盖 -->
  <div class="fixed inset-0 z-999 flex flex-col bg-[#f7f8fa]">
    <!-- 顶部导航栏（自己独立头部，不使用父布局的头部） -->
    <div class="flex items-center gap-3 px-4 py-3 bg-white border-b">
      <button @click="back">
        <IconFont name="fanhui" class="text-xl text-[#50328f]" />
      </button>
      <div class="flex flex-col">
        <div class="text-base font-medium">{{ currentSession?.title }}</div>
        <div class="text-xs text-[#50328f]">在线</div>
      </div>
    </div>

    <!-- 消息内容滚动区域（自适应占满剩余全部高度） -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="msg in messageList"
        :key="msg.id"
        class="flex"
        :class="{ 'justify-end': msg.sender === 'me' }"
      >
        <!-- 对方消息气泡 -->
        <div v-if="msg.sender === 'other'" class="flex items-start gap-2">
          <img
            :src="currentSession?.avatar"
            class="w-10 h-10 rounded-full border border-[#50328f]"
          />
          <div class="bg-white rounded-lg px-3 py-2 text-sm max-w-[75%] break-words">
            {{ msg.content }}
          </div>
        </div>

        <!-- 自己消息气泡 -->
        <div v-else class="flex items-start gap-2 flex-row-reverse">
          <img
            src="https://picsum.photos/id/1025/200"
            class="w-10 h-10 rounded-full border border-[#50328f]"
          />
          <div class="bg-[#50328f] text-white rounded-lg px-3 py-2 text-sm max-w-[75%] break-words">
            {{ msg.content }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入栏（自己独立底部，完全不显示你原来的底部导航） -->
    <div class="p-3 bg-white border-t">
      <div class="flex items-center gap-2">
        <input
          v-model="inputContent"
          placeholder="输入消息..."
          class="flex-1 px-4 py-2 rounded-full bg-gray-100 outline-none text-sm"
          @keyup.enter="send"
        />
        <button
          @click="send"
          class="bg-[#50328f] text-white px-4 py-2 rounded-full text-sm"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useMessageStore } from '../stores/index'

const route = useRoute()
const router = useRouter()
const msgStore = useMessageStore()

const { messageList, currentSession } = storeToRefs(msgStore)
const inputContent = ref('')

// 从路由参数获取会话ID
const sessionId = route.params.sessionId as string

// 页面挂载：初始化当前会话消息
onMounted(() => {
  msgStore.initMessageList(sessionId)
})

// 发送消息（完全复用你原本Pinia所有方法，自动回复、列表更新全部正常）
const send = () => {
  if (!inputContent.value.trim()) return
  msgStore.sendMessage(inputContent.value)
  inputContent.value = ''
}

// 返回上一页（回到消息列表插件页面）
const back = () => {
  router.back()
}
</script>