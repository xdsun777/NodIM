use anyhow::Result;
use lazy_static::lazy_static;
use libp2p::{identity, multiaddr::Multiaddr, swarm::{Swarm, SwarmEvent}, tcp, noise, yamux, PeerId, SwarmBuilder, gossipsub::{self, IdentTopic, MessageAuthenticity}, mdns, request_response::{self, ProtocolSupport}};
use serde::Serialize;
use std::{collections::HashSet, sync::Arc};
use tauri::AppHandle;
use tokio::sync::RwLock;

use super::{behaviour::{ChatBehaviour, ChatEvent}, codec::{ChatCodec, ChatProtocol, ChatRequest, ChatResponse}};

lazy_static! {
    pub static ref SWARM: Arc<RwLock<Option<Swarm<ChatBehaviour>>>> = Arc::new(RwLock::new(None));
    pub static ref PEERS: Arc<RwLock<HashSet<PeerInfo>>> = Arc::new(RwLock::new(HashSet::new()));
    pub static ref LOCAL_PEER_ID: Arc<RwLock<Option<String>>> = Arc::new(RwLock::new(None));
    pub static ref TAURI_APP: Arc<RwLock<Option<AppHandle>>> = Arc::new(RwLock::new(None));
}

#[derive(Debug, Clone, Serialize, Hash, PartialEq, Eq)]
pub struct PeerInfo {
    pub peer_id: String,
    pub address: String,
}

pub async fn init_global_swarm() -> Result<()> {
    let id_keys = identity::Keypair::generate_ed25519();
    let local_peer_id = PeerId::from(id_keys.public());
    *LOCAL_PEER_ID.write().await = Some(local_peer_id.to_string());

    // 传输层：TCP + 加密 + 多路复用
    let transport = tcp::tokio::Transport::new(tcp::Config::default())
        .upgrade(libp2p::core::upgrade::Version::V1)
        .authenticate(noise::Config::new(&id_keys)?)
        .multiplex(yamux::Config::default())
        .boxed();

    // Gossipsub 群聊
    let gossipsub_config = gossipsub::ConfigBuilder::default().heartbeat_interval(std::time::Duration::from_secs(5)).build()?;
    let mut gossipsub = gossipsub::Gossipsub::new(MessageAuthenticity::Signed(id_keys), gossipsub_config)?;
    let topic = IdentTopic::new("chat");
    gossipsub.subscribe(&topic)?;

    // mDNS 自动发现
    let mdns = mdns::tokio::Mdns::new(Default::default(), local_peer_id)?;

    // RequestResponse 私聊
    let req_res = request_response::RequestResponse::new(
        std::iter::once((ChatProtocol, ProtocolSupport::Full)),
        request_response::Config::default(),
    );

    let behaviour = ChatBehaviour { gossipsub, mdns, req_res };
    let mut swarm = SwarmBuilder::with_tokio_executor(transport, behaviour, local_peer_id).build();
    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse::<Multiaddr>()?)?;
    swarm.set_keep_alive(libp2p::swarm::KeepAlive::Yes);

    *SWARM.write().await = Some(swarm);
    tokio::spawn(run_swarm_loop());
    Ok(())
}

async fn run_swarm_loop() {
    let mut swarm = SWARM.write().await;
    let swarm = swarm.as_mut().unwrap();
    let topic = IdentTopic::new("chat");

    loop {
        match swarm.select_next_some().await {
            // 发现节点
            SwarmEvent::Behaviour(ChatEvent::Mdns(mdns::Event::Discovered(peers))) => {
                let mut list = PEERS.write().await;
                for (peer, addr) in peers {
                    list.insert(PeerInfo { peer_id: peer.to_string(), address: addr.to_string() });
                }
                let app = TAURI_APP.read().await;
                if let Some(handle) = app.as_ref() {
                    let _ = handle.emit("peer:discovered", ());
                }
            }
            // 收到群消息
            SwarmEvent::Behaviour(ChatEvent::Gossipsub(gossipsub::Event::Message { propagation_source, message, .. })) => {
                let app = TAURI_APP.read().await;
                if let Some(handle) = app.as_ref() {
                    let _ = handle.emit("message:broadcast", (
                        propagation_source.to_string(),
                        String::from_utf8_lossy(&message.data).to_string()
                    ));
                }
            }
            // 收到私聊
            SwarmEvent::Behaviour(ChatEvent::ReqRes(request_response::Event::Message { peer, message: request_response::Message::Request { request, .. }, .. })) => {
                let app = TAURI_APP.read().await;
                if let Some(handle) = app.as_ref() {
                    let _ = handle.emit("message:private", (
                        peer.to_string(),
                        String::from_utf8_lossy(&request.0).to_string()
                    ));
                }
            }
            _ => {}
        }
    }
}

// 发送群消息
pub async fn send_broadcast(msg: String) -> Result<()> {
    let mut swarm = SWARM.write().await;
    let swarm = swarm.as_mut().unwrap();
    let topic = IdentTopic::new("chat");
    swarm.behaviour_mut().gossipsub.publish(topic, msg.as_bytes())?;
    Ok(())
}

// 发送私聊
pub async fn send_private(peer_id: String, msg: String) -> Result<()> {
    let peer = PeerId::parse(&peer_id)?;
    let mut swarm = SWARM.write().await;
    let swarm = swarm.as_mut().unwrap();
    swarm.behaviour_mut().req_res.send_request(&peer, ChatRequest(msg.as_bytes().to_vec()));
    Ok(())
}