<template>
  <div class="flex h-screen flex-col overflow-hidden sm:flex-row">
    <!-- PC端：Header + Search + TabBar 位于第一列 -->
    <div class="hidden sm:flex sm:w-64 sm:flex-col border-r p-4">
      <HeaderPc></HeaderPc>

      <!-- 搜索框 -->
      <div class="relative mt-4 w-full">
        <!-- 你提供的 FontAwesome 搜索图标（已居中） -->
        <font-awesome-icon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" icon="fa-solid fa-magnifying-glass"
          style="color: #9e9e9e;" />
        <!-- 搜索输入框（左侧留空，文字垂直居中） -->
        <input
          class="w-full rounded-full bg-gray-100 pl-10 pr-4 py-2 border border-brand-300 focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
          placeholder="搜索" type="text" />
      </div>

      <!-- 导航栏（对应移动端底部导航） -->
      <div class="mt-6 flex flex-col gap-4">
        <button>消息</button>
        <button>联系人</button>
        <button>我的</button>
      </div>
    </div>

    <!-- 移动端 Header -->
    <HeaderMobile></HeaderMobile>

    <!-- 第二列：会话列表（移动端、PC共用） -->
    <div class="scrollbar-hide flex-1 overflow-y-auto sm:max-w-xs border-r">
      <!-- <ul class="divide-y p-2">
        <li class="flex items-center gap-3 p-3">
          <img class="h-10 w-10 rounded-full" :src="logo" />
          <div class="overflow-hidden">
            <p class="font-medium">name</p>
            <p class="truncate text-sm text-gray-500">person@email.com</p>
          </div>
        </li>
      </ul> -->
      <RouterView></RouterView>
    </div>

    <!-- PC端：内容显示区 -->
    <div class="hidden flex-1 items-center justify-center sm:flex">
      内容区域
    </div>

    <!-- 移动端：底部导航 -->
    <TabBar></TabBar>
  </div>


</template>
<script setup lang="ts">
// import CommonHeader from '@/components/common/Header/CommonHeader.vue';
// import HeaderPc from '@/components/common/Header/HeaderMobile.vue';
import HeaderMobile from '@/components/common/Header/HeaderMobile.vue';
import HeaderPc from '@/components/common/Header/HeaderPc.vue';

import TabBar from '@/components/common/TabBar.vue';

</script>