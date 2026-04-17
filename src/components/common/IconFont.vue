<template>
  <i 
    class="iconfont" 
    :class="[`icon-${name}`, $attrs.class]" 
  />
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    required: true
  }
})
</script>