// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


mod libp2p_node;
use libp2p_node::Libp2pNode;
use libp2p::{PeerId, Multiaddr};
use std::sync::Mutex;
use tauri::State;

// 全局共享 P2P 节点
struct AppState {
    p2p_node: Mutex<Option<Libp2pNode>>,
}

// 启动 libp2p 节点
#[tauri::command]
async fn start_p2p(state: State<'_, AppState>) -> Result<String, String> {
    let mut node = Libp2pNode::new().await;
    let addr = node.local_addr();
    tokio::spawn(async move { node.run().await });
    *state.p2p_node.lock().unwrap() = Some(node);
    Ok(addr)
}

// 连接到对方节点
#[tauri::command]
async fn connect_peer(addr: String, state: State<'_, AppState>) -> Result<(), String> {
    let multiaddr: Multiaddr = addr.parse().map_err(|e| e.to_string())?;
    let mut node = state.p2p_node.lock().unwrap();
    node.as_mut().ok_or("节点未启动")?.connect(multiaddr).await?;
    Ok(())
}

// 发送音视频数据
#[tauri::command]
async fn send_video_data(peer_id: String, data: Vec<u8>, state: State<'_, AppState>) -> Result<(), String> {
    let peer_id: PeerId = peer_id.parse().map_err(|e| e.to_string())?;
    let mut node = state.p2p_node.lock().unwrap();
    node.as_mut().ok_or("节点未启动")?.send_video(peer_id, data).await?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState { p2p_node: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![start_p2p, connect_peer, send_video_data])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用失败");
}

// fn main() {
//   nodim::run();
// }
