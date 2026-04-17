<!-- src/components/common/TabBar.vue -->
<template>
  <!-- <nav
    class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white px-4 py-2 sm:static sm:flex sm:h-full sm:w-24 sm:flex-col sm:items-center sm:justify-start sm:border-t-0 sm:border-r"
    id="main-nav">
    <div class="flex justify-around sm:flex-col sm:space-y-8 sm:pt-6">
      <button v-for="plugin in pluginList" :key="plugin.name" class="flex flex-col items-center py-2" :class="{
        'opacity-60': !isActive(plugin.name),
        'opacity-100': isActive(plugin.name),
      }" @click="handleTabClick(plugin.name)">
        <component :is="plugin.icon || 'i-heroicons-chat-bubble-oval-left-20-solid'" class="h-6 w-6 rounded-full" />
        <span class="mt-1 text-xs text-gray-500">{{ plugin.title }}</span>
        <div class="w-6 h-0.5 mt-1 rounded-full transition-all duration-200" :class="{
          'bg-primary': isActive(plugin.name),
          'bg-transparent': !isActive(plugin.name),
        }"></div>
      </button>
    </div>
  </nav> -->

  <nav class="p-0.5 fixed bottom-4 left-1/2 -translate-x-1/2
           w-[70vw]
           flex items-center
           rounded-full
           border-2 border-primary bg-white
            sm:hidden shadow-lg ">
    <button v-for="plugin in pluginList" :key="plugin.name" :class="{
      'text-[#50328f]': !isActive(plugin.name),
      'bg-[#50328f] text-white': isActive(plugin.name),
    }" @click="handleTabClick(plugin.name)"
      class="flex-1  flex flex-col items-center justify-center gap-1 rounded-full transition-all">
      <IconFont :name="plugin.icon" class="!text-md font-[1000]" />
      <span class="text-xs font-medium">{{ plugin.title }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
// 原有逻辑不变（仅样式修改）
import { computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { pluginManager } from "@/core/plugin";
import type { PluginMeta } from "@/core/plugin/type";
interface Props {
  plugins?: PluginMeta[];
  visible?: boolean;
  activeColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  activeColor: "rgb(59, 130, 246)",
});

const router = useRouter();
const route = useRoute();

const pluginList = computed<PluginMeta[]>(() => {
  return props.plugins && props.plugins.length > 0
    ? props.plugins
    : pluginManager
      .getPlugins()
      .map((p) => p.meta)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
});

const isActive = (pluginName: string) => route.path.startsWith(`/${pluginName}`);

const handleTabClick = (pluginName: string) => {
  router.push(`/${pluginName}`);
  pluginManager.activate(pluginName);
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