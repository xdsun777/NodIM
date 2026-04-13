<!-- src/plugins/message/components/MessageBubble.vue -->
<template>
  <div
    class="flex mb-3"
    :class="{
      'justify-end': msg.sender === 'me',
      'justify-start': msg.sender !== 'me',
    }"
  >
    <!-- 头像（仅对方显示） -->
    <img
      v-if="msg.sender !== 'me' && avatar"
      :src="avatar"
      alt="avatar"
      class="w-8 h-8 rounded-full mr-2 self-end"
    />

    <!-- 消息内容 -->
    <div
      class="max-w-[70%] px-3 py-2 rounded-lg"
      :class="{
        'bg-blue-500 text-white': msg.sender === 'me',
        'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white':
          msg.sender !== 'me',
      }"
    >
      <p class="text-sm">{{ msg.content }}</p>
      <span class="text-xs opacity-70 block mt-1 text-right">
        {{ msg.time }}
      </span>
    </div>

    <!-- 头像（仅自己显示） -->
    <img
      v-if="msg.sender === 'me' && myAvatar"
      :src="myAvatar"
      alt="my avatar"
      class="w-8 h-8 rounded-full ml-2 self-end"
    />
  </div>
</template>

<script setup lang="ts">
import type { MessageItem } from '../stores/contact';

// 组件 Props
interface Props {
  msg: MessageItem;
  avatar?: string; // 对方头像
  myAvatar?: string; // 自己头像
}

defineProps<Props>();
</script>
