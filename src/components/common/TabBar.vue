<!-- src/components/common/TabBar.vue -->
<template>
  <nav
    class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white px-4 py-2 md:static md:flex md:h-full md:w-24 md:flex-col md:items-center md:justify-start md:border-t-0 md:border-r"
    id="main-nav">
    <div class="flex justify-around md:flex-col md:space-y-8 md:pt-6">
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

<style scoped>
:root {
  --tabbar-active-color: v-bind(activeColor);
}

.bg-primary {
  background-color: var(--tabbar-active-color);
}

button.opacity-100 .icon,
button.opacity-100 span {
  color: var(--tabbar-active-color);
}

button.opacity-60 {
  cursor: pointer;
}

button.opacity-60:hover {
  opacity: 0.8;
}
</style>
