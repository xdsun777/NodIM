<template>
    <header class="flex flex-col gap-2 p-4 sm:hidden pt-safe">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <img :src="logoSvg" class="h-8 w-8" />
                <h1 class="text-xl font-bold">Nodim</h1>
            </div>
            <img :src="scanSvg" alt="扫描" class="h-6 w-6" />
        </div>
        <!-- 搜索框：我帮你改成了【带左侧图标的居中结构】 -->
        <div class="relative w-full">
            <!-- 左侧搜索图标 - 完美垂直居中 -->
            <!-- <font-awesome-icon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 " icon="fa-solid fa-magnifying-glass " style="color: #9e9e9e;" /> -->
            <IconFont name="sousuo" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 !text-[#9e9e9e]"></IconFont>
            <!-- 输入框：左边内边距留出图标位置，文字自动居中 -->
            <input
                class="w-full rounded-full bg-gray-100 pl-10 pr-4 py-2 border border-brand-300 focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
                placeholder="搜索" type="text" />
        </div>
    </header>
</template>
<script setup lang="ts">
import logoSvg from '@/assets/logo/32x32.svg';
import scanSvg from '@/assets/svg/header/scan.svg';
</script>