<template>
  <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
    <!-- GitHub Logo -->
    <div class="flex flex-col items-center mb-16">
      <div class="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6">
        <IconFont name="logo" class="text-12xl text-gray-900"></IconFont>
      </div>
      <div class="text-2xl font-bold text-white">解锁 GitHub</div>
    </div>

    <!-- 生物识别按钮 -->
    <button
      class="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-md py-4 bg-gray-100 text-gray-900 text-base font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
      @click="handleBiometricUnlock">
      使用生物识别
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authApp } from '@/components/auth/index.ts'
import { useAppConfigStore } from '@/stores/appConfig'

const appConfigStore = useAppConfigStore()
const router = useRouter();


onMounted(() => {
  if (appConfigStore.lastRoute == '/') {
    appConfigStore.setLastRoute('/message')
  }
  handleBiometricUnlock()
})

const handleBiometricUnlock = async () => {
  const isMobile = appConfigStore.isMobile;

  if (isMobile) {
    console.log("移动端");
    console.log("当前路由：" + appConfigStore.lastRoute);
    authApp().then(() => {
      appConfigStore.auth = true;
      router.push(appConfigStore.lastRoute);
    }).catch(() => {
      console.log('解锁失败');
    });
  }
  else {
    appConfigStore.auth = true;
    router.push(appConfigStore.lastRoute);
    console.log("PC端");

  }


};
</script>