<template>
  <div class="flex h-screen bg-bg-primary text-text-primary flex-col overflow-hidden sm:flex-row bg-[url('@/assets/logo/logo-bg.png')] bg-no-repeat" style="background-size: 120% auto; background-position: -190% 50%;">
    <!-- PC端：Header + Search + TabBar 位于第一列 -->
    <div v-if="$appConfig.platform == 'test' || $appConfig.isDesktop"
      class="hidden sm:flex sm:w-auto sm:flex-col border-r p-4">
      <HeaderPc></HeaderPc>

      <!-- 搜索框 -->
      <div class="relative mt-4 w-full">
        <IconFont name="sousuo" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 !text-[#9e9e9e]"></IconFont>

        <!-- 搜索输入框（左侧留空，文字垂直居中） -->
        <input
          class="w-full rounded-full bg-gray-100 pl-10 pr-4 py-2 border border-brand-300 focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
          placeholder="搜索" type="text" />
      </div>

      <!-- 导航栏（对应移动端底部导航） -->
      <TabBarPC></TabBarPC>
    </div>

    <!-- 移动端 Header -->
    <HeaderMobile v-if="$appConfig.platform == 'test' || $appConfig.isMobile">

      <template v-slot:leftIcon>
        <IconFont :name="headerConfig.leftIcon" class="h-6 w-6 font-[1000] text-primary" />
      </template>

      <template v-slot:title>
        <h1 class="text-xl font-bold">{{ headerConfig.title }}</h1>
      </template>

      <template v-slot:rightIcon>
        <IconFont :name="headerConfig.rightIcon" class="h-6 w-6 font-[1000] text-primary" />
      </template>

      <template v-slot:search>
        <component :is="headerConfig.search" />
      </template>
    </HeaderMobile>

    <!-- 第二列：会话列表（移动端、PC共用） -->
    <div class="scrollbar-hide w-full overflow-y-auto border-r sm:w-auto sm:min-w-[280px] sm:max-w-sm">
      <RouterView></RouterView>
    </div>

    <Transition name="chat-drawer">
      <div v-if="$route.name === 'test-detail'" class="chat-drawer-container">
        <RouterView :key="$route.fullPath" ></RouterView>
      </div>
    </Transition>

    <!-- PC端：内容显示区 -->
    <div class="hidden flex-1 items-center justify-center sm:flex">
      内容区域
    </div>

    <!-- 移动端：底部导航 -->
    <TabBar @tab-change="onTabChange" />
  </div>


</template>
<script setup lang="ts">
import type { Component } from 'vue'
import { ref, markRaw,onMounted } from 'vue'

import type { PluginMeta } from '@/core/plugin/type'

import HeaderPc from '@/components/common/Header/HeaderPc.vue';
import HeaderMobile from '@/components/common/Header/HeaderMobile.vue';
import SearchMobile from '@/components/common/Search/SearchMobile.vue'

import TabBar from '@/components/common/TabBar.vue';
import TabBarPC from '@/components/common/TabBarPC.vue';

import { pluginManager } from '@/core/plugin/index';
import { useAppConfigStore } from '@/stores/appConfig/index';
const appConfig = useAppConfigStore()

interface HeaderData {
  leftIcon: string
  title: string
  rightIcon: string
  search: Component | null
}
const headerConfig = ref<HeaderData>({
  leftIcon: 'logo',
  title: 'Nodim',
  rightIcon: 'saoyisao',
  search: markRaw(SearchMobile), 
})

onMounted(() => {
  const pluginName = appConfig.activePlugin
  // console.log(pluginName);
  const pluginMeta = pluginManager.getPluginMeta(pluginName)
  onTabChange(pluginMeta!)
})

// 监听 TabBar 点击
const onTabChange = (plugin: PluginMeta) => {
  // ——————————————————
  // 在这里动态改头部！
  // ——————————————————
  headerConfig.value.title = plugin.headerData.title // 标题 = 插件名称
  headerConfig.value.leftIcon = plugin.headerData.leftIcon // 图标 = 插件图标
  headerConfig.value.rightIcon = plugin.headerData.rightIcon
  if (plugin.headerData.search != null) {
    headerConfig.value.search = markRaw(plugin.headerData.search)
  } else {
    headerConfig.value.search = null
  }
}
</script>
<style>
/* ========== Tailwind 原生自定义动画 1:1复刻Telegram动画 ========== */
/* 入场：从右侧滑入 */
.chat-drawer-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.chat-drawer-enter-active {
  transition: all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.chat-drawer-enter-to {
  transform: translateX(0);
  opacity: 1;
}

/* 退场（返回）：向右滑出收缩消失 就是你截图里的效果！ */
.chat-drawer-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.chat-drawer-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.chat-drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>