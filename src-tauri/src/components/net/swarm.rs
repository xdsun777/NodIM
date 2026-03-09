use libp2p::{Swarm, PeerId, identity::Keypair};
use crate::components::net::transport::create_transport;

/// P2P网络Swarm管理器（基础组件）
pub struct SwarmManager {
    swarm: Swarm,
    keypair: Keypair,
    peer_id: PeerId,
}

impl SwarmManager {
    /// 初始化Swarm
    pub async fn new() -> Result<Self, String> {
        // 生成密钥对
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());
        // 创建libp2p传输层
        let transport = create_transport(&keypair).await?;
        // 创建Swarm（省略Behaviour初始化）
        let swarm = Swarm::new(transport, Default::default(), peer_id.clone());
        // 监听本地地址
        swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse().unwrap()).unwrap();
        
        Ok(Self { swarm, keypair, peer_id })
    }

    /// 检查是否直连到目标Peer
    pub fn is_connected(&self, peer_id: &PeerId) -> bool {
        self.swarm.is_connected(peer_id)
    }

    /// 发送直连消息
    pub async fn send_direct_message(&self, peer_id: &PeerId, content: &str) -> Result<(), String> {
        // 调用libp2p发送消息逻辑
        Ok(())
    }
}