<!-- src/components/common/TabBar.vue -->
<template>
  <nav class="p-0.5 fixed bottom-4 left-1/2 -translate-x-1/2
           w-[70vw]
           flex items-center
           rounded-full
           border-2 border-primary/10 bg-bg-primary/60
            sm:hidden shadow-lg ">
    <button v-for="plugin in pluginList" :key="plugin.name" :class="{
      'text-primary': !isActive(plugin.name),
      'bg-primary text-white': isActive(plugin.name),
    }" @click="handleTabClick(plugin.name)"
      class="flex-1  flex flex-col items-center justify-center gap-0.5 rounded-full transition-all">
      <IconFont :name="plugin.icon" class="text-md font-[1000]" />
      <span class="text-xs font-medium">{{ plugin.title }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { pluginManager } from "@/core/plugin";
import type { PluginMeta } from "@/core/plugin/type";
import { useAppConfigStore } from '@/stores/appConfig'

const router = useRouter();
const route = useRoute();
const appConfigStore = useAppConfigStore()

onMounted(async () => {

  if (route.path == '/') {
    router.push(appConfigStore.activePlugin);
  }

  if (!appConfigStore.auth) {
    router.push({
      name: 'global-auth',
    });
  }
});



interface Props {
  plugins?: PluginMeta[];
  visible?: boolean;
  activeColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  activeColor: "rgb(59, 130, 246)",
});



const pluginList = computed<PluginMeta[]>(() => {
  return props.plugins && props.plugins.length > 0
    ? props.plugins
    : pluginManager
      .getPlugins()
      .map((p) => p.meta)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
});

const isActive = (pluginName: string) => route.path.startsWith(`/${pluginName}`);

// 定义抛出事件
const emit = defineEmits<{
  tabChange: [plugin: PluginMeta] // 抛出当前切换的插件信息
}>()

const handleTabClick = (pluginName: string) => {
  router.push(`/${pluginName}`);
  pluginManager.activate(pluginName);

  appConfigStore.activePlugin = pluginName; // 更新当前激活的插件

  // 找到当前点击的 plugin 并抛出事件
  const currentPlugin = pluginList.value.find(p => p.name === pluginName)
  if (currentPlugin) {
    emit('tabChange', currentPlugin)
  }
};

watch(
  () => route.path,
  () => {
    pluginList.value.forEach((plugin) => {
      if (!isActive(plugin.name)) pluginManager.deactivate(plugin.name);
    });
  },
  { immediate: true }
);
</script>