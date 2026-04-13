<!-- src/plugins/message/components/MessageInput.vue -->
<template>
  <div
    class="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700"
  >
    <input
      v-model="inputContent"
      type="text"
      placeholder="输入消息..."
      class="flex-1 px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
      @keyup.enter="handleSend"
    />
    <button
      @click="handleSend"
      class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      :disabled="!inputContent.trim()"
    >
      发送
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 组件 Props
interface Props {
  onSend: (content: string) => void; // 发送消息的回调
}

const props = defineProps<Props>();

// 输入框内容
const inputContent = ref('');

// 发送消息
const handleSend = () => {
  const content = inputContent.value.trim();
  if (!content) return;

  // 调用父组件回调
  props.onSend(content);

  // 清空输入框
  inputContent.value = '';
};
</script>
