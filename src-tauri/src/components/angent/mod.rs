use async_trait::async_trait;
use libp2p::PeerId;
use crate::core::app::NodimApp;
use crate::core::component::NodimComponent;

/// 消息结构体（通用）
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Message {
    pub to: String,
    pub content: String,
    pub msg_type: String, // text/file/call
}

/// 通信服务抽象（直连/中继/中心均实现此接口）
#[async_trait]
trait CommunicationService {
    fn name(&self) -> &'static str;
    fn is_available(&self, app: &NodimApp, peer_id: &PeerId) -> bool;
    async fn send(&self, app: &NodimApp, msg: &Message) -> Result<(), String>;
}

/// 直连P2P服务实现
#[derive(Default)]
struct DirectP2pService;
#[async_trait]
impl CommunicationService for DirectP2pService {
    fn name(&self) -> &'static str { "direct_p2p" }
    fn is_available(&self, app: &NodimApp, peer_id: &PeerId) -> bool {
        // 判断是否直连可用（检查Swarm连接状态）
        app.swarm_manager.is_connected(peer_id)
    }
    async fn send(&self, app: &NodimApp, msg: &Message) -> Result<(), String> {
        let peer_id = msg.to.parse().map_err(|e| e.to_string())?;
        app.swarm_manager.send_direct_message(&peer_id, &msg.content).await
    }
}

/// 分布式中继服务实现
#[derive(Default)]
struct DistributedRelayService;
// 省略实现（逻辑：通过libp2p relay转发）

/// 中心中继服务实现
#[derive(Default)]
struct CentralRelayService;
// 省略实现（逻辑：连接中心中继节点转发）

/// 通信Agent（自适应路由核心组件）
#[derive(Default)]
pub struct MessageAgent {
    services: Vec<Box<dyn CommunicationService>>,
}

impl MessageAgent {
    pub fn new() -> Self {
        let mut services = Vec::new();
        // 按优先级注册服务（直连 > 分布式中继 > 中心中继）
        services.push(Box::new(DirectP2pService::default()));
        services.push(Box::new(DistributedRelayService::default()));
        services.push(Box::new(CentralRelayService::default()));
        Self { services }
    }

    /// 自适应发送消息（插件只需调用此方法，无需关心路由）
    pub async fn send(&self, app: &NodimApp, msg: &Message) -> Result<(), String> {
        let peer_id = msg.to.parse().map_err(|e| e.to_string())?;
        // 自动选择可用的通信服务
        for service in &self.services {
            if service.is_available(app, &peer_id) {
                log::info!("使用 {} 发送消息到 {}", service.name(), msg.to);
                return service.send(app, msg).await;
            }
        }
        Err("无可用的通信方式".to_string())
    }
}

/// 实现组件通用接口（供微内核初始化）
#[async_trait]
impl NodimComponent for MessageAgent {
    fn name(&self) -> &'static str { "agent" }
    async fn init(&self, _app: &mut NodimApp) {
        // Agent初始化逻辑（如加载路由策略配置）
        log::info!("通信Agent组件初始化完成");
    }
}