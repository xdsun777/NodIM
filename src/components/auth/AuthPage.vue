<template>
  <div class="min-h-screen bg-bg-primary flex flex-col items-center justify-center pb-safe pt-safe">
    <!-- Logo区域 -->
    <div class="flex flex-col items-center mb-16">
      <div class="w-24 h-24 flex items-center justify-center mb-4">
        <IconFont name="logo" class="w-full h-full opacity-30"></IconFont>
      </div>
      <div class="text-lg font-bold text-text-primary">解锁 NodIM</div>
    </div>

    <!-- 生物识别按钮 -->
    <button
      class="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-md py-3 border-2 border-primary text-primary text-base font-medium rounded-full hover:bg-bg-primary transition-colors duration-200"
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
  appConfigStore.setTheme(appConfigStore.theme)


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