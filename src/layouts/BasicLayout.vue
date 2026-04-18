<template>
  <div class="flex h-screen flex-col overflow-hidden sm:flex-row">
    <!-- PC端：Header + Search + TabBar 位于第一列 -->
    <div v-if="$systemInfo.platform == 'test' || $systemInfo.isDesktop" class="hidden sm:flex sm:w-auto sm:flex-col border-r p-4">
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
      <!-- <div class="mt-6 flex flex-col gap-4">
        <button>消息</button>
        <button>联系人</button>
        <button>我的</button>
      </div> -->
    </div>

    <!-- 移动端 Header -->
    <HeaderMobile v-if="$systemInfo.platform=='test' || $systemInfo.isMobile" ></HeaderMobile>

    <!-- 第二列：会话列表（移动端、PC共用） -->
    <div class="scrollbar-hide w-full overflow-y-auto border-r sm:w-auto sm:min-w-[280px] sm:max-w-sm">
      <RouterView></RouterView>
        <!-- <ul class="divide-y p-2">
          <li class="flex items-center gap-3 p-3">
            <img class="h-10 w-10 rounded-full" src="@/assets/logo/32x32.svg" />
            <div class="overflow-hidden">
              <p class="font-medium">name</p>
              <p class="truncate text-sm text-text-primary-second">person@email.com</p>
            </div>
          </li>
          <li class="flex items-center gap-3 p-3">
            <img class="h-10 w-10 rounded-full" src="@/assets/logo/32x32.svg" />
            <div class="overflow-hidden">
              <p class="font-medium">name</p>
              <p class="truncate text-sm text-text-primary-second">person@email.com</p>
            </div>
          </li>
        </ul>
        什么平台：{{ $systemInfo.isMobile}}-----{{ $systemInfo.platform }} -->
      
    </div>
    <!-- <div class="scrollbar-hide flex-1 overflow-y-auto sm:max-w-xs border-r">
      <RouterView>
        <ul class="divide-y p-2">
          <li class="flex items-center gap-3 p-3">
            <img class="h-10 w-10 rounded-full" src="@/assets/logo/32x32.svg" />
            <div class="overflow-hidden">
              <p class="font-medium">name</p>
              <p class="truncate text-sm text-text-primary-second">person@email.com</p>
            </div>
          </li>
        </ul>
        什么平台：{{ $systemInfo.isMobile }}
      </RouterView>
    </div> -->

    <!-- PC端：内容显示区 -->
    <div class="hidden flex-1 items-center justify-center sm:flex">
      内容区域
    </div>

    <!-- 移动端：底部导航 -->
    <TabBar></TabBar>
  </div>


</template>
<script setup lang="ts">
import HeaderMobile from '@/components/common/Header/HeaderMobile.vue';
import HeaderPc from '@/components/common/Header/HeaderPc.vue';

import TabBar from '@/components/common/TabBar.vue';
import TabBarPC from '@/components/common/TabBarPC.vue';


</script>