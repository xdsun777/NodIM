<!-- src/components/common/TabBar.vue -->
<template>
  <nav class="p-0.5 fixed bottom-4 left-1/2 -translate-x-1/2
           w-[70vw]
           flex items-center
           rounded-full
           border-2 border-primary bg-bg-primary
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