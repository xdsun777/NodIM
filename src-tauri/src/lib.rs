// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// mod commands;
// mod p2p;

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
// ============== 你原版代码 100% 原封不动 ==============
use async_trait::async_trait;
use futures::{
    io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    prelude::*,
};
use libp2p::{
    Multiaddr, PeerId, Swarm, Transport,
    core::upgrade,
    gossipsub::{
        Behaviour as Gossipsub, ConfigBuilder, Event as GossipsubEvent, IdentTopic,
        MessageAuthenticity,
    },
    identity,
    mdns::{Event as MdnsEvent, tokio::Behaviour as Mdns},
    noise,
    request_response::{
        Behaviour as RequestResponse, Codec, Config, Event as RequestResponseEvent,
        Message as RequestResponseMessage, ProtocolSupport,
    },
    swarm::{Config as SwarmConfig, NetworkBehaviour, SwarmEvent},
    tcp, yamux,
};
use std::str::FromStr;
use std::sync::OnceLock;
use std::{error::Error, iter, time::Duration};
use tauri::Emitter;

// 你的协议
#[derive(Clone)]
pub struct ChatProtocol();
impl AsRef<str> for ChatProtocol {
    fn as_ref(&self) -> &str {
        "/nodim/chat/1"
    }
}

// 你的编解码器
#[derive(Clone, Default)]
pub struct ChatCodec;
#[derive(Debug, Clone)]
pub struct ChatRequest(Vec<u8>);
#[derive(Debug, Clone)]
pub struct ChatResponse(Vec<u8>);

#[async_trait]
impl Codec for ChatCodec {
    type Protocol = ChatProtocol;
    type Request = ChatRequest;
    type Response = ChatResponse;

    async fn read_request<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Request>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatRequest(buf))
    }

    async fn read_response<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Response>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatResponse(buf))
    }

    async fn write_request<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        ChatRequest(data): ChatRequest,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        io.write_all(&data).await
    }

    async fn write_response<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        ChatResponse(data): ChatResponse,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        io.write_all(&data).await
    }
}

// 你的网络行为
#[derive(NetworkBehaviour)]
#[behaviour(to_swarm = "Event")]
pub struct ChatBehaviour {
    pub gossipsub: Gossipsub,
    pub mdns: Mdns,
    pub req_res: RequestResponse<ChatCodec>,
}

// 你的事件枚举
#[derive(Debug)]
pub enum Event {
    Gossipsub(GossipsubEvent),
    Mdns(MdnsEvent),
    ReqRes(RequestResponseEvent<ChatRequest, ChatResponse>),
}

impl From<GossipsubEvent> for Event {
    fn from(e: GossipsubEvent) -> Self {
        Event::Gossipsub(e)
    }
}
impl From<MdnsEvent> for Event {
    fn from(e: MdnsEvent) -> Self {
        Event::Mdns(e)
    }
}
impl From<RequestResponseEvent<ChatRequest, ChatResponse>> for Event {
    fn from(e: RequestResponseEvent<ChatRequest, ChatResponse>) -> Self {
        Event::ReqRes(e)
    }
}
// ============== 你原版代码 结束 ==============

// ============== 修复：通道通信（解决Swarm线程安全） ==============
use serde::Serialize;
use tauri::Manager;
use tokio::sync::{mpsc, oneshot};

// 命令消息枚举
#[derive(Debug)]
enum P2pCommand {
    GetLocalPeerId(oneshot::Sender<String>),
    GetPeers(oneshot::Sender<Vec<String>>),
    SendBroadcast(String),
    SendPrivate(String, String),
}

// 全局通道
// static mut COMMAND_TX: Option<mpsc::Sender<P2pCommand>> = None;
static COMMAND_TX: OnceLock<mpsc::Sender<P2pCommand>> = OnceLock::new();

// 前端返回结构体
#[derive(Serialize, Clone)]
pub struct PeerInfo {
    pub peer_id: String,
}

