<template>
  <div class="h-full bg-white overflow-y-auto">
    <div class="flex flex-col items-center mt-8">
      <div class="w-24 h-24 rounded-full border-4 border-blue-500 overflow-hidden">
        <img alt="用户头像" class="w-full h-full object-cover" :src="avatarUrl" />
      </div>
      <h2 class="mt-3 text-xl font-medium text-gray-800">李明</h2>
    </div>

    <div class="mt-8 px-4">
      <div class="bg-white rounded-lg shadow-sm">
        <div class="flex items-center px-4 py-4">
          <IconFont name="waiguan"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium"> 外观 </span>
        </div>
        <div class="flex items-center px-4 py-4">
          <IconFont name="a-wodePeerIDerweima"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium"> 我的二维码 </span>
        </div>
        <div class="flex items-center px-4 py-4">
          <IconFont name="shezhi"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium"> 设置 </span>
        </div>
        <div class="flex items-center px-4 py-4">
          <IconFont name="guanyu"
            class="w-8 h-8 rounded-full text-md font-[1000] text-primary flex items-center justify-center mr-3">
          </IconFont>
          <span class="text-text-primary text-lg font-medium"> 关于 </span>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { avatar } from '@/utils/tools'
const avatarUrl = ref('')


onMounted(() => {
avatarUrl.value = avatar('123456')
})
</script>