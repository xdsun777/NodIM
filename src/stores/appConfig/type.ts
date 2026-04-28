export interface AppConfig {
  // ============ 基础信息 ============
  peerID: string;
  avatarUrl: string;
  identityKey: string;
  platform: string;
  version: string;
  status: 'online' | 'offline' | 'away';

  // ============ 认证状态 ============
  auth: boolean;
  autoLogin: boolean;
  lastAuthTime: number;

  // ============ UI 状态 ============
  lastRoute: string;
  activePlugin: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';

  // ============ 通知设置 ============
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    preview: boolean;
  };

  // ============ 外观设置 ============
  appearance: {
    fontSize: 'small' | 'medium' | 'large';
    showAvatar: boolean;
    showOnlineStatus: boolean;
    showReadReceipts: boolean;
    compactMode: boolean;
  };

  // ============ 隐私设置 ============
  privacy: {
    lastSeen: boolean;
    readReceipts: boolean;
    typingIndicator: boolean;
    onlineStatus: boolean;
  };

  // ============ 网络设置 ============
  network: {
    autoConnect: boolean;
    maxPeers: number;
    enableRelay: boolean;
    enableMDNS: boolean;
  };
}