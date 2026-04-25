use crate::P2pState;
use libp2p::PeerId;
use tauri::{State, AppHandle, Emitter};
use std::path::PathBuf;

/// 生成密钥 + PeerId（返回给前端存储）
#[tauri::command]
pub fn generate_identity() -> Result<(String, String), String> {
    nodp2p::create_key()
}

/// 使用前端传来的密钥启动 P2P
#[tauri::command]
pub async fn start_with_identity(
    app_handle: AppHandle,
    state: State<'_, P2pState>,
    keyBase64: String,
) -> Result<String, String> {
    // 解码密钥
    let key = nodp2p::de_key(keyBase64);

    // 启动 P2P 网络
    let (cmd_tx, mut event_rx) = nodp2p::start_swarm(key)
        .await
        .map_err(|e| e.to_string())?;

    // 保存命令发送器
    *state.cmd_tx.write() = Some(cmd_tx.clone());

    // 在后台处理事件
    let state_clone = P2pState {
        cmd_tx: parking_lot::RwLock::new(None), // 不需要复制
        peer_id: parking_lot::RwLock::new(*state.peer_id.read()),
        connected_peers: state.connected_peers.clone(),
        discovered_peers: state.discovered_peers.clone(),
    };

    tauri::async_runtime::spawn(async move {
        while let Some(event) = event_rx.recv().await {
            match event {
                nodp2p::AppEvent::PeerConnected(peer) => {
                    state_clone.connected_peers.write().insert(peer.to_string(), peer);
                    let _ = app_handle.emit("p2p:peer-connected", peer.to_string());
                }
                nodp2p::AppEvent::PeerDisconnected(peer) => {
                    state_clone.connected_peers.write().remove(&peer.to_string());
                    let _ = app_handle.emit("p2p:peer-disconnected", peer.to_string());
                }
                nodp2p::AppEvent::PeerDiscovered(peer, addr) => {
                    state_clone
                        .discovered_peers
                        .write()
                        .insert(peer.to_string(), addr.to_string());
                    let _ = app_handle.emit(
                        "p2p:peer-discovered",
                        serde_json::json!({
                            "peer": peer.to_string(),
                            "addr": addr.to_string(),
                        }),
                    );
                }
                nodp2p::AppEvent::MessageReceived { peer, message } => {
                    let _ = app_handle.emit(
                        "p2p:broadcast-received",
                        serde_json::json!({
                            "from": peer.to_string(),
                            "message": message,
                        }),
                    );
                }
                nodp2p::AppEvent::PrivateText(peer, text) => {
                    let _ = app_handle.emit(
                        "p2p:private-message-received",
                        serde_json::json!({
                            "from": peer.to_string(),
                            "text": text,
                        }),
                    );
                }
                nodp2p::AppEvent::FileRequestReceived {
                    peer,
                    transfer_id,
                    file_name,
                    file_size,
                } => {
                    let _ = app_handle.emit(
                        "p2p:file-request",
                        serde_json::json!({
                            "peer": peer.to_string(),
                            "transferId": transfer_id,
                            "fileName": file_name,
                            "fileSize": file_size,
                        }),
                    );
                }
                nodp2p::AppEvent::FileTransferStarted {
                    peer,
                    transfer_id,
                    file_name,
                } => {
                    let _ = app_handle.emit(
                        "p2p:file-transfer-started",
                        serde_json::json!({
                            "peer": peer.to_string(),
                            "transferId": transfer_id,
                            "fileName": file_name,
                        }),
                    );
                }
                nodp2p::AppEvent::FileTransferProgress {
                    peer,
                    transfer_id,
                    received,
                    total,
                } => {
                    let _ = app_handle.emit(
                        "p2p:file-transfer-progress",
                        serde_json::json!({
                            "peer": peer.to_string(),
                            "transferId": transfer_id,
                            "received": received,
                            "total": total,
                            "progress": (received as f64 / total as f64 * 100.0) as u32,
                        }),
                    );
                }
                nodp2p::AppEvent::FileReceived {
                    peer,
                    file_name,
                    saved_path,
                } => {
                    let _ = app_handle.emit(
                        "p2p:file-received",
                        serde_json::json!({
                            "peer": peer.to_string(),
                            "fileName": file_name,
                            "savedPath": saved_path.to_string_lossy().to_string(),
                        }),
                    );
                }
                nodp2p::AppEvent::FileSent {
                    peer,
                    transfer_id,
                } => {
                    let _ = app_handle.emit(
                        "p2p:file-sent",
                        serde_json::json!({
                            "peer": peer.to_string(),
                            "transferId": transfer_id,
                        }),
                    );
                }
            }
        }
    });

    // 返回当前节点的 PeerId
    let peer_id_str = format!("自己的PeerId需要从某处获取");
    Ok(peer_id_str)
}

