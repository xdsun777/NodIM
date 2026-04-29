<template>
  <div class="h-full bg-bg-primary overflow-y-auto">
    <div class="flex flex-col items-center mt-8">
      <div class="w-24 h-24 rounded-full border-4 border-primary overflow-hidden">
        <img alt="用户头像" class="w-full h-full object-cover" :src="avatarUrl" />
      </div>
      <!-- <h2 class="mt-3 text-xl font-medium text-text-primary">李明</h2> -->
    </div>

    <div class="mt-8 px-4">
      <div class="bg-bg-primary rounded-lg shadow-sm">
        <!-- 主题切换 -->
        <div class="flex items-center px-4 py-4 cursor-pointer hover:bg-bg-second transition-colors"
          @click="showThemeModal = true">
          <IconFont name="a-waiguan"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium flex-1">主题</span>
          <span class="text-text-second text-sm">{{ themeLabel }}</span>
          <IconFont name="youjiantou" class="w-5 h-5 text-text-second"></IconFont>
        </div>
        <!-- 二维码 -->
        <div class="flex items-center px-4 py-4" @click="showQrcode = true">
          <IconFont name="a-wodePeerIDerweima"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium"> 我的二维码 </span>
        </div>
        <!-- <div class="flex items-center px-4 py-4">
          <IconFont name="shezhi"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium"> 设置 </span>
        </div> -->
        <div class="flex items-center px-4 py-4" @click="showAbout = true">
          <IconFont name="guanyu"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium"> 关于 </span>
        </div>
      </div>
    </div>


    <!-- 二维码弹窗 -->
    <Transition name="modal">
      <div v-if="showQrcode" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showQrcode = false">
        <div class="bg-bg-primary rounded-xl p-6 w-full max-w-sm">
          <!-- 头部 -->
          <div class="flex items-center justify-between mb-6">
            <span class="text-text-primary font-medium">我的二维码</span>
            <button @click="showQrcode = false" class="text-text-second hover:text-text-primary">
              <IconFont name="guanbi" class="w-6 h-6"></IconFont>
            </button>
          </div>

          <!-- 二维码内容 -->
          <div class="flex flex-col items-center">
            <!-- 二维码图片 -->
            <div class="bg-white rounded-lg mb-4">
              <qrcode :value="qrValue" :size="180" level="H" type="image/png" :color="{ dark: '#50328f', light: '#ffffff' }" />
            </div>

            <!-- 描述文字 -->
            <p class="text-text-second text-sm text-center mb-2">扫码添加好友</p>
            <!-- <p class="text-text-second text-xs text-center">{{ appConfigStore.peerID || '未设置 PeerID' }}</p> -->
          </div>

          <!-- 底部操作 -->
          <button @click="copyPeerID"
            class="w-full mt-6 py-2 bg-primary text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity">
            {{ copyMessage }}
          </button>
        </div>
      </div>
    </Transition>



    <!-- 主题选择弹窗 -->
    <Transition name="modal">
      <div v-if="showThemeModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showThemeModal = false">
        <div class="bg-bg-primary rounded-xl w-full max-w-sm overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <span class="text-text-primary font-medium">选择主题</span>
            <button @click="showThemeModal = false" class="text-text-second hover:text-text-primary">
              <IconFont name="guanbi" class="w-6 h-6"></IconFont>
            </button>
          </div>
          <div class="p-2">
            <button v-for="theme in themes" :key="theme.value" @click="selectTheme(theme.value)"
              class="w-full flex items-center px-4 py-3 rounded-lg hover:bg-bg-second transition-colors">
              <div class="w-8 h-8 rounded-full mr-3" :class="theme.colorClass"></div>
              <span class="text-text-primary flex-1">{{ theme.label }}</span>
              <IconFont v-if="appConfigStore.theme === theme.value" name="duigou" class="w-5 h-5 text-primary">
              </IconFont>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 关于弹窗 -->
    <Transition name="modal">
      <div v-if="showAbout" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showAbout = false">
        <div class="bg-bg-primary rounded-xl w-full max-w-sm overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <span class="text-text-primary font-medium">关于</span>
            <button @click="showAbout = false" class="text-text-second hover:text-text-primary">
              <IconFont name="guanbi" class="w-6 h-6"></IconFont>
            </button>
          </div>
          <div class="p-6">
            <div class="flex flex-col items-center">
              <IconFont name="logo" class="w-16 h-16 mb-4"></IconFont>
              <h3 class="text-text-primary font-medium text-lg mb-1">NodIM</h3>
              <p class="text-text-second text-sm mb-4">版本 1.0.0</p>
              <div class="w-full space-y-3">
                <p class="text-text-second text-xs leading-relaxed">
                  NodIM 是一款基于 NodP2P 协议的去中心化即时通讯应用，致力于为用户提供安全、私密的通讯体验。
                </p>
                <p class="text-text-second text-xs leading-relaxed">
                  采用先进的点对点技术，无需服务器中转，数据直接在局域网内用户设备间传输，保护您的隐私安全。
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-border w-full text-center">
                <p class="text-text-second text-xs">© 2026 NodIM. 4C.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { avatar } from '@/utils/tools'
import { useAppConfigStore } from '@/stores/appConfig'
import { eventBus } from '@/core/event'
import Qrcode from 'vue-qrcode'

onMounted(() => {
  avatarUrl.value = avatar(appConfigStore.peerID)
  // appConfigStore.peerID = '123aaaaaaa456'
  initQRCode()
})

const appConfigStore = useAppConfigStore()
const avatarUrl = ref('')
const showThemeModal = ref(false)
const qrValue = ref('')
const showQrcode = ref(false)
const showAbout = ref(false)

const themes = [
  { value: 'light' as const, label: '浅色模式', colorClass: 'bg-gray-100 border border-gray-300' },
  { value: 'dark' as const, label: '深色模式', colorClass: 'bg-gray-900 border border-gray-700' },
  { value: 'auto' as const, label: '跟随系统', colorClass: 'bg-gradient-to-r from-gray-100 to-gray-900 border border-gray-500' },
]
const themeLabel = computed(() => {
  const theme = themes.find(t => t.value === appConfigStore.theme)
  return theme ? theme.label : '浅色模式'
})
const selectTheme = (theme: 'light' | 'dark' | 'auto') => {
  appConfigStore.setTheme(theme)
  eventBus.emit('theme:change', theme)
  showThemeModal.value = false
}



// 初始化二维码值
const initQRCode = () => {
  if (appConfigStore.peerID) {
    qrValue.value = appConfigStore.peerID  
  }
  
}
const copyMessage = computed(() => {
  return appConfigStore.peerID ? '复制 PeerID' : '未设置 PeerID'
})
// 复制 PeerID
const copyPeerID = async () => {
  if (appConfigStore.peerID) {
    try {
      await navigator.clipboard.writeText(appConfigStore.peerID)
      // alert('已复制到剪贴板')
      
    } catch (err) {
      console.error('复制失败:', err)
    }
  }
}


</script>