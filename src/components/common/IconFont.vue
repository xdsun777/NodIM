<template>
  <img v-if="props.name == 'logo'" :src="logoSvg" class="h-8 w-8" />
  <i v-else class="iconfont" :class="[`icon-${name}`, $attrs.class]" />
</template>

<script setup lang="ts">
import logoSvg from '@/assets/logo/32x32.svg';

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})
</script>