use async_trait::async_trait;
use tauri::Invoke;
use crate::core::plugin::NodimPlugin;
use crate::core::app::NodimApp;
use crate::components::ipc::register_ipc_handler;
use crate::components::agent::Message;

/// 消息业务插件
#[derive(Default)]
pub struct MessagePlugin;

#[async_trait]
impl NodimPlugin for MessagePlugin {
    fn name(&self) -> &'static str { "message" }

    async fn install(&self, app: &mut NodimApp) {
        // 1. 注册IPC命令（前端调用入口）
        self.register_ipc_handlers(app).await;
        
        // 2. 监听P2P消息接收事件（从net组件转发）
        app.event_bus.on("net:message_received", move |data| {
            let msg: Message = serde_json::from_value(data.unwrap()).unwrap();
            // 转发事件到前端
            if let Some(handle) = &app.app_handle {
                handle.emit("message:received", msg).unwrap();
            }
        }).await;

        log::info!("消息插件安装完成");
    }
}

impl MessagePlugin {
    /// 注册消息相关IPC处理器
    async fn register_ipc_handlers(&self, app: &mut NodimApp) {
        // 注册"message:send" IPC命令
        register_ipc_handler("message:send", move |invoke: Invoke| {
            let app = invoke.state::<NodimApp>().unwrap();
            let params: Message = invoke.args().unwrap();
            
            // 调用通信Agent发送消息（插件无需关心路由）
            tokio::spawn(async move {
                if let Err(e) = app.message_agent.send(&app, &params).await {
                    log::error!("发送消息失败: {}", e);
                }
            });

            Ok(())
        });
    }
}