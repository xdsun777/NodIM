import type { App } from 'vue';

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { platform } from '@tauri-apps/plugin-os';
import type { AppConfig } from './type';

function safePlatform(): string {
  try {    
    return platform();
  } catch {
    return 'test';
  }
}

export const useAppConfigStore = defineStore('appConfig', () => {
  const peerID = ref<string>('');
  const avatarUrl = ref<string>('');
  const platform = ref<string>(safePlatform() || 'test');
  const auth = ref<boolean>(false);
  const lastRoute = ref<string>('/');
  const activePlugin = ref<string>('message');
  const theme = ref<'light' | 'dark' | 'auto'>('auto');
  const language = ref<'zh-CN' | 'en-US'>('zh-CN');
  const notifications = ref({
    enabled: true,
    sound: true,
    vibration: false,
  });
  const appearance = ref({
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    showAvatar: true,
    showOnlineStatus: true,
  });
  const privacy = ref({
    lastSeen: true,
    readReceipts: true,
  });
  const autoLogin = ref<boolean>(false);
  const version = ref<string>('1.0.0');

  const isMobile = computed(() => {
    return platform.value === 'android' || platform.value === 'ios';
  });

  const isDesktop = computed(() => {
    return (
      platform.value === 'windows' ||
      platform.value === 'macos' ||
      platform.value === 'linux'
    );
  });

  const isDarkMode = computed(() => {
    if (theme.value === 'dark') return true;
    if (theme.value === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const themeClass = computed(() => {
    return isDarkMode.value ? 'dark-theme' : 'light-theme';
  });

  const notificationsDisabled = computed(() => {
    return !notifications.value.enabled;
  });

  function setTheme(newTheme: 'light' | 'dark' | 'auto') {
    theme.value = newTheme;
    updateThemeClass();
  }

  function setLanguage(newLanguage: 'zh-CN' | 'en-US') {
    language.value = newLanguage;
  }

  function toggleNotifications(enabled: boolean) {
    notifications.value.enabled = enabled;
  }

  function setFontSize(size: 'small' | 'medium' | 'large') {
    appearance.value.fontSize = size;
  }

  function toggleAutoLogin(enabled: boolean) {
    autoLogin.value = enabled;
  }

  function setLastRoute(route: string) {
    lastRoute.value = route;
  }

  function setActivePlugin(pluginName: string) {
    activePlugin.value = pluginName;
  }

  function updateThemeClass() {
    document.documentElement.classList.toggle('dark', isDarkMode.value);
  }

  function setPeerID(id: string) {
    peerID.value = id;
  }

  function setAvatarUrl(url: string) {
    avatarUrl.value = url;
  }

  function resetToDefaults() {
    peerID.value = '';
    avatarUrl.value = '';
    lastRoute.value = '/';
    activePlugin.value = 'message';
    theme.value = 'auto';
    language.value = 'zh-CN';
    notifications.value = {
      enabled: true,
      sound: true,
      vibration: false,
    };
    appearance.value = {
      fontSize: 'medium',
      showAvatar: true,
      showOnlineStatus: true,
    };
    privacy.value = {
      lastSeen: true,
      readReceipts: true,
    };
    autoLogin.value = false;
    updateThemeClass();
  }

  function loadConfig(config: Partial<AppConfig>) {
    if (config.peerID !== undefined) peerID.value = config.peerID;
    if (config.avatarUrl !== undefined) avatarUrl.value = config.avatarUrl;
    if (config.lastRoute !== undefined) lastRoute.value = config.lastRoute;
    if (config.activePlugin !== undefined) activePlugin.value = config.activePlugin;
    if (config.theme !== undefined) theme.value = config.theme;
    if (config.language !== undefined) language.value = config.language;
    if (config.notifications !== undefined) notifications.value = { ...notifications.value, ...config.notifications };
    if (config.appearance !== undefined) appearance.value = { ...appearance.value, ...config.appearance };
    if (config.privacy !== undefined) privacy.value = { ...privacy.value, ...config.privacy };
    if (config.autoLogin !== undefined) autoLogin.value = config.autoLogin;
    updateThemeClass();
  }

  return {
    peerID,
    avatarUrl,
    platform,
    auth,
    lastRoute,
    activePlugin,
    theme,
    language,
    notifications,
    appearance,
    privacy,
    autoLogin,
    version,
    isMobile,
    isDesktop,
    isDarkMode,
    themeClass,
    notificationsDisabled,
    setTheme,
    setLanguage,
    toggleNotifications,
    setFontSize,
    toggleAutoLogin,
    setLastRoute,
    setActivePlugin,
    updateThemeClass,
    resetToDefaults,
    loadConfig,
    setPeerID,
    setAvatarUrl,
  };
}, {
  persist: {
    key: 'nodim-app-config',
    storage: localStorage,
    pick: ['peerID', 'avatarUrl', 'platform', 'lastRoute', 'activePlugin', 'theme', 'language', 'notifications', 'appearance', 'privacy', 'autoLogin', 'version'],
  },
});

export function setAppConfig(app: App) {
  const store = useAppConfigStore();
  store.updateThemeClass();
  app.config.globalProperties.$appConfig = store;
}

export type AppConfigStore = ReturnType<typeof useAppConfigStore>;