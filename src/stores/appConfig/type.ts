// 应用配置类型定义
export interface AppConfig {
    // 平台
    platform: string;
    // 验证
    auth: boolean;
    // 激活插件名称
    activePlugin: string;
    // 最后路由
    lastRoute: string;
    // 主题配置
    theme: 'light' | 'dark' | 'auto';
    // 语言设置
    language: 'zh-CN' | 'en-US';
    // 通知设置
    notifications: {
        enabled: boolean;
        sound: boolean;
        vibration: boolean;
    };
    // 外观设置
    appearance: {
        fontSize: 'small' | 'medium' | 'large';
        showAvatar: boolean;
        showOnlineStatus: boolean;
    };
    // 隐私设置
    privacy: {
        lastSeen: boolean;
        readReceipts: boolean;
    };
    // 自动登录
    autoLogin: boolean;
    // 版本号（用于迁移）
    version: string;
}