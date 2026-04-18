<template>
  <div class="h-full bg-white overflow-y-auto">
    <div
      v-for="session in sessionList"
      :key="session.id"
      class="flex items-center gap-4 px-4 py-3 cursor-pointer"
      :class="{
        'bg-bg-primary-second': currentSessionId === session.id
      }"
      @click="openChat(session.id)"
    >
      <!-- 头像 -->
      <img
        :src="session.avatar"
        :alt="session.title"
        class="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#50328f]"
      />

      <!-- 标题 + 最后一条消息 -->
      <div class="flex-1 min-w-0">
        <div class="text-lg font-semibold text-black mb-1 truncate">
          {{ session.title }}
        </div>
        <div class="text-sm text-gray-400 truncate">
          {{ session.lastMsg }}
        </div>
      </div>

      <!-- 时间 + 未读角标 -->
      <div class="flex flex-col items-end gap-2">
        <div class="text-xs text-gray-400">{{ session.time }}</div>

        <div
          v-if="session.unread && session.unread > 0"
          class="bg-[#50328f] text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center"
        >
          {{ session.unread > 99 ? '99+' : session.unread }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useMessageStore } from '../stores/index'

const msgStore = useMessageStore()
const router = useRouter()

const { sessionList, currentSessionId } = storeToRefs(msgStore)

// 初始化会话列表
msgStore.initSessionList()

// 进入聊天详情
const openChat = (id: string) => {
  msgStore.initMessageList(id)
  router.push({
    name: 'test-detail',
    params: { id }
  })
}
</script>