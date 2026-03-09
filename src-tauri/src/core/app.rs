use crate::core::event::EventBus;
use crate::components::net::SwarmManager;
use crate::components::agent::MessageAgent;
use tauri::AppHandle;

/// 微内核应用宿主（全局唯一上下文）
pub struct NodimApp {
    /// Tauri应用句柄
    pub app_handle: Option<AppHandle>,
    /// 全局事件总线
    pub event_bus: EventBus,
    /// P2P网络Swarm管理器（来自net组件）
    pub swarm_manager: SwarmManager,
    /// 通信Agent（来自agent组件，自适应路由）
    pub message_agent: MessageAgent,
    /// 插件/组件是否初始化完成
    pub is_ready: bool,
}

impl NodimApp {
    /// 初始化微内核
    pub async fn new() -> Result<Self, String> {
        Ok(Self {
            app_handle: None,
            event_bus: EventBus::new(),
            swarm_manager: SwarmManager::new().await?,
            message_agent: MessageAgent::new(),
            is_ready: false,
        })
    }

    /// 设置Tauri应用句柄
    pub fn set_app_handle(&mut self, handle: AppHandle) {
        self.app_handle = Some(handle);
    }

    /// 标记应用就绪
    pub fn mark_ready(&mut self) {
        self.is_ready = true;
        self.event_bus.emit("app:ready", ());
    }
}