use anyhow::{Ok, Result};
use lazy_static::lazy_static;
use libp2p::{
    identity, Multiaddr, PeerId, Swarm, Transport,SwarmBuilder,yamux,
    mdns::{ Event as MdnsEvent, tokio::Behaviour as Mdns}, 
    
    ping, 
    swarm::{Config as SwarmConfig, NetworkBehaviour, SwarmEvent},
    
    tcp, 
    noise,
    core::upgrade, 
        request_response::{
        Behaviour as RequestResponse, Codec, Config, Event as RequestResponseEvent,
        Message as RequestResponseMessage, ProtocolSupport,
    },
};
use std::{collections::HashSet, sync::Arc};
use tokio::sync::RwLock;
use crate::commands::PeerInfo;

// 全局Swarm单例（线程安全）
lazy_static! {
    static ref SWARM: Arc<RwLock<Option<Swarm<NodeBehaviour>>>> = Arc::new(RwLock::new(None));
    static ref DISCOVERED_PEERS: Arc<RwLock<HashSet<PeerInfo>>> = Arc::new(RwLock::new(HashSet::new()));
}

// 组合P2P行为
#[derive(libp2p::NetworkBehaviour)]
#[behaviour(event_process = false)]
pub struct NodeBehaviour {
    pub mdns: Mdns,
    pub req_res: RequestResponse<LengthDelimitedCodec>,
    pub ping: Ping,
}

// 初始化全局Swarm
pub async fn init_global_swarm() -> Result<()> {
    let id_keys = identity::Keypair::generate_ed25519();
    let peer_id = PeerId::from(id_keys.public());

    // 加密传输层
    let noise = NoiseConfig::xx(AuthenticKeypair::new(&id_keys))?;
    let transport = TcpConfig::new()
        .upgrade(upgrade::Version::V1)
        .authenticate(noise)
        .multiplex(YamuxConfig::default())
        .boxed();

    // 行为初始化
    let mdns = Mdns::new(MdnsConfig::default()).await?;
    let req_res = RequestResponse::new(
        LengthDelimitedCodec::default(),
        vec![("/lan/p2p/1.0.0", ProtocolSupport::Full)],
        Default::default(),
    );
    let ping = Ping::new(PingConfig::new());

    let behaviour = NodeBehaviour { mdns, req_res, ping };
    let mut swarm = SwarmBuilder::with_tokio_executor(transport, behaviour, peer_id).build();

    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;
    swarm.set_keep_alive(libp2p::swarm::KeepAlive::Yes);

    // 存入全局单例
    *SWARM.write().await = Some(swarm);

    // 后台运行事件循环
    tokio::spawn(run_swarm_loop());

    Ok(())
}

// 后台Swarm事件循环（自动发现+消息监听）
async fn run_swarm_loop() {
    let mut swarm = SWARM.write().await;
    let swarm = swarm.as_mut().unwrap();

    loop {
        match swarm.select_next_some().await {
            // 自动发现节点
            SwarmEvent::Behaviour(NodeBehaviourEvent::Mdns(MdnsEvent::Discovered(list))) => {
                let mut peers = DISCOVERED_PEERS.write().await;
                for (peer_id, addr) in list {
                    let info = PeerInfo {
                        peer_id: peer_id.to_string(),
                        address: addr.to_string(),
                    };
                    peers.insert(info);
                }
            }
            // 接收消息
            SwarmEvent::Behaviour(NodeBehaviourEvent::ReqRes(RequestResponseEvent::Message {
                peer_id, message: RequestResponseMessage::Request { request, channel, .. },
            })) => {
                swarm.behaviour_mut().req_res.send_response(
                    channel,
                    b"P2P响应: 已收到数据".to_vec(),
                );
            }
            _ => {}
        }
    }
}

// ====================== 补全缺失的 start() 函数 ======================
pub async fn start() -> Result<String> {
    let swarm = SWARM.read().await;
    let peer_id = swarm.as_ref().unwrap().local_peer_id().to_string();
    Ok(peer_id)
}

// ====================== 补全缺失的 get_peers() 函数 ======================
pub async fn get_peers() -> Result<Vec<PeerInfo>> {
    let peers = DISCOVERED_PEERS.read().await.clone();
    Ok(peers.into_iter().collect())
}

// 拨号连接节点
pub async fn dial(addr: Multiaddr) -> Result<()> {
    let mut swarm = SWARM.write().await;
    swarm.as_mut().unwrap().dial(addr)?;
    Ok(())
}