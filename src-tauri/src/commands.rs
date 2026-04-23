use crate::p2p::{Node, NodeEvent, PeerId};
use serde::Serialize;
use std::str::FromStr;
use tauri::{Emitter, Manager};
use tokio::sync::{mpsc, oneshot};

#[derive(Serialize, Clone)]
pub struct PeerInfo {
    pub peer_id: String,
}

enum P2pCommand {
    GetLocalPeerId(oneshot::Sender<String>),
    GetPeers(oneshot::Sender<Vec<String>>),
    SendBroadcast(String),
    SendPrivate(String, String),
}

static COMMAND_TX: std::sync::OnceLock<mpsc::Sender<P2pCommand>> = std::sync::OnceLock::new();

#[tauri::command]
pub async fn get_local_peer_id() -> Result<String, String> {
    let (tx, rx) = oneshot::channel();
    COMMAND_TX
        .get()
        .ok_or("P2P 未初始化")?
        .send(P2pCommand::GetLocalPeerId(tx))
        .await
        .map_err(|e| e.to_string())?;
    rx.await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_discovered_peers() -> Result<Vec<PeerInfo>, String> {
    let (tx, rx) = oneshot::channel();
    COMMAND_TX
        .get()
        .ok_or("P2P 未初始化")?
        .send(P2pCommand::GetPeers(tx))
        .await
        .map_err(|e| e.to_string())?;
    let peers = rx.await.map_err(|e| e.to_string())?;
    Ok(peers.into_iter().map(|p| PeerInfo { peer_id: p }).collect())
}

#[tauri::command]
pub async fn send_broadcast(msg: String) -> Result<(), String> {
    COMMAND_TX
        .get()
        .ok_or("P2P 未初始化")?
        .send(P2pCommand::SendBroadcast(msg))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_private_msg(peer_id: String, msg: String) -> Result<(), String> {
    COMMAND_TX
        .get()
        .ok_or("P2P 未初始化")?
        .send(P2pCommand::SendPrivate(peer_id, msg))
        .await
        .map_err(|e| e.to_string())
}

/// 初始化 P2P 节点，设置全局命令通道，并启动事件转发任务
pub async fn setup_p2p(app_handle: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let node = Node::new().await?;
    let local_peer_id = node.local_peer_id().to_string();
    println!("P2P node started: {}", local_peer_id);

    let (cmd_tx, mut cmd_rx) = mpsc::channel(32);
    COMMAND_TX.set(cmd_tx).unwrap();

    let mut event_rx = node.subscribe_events();
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        while let Ok(event) = event_rx.recv().await {
            match event {
                NodeEvent::NewListenAddr(addr) => {
                    println!("Listening on {}", addr);
                }
                NodeEvent::PeerDiscovered(peer) => {
                    let _ = app_handle_clone.emit("peer:discovered", peer.to_string());
                }
                NodeEvent::BroadcastMessage { from, data } => {
                    let msg = String::from_utf8_lossy(&data).to_string();
                    let _ = app_handle_clone.emit("message:broadcast", (from.to_string(), msg));
                }
                NodeEvent::PrivateMessage { from, data } => {
                    let msg = String::from_utf8_lossy(&data).to_string();
                    let _ = app_handle_clone.emit("message:private", (from.to_string(), msg));
                }
            }
        }
    });

    tokio::spawn(async move {
        while let Some(cmd) = cmd_rx.recv().await {
            match cmd {
                P2pCommand::GetLocalPeerId(tx) => {
                    let _ = tx.send(node.local_peer_id().to_string());
                }
                P2pCommand::GetPeers(tx) => {
                    match node.discovered_peers().await {
                        Ok(peers) => {
                            let peer_strings: Vec<String> = peers.into_iter().map(|p| p.to_string()).collect();
                            let _ = tx.send(peer_strings);
                        }
                        Err(e) => eprintln!("Failed to get peers: {}", e),
                    }
                }
                P2pCommand::SendBroadcast(msg) => {
                    if let Err(e) = node.broadcast(msg.into_bytes()).await {
                        eprintln!("Broadcast failed: {}", e);
                    }
                }
                P2pCommand::SendPrivate(peer_str, msg) => {
                    match PeerId::from_str(&peer_str) {
                        Ok(peer) => {
                            if let Err(e) = node.send_private(peer, msg.into_bytes()).await {
                                eprintln!("Private message failed: {}", e);
                            }
                        }
                        Err(e) => eprintln!("Invalid peer id: {}", e),
                    }
                }
            }
        }
    });

    Ok(())
}