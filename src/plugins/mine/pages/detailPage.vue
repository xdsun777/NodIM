<template>
  <Transition name="chat">
    <div v-show="show" class="chat-page">
      <!-- 顶部 -->
      <div class="flex items-center gap-3 px-4 py-3 bg-[#111]">
        <button @click="back">
          <IconFont name="fanhui" class="text-xl text-white" />
        </button>
        <img :src="currentSession?.avatar" class="w-10 h-10 rounded-full" />
        <div class="text-white font-medium">{{ currentSession?.title }}</div>
      </div>

      <!-- 消息列表 -->
      <div class="flex-1 overflow-y-auto p-4 bg-black">
        <div
          v-for="msg in messageList"
          :key="msg.id"
          class="flex my-2"
          :class="{ 'justify-end': msg.sender === 'me' }"
        >
          <div
            v-if="msg.sender === 'other'"
            class="bg-[#222] text-white px-3 py-2 rounded-lg max-w-[75%]"
          >
            {{ msg.content }}
          </div>
          <div
            v-else
            class="bg-[#50328f] text-white px-3 py-2 rounded-lg max-w-[75%]"
          >
            {{ msg.content }}
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="p-3 bg-[#111]">
        <input
          v-model="content"
          @keyup.enter="send"
          class="w-full px-4 py-2 rounded-full bg-[#222] text-white"
          placeholder="输入消息..."
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMessageStore } from '../stores/index'

const route = useRoute()
const router = useRouter()
const store = useMessageStore()

const { messageList, currentSession } = storeToRefs(store)
const show = ref(false)
const content = ref('')

onMounted(() => {
  store.initMessageList(route.params.id)
  setTimeout(() => (show.value = true), 50)
})

const back = () => {
  show.value = false
  setTimeout(() => router.back(), 350)
}

const send = () => {
  store.sendMessage(content.value)
  content.value = ''
}
</script>

<style scoped>
.chat-page {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  flex-direction: column;
}

/* 动画：纸飞机效果 */
.chat-enter-from {
  transform: translateX(100%);
}
.chat-enter-active {
  transition: transform 0.35s ease;
}
.chat-leave-to {
  transform: translateX(100%);
}
.chat-leave-active {
  transition: transform 0.35s ease;
}
</style>