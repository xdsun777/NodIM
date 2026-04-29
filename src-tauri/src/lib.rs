mod commands;
mod utils;

use libp2p::PeerId;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;

pub struct P2pState {
    /// P2P 命令发送器
    pub cmd_tx: RwLock<Option<mpsc::UnboundedSender<nodp2p::Command>>>,
    /// 当前节点的 PeerId
    pub peer_id: RwLock<Option<PeerId>>,
    /// 已连接的对等节点
    pub connected_peers: Arc<RwLock<HashMap<String, PeerId>>>,
    /// 发现的对等节点
    pub discovered_peers: Arc<RwLock<HashMap<String, String>>>, // peer_id_str -> multiaddr
}

impl P2pState {
    pub fn new() -> Self {
        Self {
            cmd_tx: RwLock::new(None),
            peer_id: RwLock::new(None),
            connected_peers: Arc::new(RwLock::new(HashMap::new())),
            discovered_peers: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

impl Default for P2pState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
        tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_biometric::init())
        .plugin(tauri_plugin_barcode_scanner::init())
        .setup(|app| {
            Ok(())
        })
        .manage(P2pState::new())
        .invoke_handler(tauri::generate_handler![
            commands::generate_identity,
            commands::start_with_identity,
            commands::broadcast_message,
            commands::send_private,
            commands::send_file,
            commands::send_file_binary,
            commands::send_file_request,
            commands::send_file_chunk,
            commands::get_connected_peers,
            commands::get_peers,
            commands::get_discovered_peers,
            commands::get_peer_id,
        ])
        .run(tauri::generate_context!())
        .expect("启动失败");
}