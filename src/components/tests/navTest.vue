<template>
    <!-- 导航栏：内部统一内边距，圆角最大 -->
    <nav class="p-0.5 fixed bottom-4 left-1/2 -translate-x-1/2
           w-[70vw]
           flex items-center
           rounded-full
           border-2 border-primary bg-white
            sm:hidden shadow-lg ">
        <!-- 消息 -->
        <button @click="activeTab = 'message'"
            class="flex-1  flex flex-col items-center justify-center gap-1 rounded-full transition-all"
            :class="activeTab === 'message' ? 'bg-[#50328f] text-white' : 'text-[#50328f]'">
            <IconFont name="xiaoxi" class="!text-md font-[1000]" />
            <span class="text-xs font-medium">消息</span>
        </button>

        <!-- 联系人 -->
        <button @click="activeTab = 'contact'"
            class="flex-1 h-full flex flex-col items-center justify-center gap-1 rounded-full transition-all"
            :class="activeTab === 'contact' ? 'bg-[#50328f] text-white' : 'text-[#50328f]'">
            <IconFont name="lianxiren" class="!text-md font-[1000]" />
            <span class="text-xs font-medium">联系人</span>
        </button>

        <!-- 我的 -->
        <button @click="activeTab = 'my'"
            class="flex-1  flex flex-col items-center justify-center gap-1 rounded-full transition-all"
            :class="activeTab === 'my' ? 'bg-[#50328f] text-white' : 'text-[#50328f]'">
            <IconFont name="lianxiren1" class="!text-md font-[1000]" />
            <span class="text-xs font-medium">我的</span>
        </button>
    </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeTab = ref('message')



</script>