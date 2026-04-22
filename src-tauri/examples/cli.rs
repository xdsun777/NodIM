use p2plib::{P2PNode, P2pCommand, P2pEvent};
use tokio::sync::mpsc;
use std::io::{self, BufRead};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting P2P node...");
    let (node, mut event_rx) = P2PNode::start().await?;

    // 获取本地 PeerId
    let (tx, rx) = tokio::sync::oneshot::channel();
    node.send_command(P2pCommand::GetLocalPeerId(tx)).await?;
    let local_peer_id = rx.await?;
    println!("Local Peer ID: {}", local_peer_id);

    // 启动事件打印任务
    tokio::spawn(async move {
        while let Some(event) = event_rx.recv().await {
            match event {
                P2pEvent::PeersChanged(peers) => {
                    println!("[Peers] {}", peers.join(", "));
                }
                P2pEvent::BroadcastMessage(peer, msg) => {
                    println!("[Broadcast] from {}: {}", peer, msg);
                }
                P2pEvent::PrivateMessage(peer, msg) => {
                    println!("[Private] from {}: {}", peer, msg);
                }
                P2pEvent::FileProgress(peer, session, cur, total) => {
                    println!("[File Progress] from {} session {}: {}/{}", peer, session, cur, total);
                }
                P2pEvent::FileReceived(peer, name, path) => {
                    println!("[File Received] from {}: {} saved at {}", peer, name, path);
                }
            }
        }
    });

    // 命令行交互
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();
    println!("Commands:");
    println!("  /broadcast <msg>");
    println!("  /private <peer_id> <msg>");
    println!("  /sendfile <peer_id> <file_path>");
    println!("  /peers");
    println!("  /exit");

    while let Some(Ok(line)) = lines.next() {
        let line = line.trim();
        if line == "/exit" {
            break;
        } else if line == "/peers" {
            let (tx, rx) = tokio::sync::oneshot::channel();
            node.send_command(P2pCommand::GetPeers(tx)).await?;
            let peers = rx.await?;
            println!("Peers: {:?}", peers);
        } else if let Some(msg) = line.strip_prefix("/broadcast ") {
            node.send_command(P2pCommand::SendBroadcast(msg.to_string())).await?;
            println!("Broadcast sent");
        } else if let Some(rest) = line.strip_prefix("/private ") {
            let parts: Vec<&str> = rest.splitn(2, ' ').collect();
            if parts.len() == 2 {
                let peer_id = parts[0].to_string();
                let msg = parts[1].to_string();
                node.send_command(P2pCommand::SendPrivate(peer_id, msg)).await?;
                println!("Private message sent");
            } else {
                println!("Usage: /private <peer_id> <msg>");
            }
        } else if let Some(rest) = line.strip_prefix("/sendfile ") {
            let parts: Vec<&str> = rest.splitn(2, ' ').collect();
            if parts.len() == 2 {
                let peer_id = parts[0].to_string();
                let file_path = parts[1].to_string();
                let data = tokio::fs::read(&file_path).await?;
                let file_name = std::path::Path::new(&file_path).file_name().unwrap().to_string_lossy().to_string();
                node.send_command(P2pCommand::SendFile(peer_id, file_name, data)).await?;
                println!("File sending started");
            } else {
                println!("Usage: /sendfile <peer_id> <file_path>");
            }
        } else {
            println!("Unknown command");
        }
    }

    Ok(())
}