/// 群发广播消息
#[tauri::command]
pub fn broadcast_message(
    state: State<P2pState>,
    message: String,
) -> Result<(), String> {
    let cmd_tx = state
        .cmd_tx
        .read()
        .as_ref()
        .ok_or("P2P 未启动")?
        .clone();

    cmd_tx
        .send(nodp2p::Command::Broadcast(message))
        .map_err(|e| format!("广播消息失败: {}", e))?;

    Ok(())
}

/// 私聊消息
#[tauri::command]
pub fn send_private(
    state: State<P2pState>,
    peer_id: String,
    message: String,
) -> Result<(), String> {
    let peer_id = peer_id
        .parse::<PeerId>()
        .map_err(|_| "无效的 PeerId".to_string())?;

    let cmd_tx = state
        .cmd_tx
        .read()
        .as_ref()
        .ok_or("P2P 未启动")?
        .clone();

    cmd_tx
        .send(nodp2p::Command::SendPrivateText {
            peer: peer_id,
            text: message,
        })
        .map_err(|e| format!("发送私聊消息失败: {}", e))?;

    Ok(())
}

/// 发送文件（通过路径）
#[tauri::command]
pub fn send_file(
    state: State<P2pState>,
    peer_id: String,
    path: String,
) -> Result<(), String> {
    let peer_id_parsed = peer_id
        .parse::<PeerId>()
        .map_err(|_| "无效的 PeerId".to_string())?;

    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("文件不存在: {}", path));
    }

    let cmd_tx = state
        .cmd_tx
        .read()
        .as_ref()
        .ok_or("P2P 未启动")?
        .clone();

    cmd_tx
        .send(nodp2p::Command::SendFile {
            peer: peer_id_parsed,
            path: file_path,
        })
        .map_err(|e| format!("发送文件失败: {}", e))?;

    Ok(())
}

/// 发送二进制数据（作为文件）
#[tauri::command]
pub fn send_file_binary(
    state: State<'_, P2pState>,
    peer_id: String,
    _name: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let peer = peer_id
        .parse::<PeerId>()
        .map_err(|_| "无效PeerID".to_string())?;

    let cmd_tx = state
        .cmd_tx
        .read()
        .as_ref()
        .ok_or("P2P 未启动")?
        .clone();

    // 将二进制数据作为单个分块发送
    cmd_tx
        .send(nodp2p::Command::SendFileChunk {
            transfer_id: generate_transfer_id(),
            peer,
            offset: 0,
            data,
            is_last: true,
        })
        .map_err(|e| format!("发送二进制文件失败: {}", e))?;

    Ok(())
}

/// 获取已连接的对等节点
#[tauri::command]
pub fn get_connected_peers(state: State<P2pState>) -> Result<Vec<String>, String> {
    let peers = state
        .connected_peers
        .read()
        .keys()
        .cloned()
        .collect();

    Ok(peers)
}

/// 获取已发现的对等节点
#[tauri::command]
pub fn get_discovered_peers(state: State<P2pState>) -> Result<Vec<(String, String)>, String> {
    let peers = state
        .discovered_peers
        .read()
        .iter()
        .map(|(peer_id, addr)| (peer_id.clone(), addr.clone()))
        .collect();

    Ok(peers)
}

/// 获取当前节点的 PeerId
#[tauri::command]
pub fn get_peer_id(state: State<P2pState>) -> Result<Option<String>, String> {
    Ok(state
        .peer_id
        .read()
        .as_ref()
        .map(|p| p.to_string()))
}

/// 生成转移 ID
fn generate_transfer_id() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}