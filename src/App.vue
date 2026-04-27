<!-- src/App.vue -->
<template>
  <RouterView></RouterView>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
onMounted(async () => {
    router.push({
      name: 'global-auth',
  });
});
</script>

