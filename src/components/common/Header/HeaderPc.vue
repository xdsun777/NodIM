<template>
      <div class="flex items-center gap-2">
        <img :src="logoSvg" class="h-8 w-8" />
        <h1 class="text-xl font-bold">Nodim</h1>
      </div>
</template>

<script setup lang="ts">
import logoSvg from '@/assets/logo/32x32.svg';
</script>