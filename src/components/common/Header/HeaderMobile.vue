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
        <SearchMobile></SearchMobile>
    </header>
</template>
<script setup lang="ts">
import SearchMobile from '@/components/common/Search/SearchMobile.vue';
import logoSvg from '@/assets/logo/32x32.svg';
import scanSvg from '@/assets/svg/header/scan.svg';
</script>