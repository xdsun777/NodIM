#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("你好, {}! 你已经收到了来自rust的信息", name)
}


use tauri::command;
use serde::Serialize;

// 给前端的节点信息
#[derive(Serialize, Clone)]
pub struct PeerInfo {
    pub peer_id: String,
    pub address: String,
}

// 1. 启动P2P节点
#[tauri::command]
pub async fn start_p2p_node() -> Result<String, String> {
    // 启动P2P节点，返回本机PeerId
    Ok(crate::p2p::node::start().await)
}

// 2. 获取已发现的局域网节点
#[tauri::command]
pub async fn get_discovered_peers() -> Result<Vec<PeerInfo>, String> {
    // 返回已发现的节点列表
    Ok(crate::p2p::node::get_peers().await)
}

// 3. 发送P2P请求（核心：仿axios）
#[tauri::command]
pub async fn send_p2p_request(peer_id: String, data: Vec<u8>) -> Result<Vec<u8>, String> {
    // 发送P2P数据，返回响应
    crate::p2p::transport::send(peer_id, data).await
}