// ============== Tauri 命令（前端调用） ==============
#[tauri::command]
async fn get_local_peer_id() -> Result<String, String> {
    let (tx, rx) = oneshot::channel();
    // unsafe {
    //     COMMAND_TX.as_ref().ok_or("P2P未初始化")?.send(P2pCommand::GetLocalPeerId(tx)).map_err(|e| e.to_string()).await;
    // }
    let _ = COMMAND_TX
        .get()
        .ok_or("P2P未初始化")?
        .send(P2pCommand::GetLocalPeerId(tx))
        .map_err(|e| e.to_string())
        .await;

    rx.await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_discovered_peers() -> Result<Vec<PeerInfo>, String> {
    let (tx, rx) = oneshot::channel();
    // unsafe {
    //     COMMAND_TX
    //         .as_ref()
    //         .ok_or("P2P未初始化")?
    //         .send(P2pCommand::GetPeers(tx))
    //         .map_err(|e| e.to_string())
    //         .await;
    // }
    let _ = COMMAND_TX
        .get()
        .ok_or("P2P 节点未初始化")?
        .send(P2pCommand::GetPeers(tx))
        .map_err(|e| e.to_string())
        .await;
    let peers = rx.await.map_err(|e| e.to_string())?;
    Ok(peers.into_iter().map(|p| PeerInfo { peer_id: p }).collect())
}

#[tauri::command]
async fn send_broadcast(msg: String) -> Result<(), String> {
    // unsafe {
    //     COMMAND_TX
    //         .as_ref()
    //         .ok_or("P2P未初始化")?
    //         .send(P2pCommand::SendBroadcast(msg))
    //         .map_err(|e| e.to_string())
    //         .await;
    // }
    let _ = COMMAND_TX
        .get()
        .ok_or("P2P 节点未初始化")?
        .send(P2pCommand::SendBroadcast(msg))
        .map_err(|e| e.to_string())
        .await;
    Ok(())
}

#[tauri::command]
async fn send_private_msg(peer_id: String, msg: String) -> Result<(), String> {
    // unsafe {
    //     COMMAND_TX
    //         .as_ref()
    //         .ok_or("P2P未初始化")?
    //         .send(P2pCommand::SendPrivate(peer_id, msg))
    //         .map_err(|e| e.to_string())
    //         .await;
    // }
    let _ = COMMAND_TX
        .get()
        .ok_or("P2P 节点未初始化")?
        .send(P2pCommand::SendPrivate(peer_id, msg))
        .map_err(|e| e.to_string())
        .await;

    Ok(())
}

// ============== Swarm 独立任务（核心修复） ==============
async fn run_swarm_task(
    mut swarm: Swarm<ChatBehaviour>,
    mut rx: mpsc::Receiver<P2pCommand>,
    app_handle: tauri::AppHandle,
) {
    let mut discovered_peers = Vec::new();
    let topic = IdentTopic::new("chat");

    loop {
        tokio::select! {
            // 处理Swarm事件（你的原版逻辑）
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        println!("Listening on {address}");
                    }

                    SwarmEvent::Behaviour(Event::Mdns(event)) => match event {
                        MdnsEvent::Discovered(peers) => {
                            discovered_peers.clear();
                            for (peer, _) in peers {
                                println!("discovered {peer}");
                                discovered_peers.push(peer.to_string());
                            }
                            let _ = app_handle.emit("peer:discovered", ());
                        }
                        _ => {}
                    },

                    SwarmEvent::Behaviour(Event::Gossipsub(GossipsubEvent::Message {
                        propagation_source, message, ..
                    })) => {
                        let content = String::from_utf8_lossy(&message.data);
                        let _ = app_handle.emit("message:broadcast", (propagation_source.to_string(), content.to_string()));
                    }

                    SwarmEvent::Behaviour(Event::ReqRes(RequestResponseEvent::Message { peer, message })) => {
                        if let RequestResponseMessage::Request { request, .. } = message {
                            let content = String::from_utf8_lossy(&request.0);
                            let _ = app_handle.emit("message:private", (peer.to_string(), content.to_string()));
                        }
                    }

                    _ => {}
                }
            }

            // 处理前端命令
            Some(cmd) = rx.recv() => {
                match cmd {
                    P2pCommand::GetLocalPeerId(tx) => {
                        let _ = tx.send(swarm.local_peer_id().to_string());
                    }
                    P2pCommand::GetPeers(tx) => {
                        let _ = tx.send(discovered_peers.clone());
                    }
                    P2pCommand::SendBroadcast(msg) => {
                        let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), msg.as_bytes());
                    }
                    P2pCommand::SendPrivate(peer_id, msg) => {
                        if let Ok(peer) = PeerId::from_str(&peer_id) {
                            swarm.behaviour_mut().req_res.send_request(&peer, ChatRequest(msg.as_bytes().to_vec()));
                        }
                    }
                }
            }
        }
    }
}

// ============== Tauri 主函数（兼容移动端） ==============
pub fn run() -> Result<(), Box<dyn Error>> {
    // 创建Tokio运行时
    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(async {
        // 你的原版：初始化Swarm（完全不变）
        let id_keys = identity::Keypair::generate_ed25519();
        let peer_id = PeerId::from(id_keys.public());

        let transport = tcp::tokio::Transport::new(tcp::Config::default())
            .upgrade(upgrade::Version::V1)
            .authenticate(noise::Config::new(&id_keys).unwrap())
            .multiplex(yamux::Config::default())
            .boxed();

        let gossipsub_config = ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(5))
            .build()
            .unwrap();
        let mut gossipsub = Gossipsub::new(
            MessageAuthenticity::Signed(id_keys.clone()),
            gossipsub_config,
        )
        .unwrap();
        let topic = IdentTopic::new("chat");
        gossipsub.subscribe(&topic).unwrap();

        let mdns = Mdns::new(Default::default(), peer_id).unwrap();
        let req_res = RequestResponse::new(
            iter::once((ChatProtocol(), ProtocolSupport::Full)),
            Config::default(),
        );
        let behaviour = ChatBehaviour {
            gossipsub,
            mdns,
            req_res,
        };

        let mut swarm = Swarm::new(
            transport,
            behaviour,
            peer_id,
            SwarmConfig::with_tokio_executor(),
        );
        let _ = swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse::<Multiaddr>().unwrap());

        // 创建命令通道
        let (tx, rx) = mpsc::channel(32);
        // unsafe {
        //     COMMAND_TX = Some(tx);
        // }
        let _ = COMMAND_TX.set(tx);
        // 启动Tauri
        tauri::Builder::default()
            .invoke_handler(tauri::generate_handler![
                get_local_peer_id,
                get_discovered_peers,
                send_broadcast,
                send_private_msg
            ])
            .setup(|app| {
                // 启动Swarm任务
                tokio::spawn(run_swarm_task(swarm, rx, app.app_handle().clone()));
                Ok(())
            })
            .run(tauri::generate_context!())
            .expect("Tauri启动失败");
    });

    Ok(())
}

// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() -> Result<(), Box<dyn std::error::Error>> {

//     tauri::Builder::default()
//         .plugin(tauri_plugin_opener::init())
//         .invoke_handler(tauri::generate_handler![
//             commands::start_p2p_node,
//             commands::get_discovered_peers,
//             commands::send_p2p_request,
//             commands::greet
//         ])
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }
