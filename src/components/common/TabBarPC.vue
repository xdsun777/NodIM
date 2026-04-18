<!-- src/components/common/TabBarPC.vue -->
<template>
  <nav class="mt-6 flex w-full flex-col gap-1">
    <button
      v-for="plugin in pluginList"
      :key="plugin.name"
      :class="[
        'flex items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-all',
        isActive(plugin.name)
          ? 'bg-primary text-white'
          : 'text-text-primary-second hover:bg-gray-100'
      ]"
      @click="handleTabClick(plugin.name)"
    >
      <IconFont :name="plugin.icon" class="text-lg" />
      <span class="text-sm font-medium whitespace-nowrap">{{ plugin.title }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { pluginManager } from '@/core/plugin'
import type { PluginMeta } from '@/core/plugin/type'

interface Props {
  plugins?: PluginMeta[]
  visible?: boolean
  activeColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  activeColor: 'rgb(59, 130, 246)',
})

const router = useRouter()
const route = useRoute()

const pluginList = computed<PluginMeta[]>(() => {
  return props.plugins && props.plugins.length > 0
    ? props.plugins
    : pluginManager
        .getPlugins()
        .map((p) => p.meta)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
})

const isActive = (pluginName: string) => route.path.startsWith(`/${pluginName}`)

const handleTabClick = (pluginName: string) => {
  router.push(`/${pluginName}`)
  pluginManager.activate(pluginName)
}

watch(
  () => route.path,
  () => {
    pluginList.value.forEach((plugin) => {
      if (!isActive(plugin.name)) pluginManager.deactivate(plugin.name)
    })
  },
  { immediate: true }
)
</script>