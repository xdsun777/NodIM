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
import { useAppConfigStore } from '@/stores/appConfig'
import { authenticate } from '@tauri-apps/plugin-biometric';

const appConfigStore = useAppConfigStore()
const router = useRouter();


// onMounted(async() => {
//   appConfigStore.setTheme(appConfigStore.theme)
//   if (appConfigStore.lastRoute == '/' || appConfigStore.lastRoute == '/auth') {
//     appConfigStore.setLastRoute('/message')
//   }
//   console.log("当前路由：" + appConfigStore.lastRoute);

//   if (!appConfigStore.isMobile) {
//     try {
//       console.log("解锁");
//       await authenticate('应用已锁', options);
//       appConfigStore.auth = true
      
//       router.push(appConfigStore.lastRoute)
//     } catch (error) {
//       console.error('生物识别验证失败:', error);
//     }
//   } else {
//     appConfigStore.auth = true
//     router.push(appConfigStore.lastRoute)
//   }

// })




const options = {
  allowDeviceCredential: true,
  // cancelTitle: "Feature won't work if Canceled",

  // 仅 iOS 平台的功能
  // fallbackTitle: 'Sorry, authentication failed',

  // 仅 Android 平台的功能
  title: 'NodIM 解锁',
  subtitle: '请使用生物识别解锁 NodIM',
  confirmationRequired: true,
};

const handleBiometricUnlock = async () => {
  console.log("尝试使用生物识别解锁 NodIM");
  
  try {
    await authenticate('应用已锁', options);
    appConfigStore.auth = true
    router.push(appConfigStore.lastRoute)
  } catch (error) {
    console.error('生物识别验证失败:', error);
  }
};

onMounted(async () => {
  handleBiometricUnlock()
})

</script>