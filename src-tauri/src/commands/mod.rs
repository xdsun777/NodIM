use tauri::command;
use crate::p2p::swarm::{self, PeerInfo};

#[command]
pub async fn get_local_peer_id() -> Result<String, String> {
    let id = swarm::LOCAL_PEER_ID.read().await.clone().unwrap_or_default();
    Ok(id)
}

#[command]
pub async fn get_discovered_peers() -> Result<Vec<PeerInfo>, String> {
    let peers = swarm::PEERS.read().await.clone().into_iter().collect();
    Ok(peers)
}

#[command]
pub async fn send_broadcast(msg: String) -> Result<(), String> {
    swarm::send_broadcast(msg).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn send_private_msg(peer_id: String, msg: String) -> Result<(), String> {
    swarm::send_private(peer_id, msg).await.map_err(|e| e.to_string())?;
    Ok(())
}