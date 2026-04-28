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
  // ============ 基础信息 ============
  const peerID = ref<string>('');
  const avatarUrl = ref<string>('');
  const identityKey = ref<string>('');
  const platform = ref<string>(safePlatform() || 'test');
  const version = ref<string>('1.0.0');
  const status = ref<'online' | 'offline' | 'away'>('offline');

  // ============ 认证状态 ============
  const auth = ref<boolean>(false);
  const autoLogin = ref<boolean>(false);
  const lastAuthTime = ref<number>(0);

  // ============ UI 状态 ============
  const lastRoute = ref<string>('/');
  const activePlugin = ref<string>('message');
  const theme = ref<'light' | 'dark' | 'auto'>('auto');
  const language = ref<'zh-CN' | 'en-US'>('zh-CN');

  // ============ 通知设置 ============
  const notifications = ref({
    enabled: true,
    sound: true,
    vibration: false,
    preview: true,
  });

  // ============ 外观设置 ============
  const appearance = ref({
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    showAvatar: true,
    showOnlineStatus: true,
    showReadReceipts: true,
    compactMode: false,
  });

  // ============ 隐私设置 ============
  const privacy = ref({
    lastSeen: true,
    readReceipts: true,
    typingIndicator: true,
    onlineStatus: true,
  });

  // ============ 网络设置 ============
  const network = ref({
    autoConnect: true,
    maxPeers: 20,
    enableRelay: true,
    enableMDNS: true,
  });

  // ============ 计算属性 ============
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

  // ============ 主题设置 ============
  function setTheme(newTheme: 'light' | 'dark' | 'auto') {
    theme.value = newTheme;
    updateThemeClass();
  }

  // ============ 状态设置 ============
  function setStatus(newStatus: 'online' | 'offline' | 'away') {
    status.value = newStatus;
  }

  // ============ 语言设置 ============
  function setLanguage(newLanguage: 'zh-CN' | 'en-US') {
    language.value = newLanguage;
  }

  // ============ 通知设置 ============
  function toggleNotifications(enabled: boolean) {
    notifications.value.enabled = enabled;
  }

  function setNotificationSound(enabled: boolean) {
    notifications.value.sound = enabled;
  }

  function setNotificationVibration(enabled: boolean) {
    notifications.value.vibration = enabled;
  }

  // ============ 外观设置 ============
  function setFontSize(size: 'small' | 'medium' | 'large') {
    appearance.value.fontSize = size;
  }

  function toggleCompactMode(enabled: boolean) {
    appearance.value.compactMode = enabled;
  }

  function toggleShowAvatar(enabled: boolean) {
    appearance.value.showAvatar = enabled;
  }

  // ============ 隐私设置 ============
  function toggleLastSeen(enabled: boolean) {
    privacy.value.lastSeen = enabled;
  }

  function toggleReadReceipts(enabled: boolean) {
    privacy.value.readReceipts = enabled;
    appearance.value.showReadReceipts = enabled;
  }

  function toggleOnlineStatus(enabled: boolean) {
    privacy.value.onlineStatus = enabled;
    appearance.value.showOnlineStatus = enabled;
  }

  // ============ 网络设置 ============
  function setAutoConnect(enabled: boolean) {
    network.value.autoConnect = enabled;
  }

  function setMaxPeers(count: number) {
    network.value.maxPeers = Math.min(Math.max(count, 5), 100);
  }

  // ============ 自动登录 ============
  function toggleAutoLogin(enabled: boolean) {
    autoLogin.value = enabled;
  }

  // ============ 路由管理 ============
  function setLastRoute(route: string) {
    lastRoute.value = route;
  }

  function setActivePlugin(pluginName: string) {
    activePlugin.value = pluginName;
  }

  // ============ 主题更新 ============
  function updateThemeClass() {
    document.documentElement.classList.toggle('dark', isDarkMode.value);
  }

  // ============ 身份信息 ============
  function setPeerID(id: string) {
    peerID.value = id;
  }

  function setIdentityKey(key: string) {
    identityKey.value = key;
  }

  function setAvatarUrl(url: string) {
    avatarUrl.value = url;
  }

  function setAuth(authenticated: boolean) {
    auth.value = authenticated;
    if (authenticated) {
      lastAuthTime.value = Date.now();
    }
  }

  // ============ 重置配置 ============
  function resetToDefaults() {
    // 基础信息
    peerID.value = '';
    avatarUrl.value = '';
    identityKey.value = '';
    version.value = '1.0.0';

    // 认证状态
    auth.value = false;
    autoLogin.value = false;
    lastAuthTime.value = 0;

    // UI 状态
    lastRoute.value = '/';
    activePlugin.value = 'message';
    theme.value = 'auto';
    language.value = 'zh-CN';
    status.value = 'offline';

    // 通知设置
    notifications.value = {
      enabled: true,
      sound: true,
      vibration: false,
      preview: true,
    };

    // 外观设置
    appearance.value = {
      fontSize: 'medium',
      showAvatar: true,
      showOnlineStatus: true,
      showReadReceipts: true,
      compactMode: false,
    };

    // 隐私设置
    privacy.value = {
      lastSeen: true,
      readReceipts: true,
      typingIndicator: true,
      onlineStatus: true,
    };

    // 网络设置
    network.value = {
      autoConnect: true,
      maxPeers: 20,
      enableRelay: true,
      enableMDNS: true,
    };

    updateThemeClass();
  }

  // ============ 加载配置 ============
  function loadConfig(config: Partial<AppConfig>) {
    // 基础信息
    if (config.peerID !== undefined) peerID.value = config.peerID;
    if (config.avatarUrl !== undefined) avatarUrl.value = config.avatarUrl;
    if (config.identityKey !== undefined) identityKey.value = config.identityKey;
    if (config.version !== undefined) version.value = config.version;

    // 认证状态
    if (config.auth !== undefined) auth.value = config.auth;
    if (config.autoLogin !== undefined) autoLogin.value = config.autoLogin;
    if (config.lastAuthTime !== undefined) lastAuthTime.value = config.lastAuthTime;

    // UI 状态
    if (config.lastRoute !== undefined) lastRoute.value = config.lastRoute;
    if (config.activePlugin !== undefined) activePlugin.value = config.activePlugin;
    if (config.theme !== undefined) theme.value = config.theme;
    if (config.language !== undefined) language.value = config.language;
    if (config.status !== undefined) status.value = config.status;

    // 通知设置
    if (config.notifications !== undefined) {
      notifications.value = { ...notifications.value, ...config.notifications };
    }

    // 外观设置
    if (config.appearance !== undefined) {
      appearance.value = { ...appearance.value, ...config.appearance };
    }

    // 隐私设置
    if (config.privacy !== undefined) {
      privacy.value = { ...privacy.value, ...config.privacy };
    }

    // 网络设置
    if (config.network !== undefined) {
      network.value = { ...network.value, ...config.network };
    }

    updateThemeClass();
  }

  // ============ 导出状态 ============
  return {
    // 状态
    peerID,
    avatarUrl,
    identityKey,
    platform,
    version,
    auth,
    autoLogin,
    lastAuthTime,
    lastRoute,
    activePlugin,
    theme,
    language,
    status,
    notifications,
    appearance,
    privacy,
    network,

    // 计算属性
    isMobile,
    isDesktop,
    isDarkMode,
    themeClass,
    notificationsDisabled,

    // 方法
    setTheme,
    setStatus,
    setLanguage,
    toggleNotifications,
    setNotificationSound,
    setNotificationVibration,
    setFontSize,
    toggleCompactMode,
    toggleShowAvatar,
    toggleLastSeen,
    toggleReadReceipts,
    toggleOnlineStatus,
    setAutoConnect,
    setMaxPeers,
    toggleAutoLogin,
    setLastRoute,
    setActivePlugin,
    updateThemeClass,
    setPeerID,
    setIdentityKey,
    setAvatarUrl,
    setAuth,
    resetToDefaults,
    loadConfig,
  };
}, {
  persist: {
    key: 'nodim-app-config',
    storage: localStorage,
    pick: [
      'peerID',
      'avatarUrl',
      'identityKey',
      'platform',
      'version',
      'auth',
      'autoLogin',
      'lastAuthTime',
      'lastRoute',
      'activePlugin',
      'theme',
      'language',
      'status',
      'notifications',
      'appearance',
      'privacy',
      'network',
    ],
  },
});

export function setAppConfig(app: App) {
  const store = useAppConfigStore();
  store.updateThemeClass();
  app.config.globalProperties.$appConfig = store;
}

export type AppConfigStore = ReturnType<typeof useAppConfigStore>;