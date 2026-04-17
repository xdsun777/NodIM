<template>
  <img
    :src="src"
    :class="[size, customClass]"
    class="inline-block align-middle flex-shrink-0"
    alt="icon"
  />
</template>

<script setup lang="ts">
interface SvgIconProps {
  // 传入 import 的 SVG 路径
  src: string
  // 控制大小：w-4 / w-5 / w-6 / h-4 等
  size?: string
  // 自定义 class
  class?: string
}

const props = withDefaults(defineProps<SvgIconProps>(), {
  size: 'w-5 h-5',
  class: '',
})
</script>

<style scoped>
img {
  object-fit: contain;
  vertical-align: middle;
}
</style>