use libp2p::{
    core::upgrade,
    identity::Keypair,
    noise::{NoiseConfig, X25519Spec},
    swarm::{NetworkBehaviour, Swarm, SwarmBuilder},
    tcp::TcpConfig,
    yamux::YamuxConfig,
    PeerId, SwarmEvent,
};
use libp2p_gossipsub::{Gossipsub, GossipsubEvent, GossipsubMessage, MessageAuthenticity, MessageId};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use tokio::sync::mpsc::{Receiver, Sender};

#[derive(NetworkBehaviour)]
#[behaviour(event_process = false)]
pub struct AppBehaviour {
    pub gossipsub: Gossipsub,
}

pub struct Libp2pNode {
    swarm: Swarm<AppBehaviour>,
    peer_id: PeerId,
    video_tx: Sender<Vec<u8>>,
    video_rx: Receiver<Vec<u8>>,
}

impl Libp2pNode {
    pub async fn new(video_tx: Sender<Vec<u8>>, video_rx: Receiver<Vec<u8>>) -> Self {
        let keypair = Keypair::generate_ed25519();
        let peer_id = keypair.public().to_peer_id();

        // 加密层：Noise（libp2p标准安全组件）
        let noise = NoiseConfig::new(
            X25519Spec::new(),
            keypair.clone(),
        ).unwrap();

        // 流复用：Yamux（libp2p官方推荐）
        let yamux = YamuxConfig::default();

        // Gossipsub：P2P发布订阅（libp2p官方广播组件）
        let message_id_fn = |message: &GossipsubMessage| {
            let mut s = DefaultHasher::new();
            message.data.hash(&mut s);
            MessageId::from(s.finish().to_string())
        };

        let gossipsub = Gossipsub::new(
            MessageAuthenticity::Signed(keypair),
            Default::default(),
        )
        .with_message_id_fn(message_id_fn)
        .unwrap();

        let behaviour = AppBehaviour { gossipsub };

        // 创建Swarm网络栈
        let mut swarm = SwarmBuilder::with_tokio_executor(
            TcpConfig::new(),
            behaviour,
            peer_id,
        )
        .upgrade(upgrade::Version::V1)
        .authenticate(noise)
        .multiplex(yamux)
        .build();

        // 监听TCP端口
        swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse().unwrap()).unwrap();

        // 订阅视频主题
        let topic = "p2p-video-stream".into();
        swarm.behaviour_mut().gossipsub.subscribe(&topic).unwrap();

        Self { swarm, peer_id, video_tx, video_rx }
    }

    pub fn get_peer_id(&self) -> String {
        self.peer_id.to_string()
    }

    // 连接对端节点
    pub async fn connect_peer(&mut self, peer_addr: &str) -> anyhow::Result<()> {
        let addr = peer_addr.parse()?;
        self.swarm.dial(addr)?;
        Ok(())
    }

    // 发送二进制音视频数据
    pub async fn send_video_data(&mut self, data: Vec<u8>) {
        let topic = "p2p-video-stream".into();
        let _ = self.swarm.behaviour_mut().gossipsub.publish(topic, data);
    }

    // 启动P2P事件循环
    pub async fn run(&mut self) {
        let topic = "p2p-video-stream".into();
        loop {
            tokio::select! {
                // 接收P2P网络消息
                event = self.swarm.select_next_some() => {
                    if let SwarmEvent::Behaviour(AppBehaviourEvent::Gossipsub(GossipsubEvent::Message {
                        message, ..
                    })) = event {
                        let _ = self.video_tx.send(message.data).await;
                    }
                }

                // 发送前端音视频数据到P2P
                Some(data) = self.video_rx.recv() => {
                    let _ = self.swarm.behaviour_mut().gossipsub.publish(topic.clone(), data);
                }
            }
        }
    }
}