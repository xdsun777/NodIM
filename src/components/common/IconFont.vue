<template>
  <img v-if="props.name == 'logo'" :src="logoSvg" :class="iconClass" />
  <i v-else class="iconfont" :class="[`icon-${name}`, iconClass]" />
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import logoSvg from '@/assets/logo/32x32.svg';

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const attrs = useAttrs();
const iconClass = computed(() => (attrs.class as string) || '');
</script>