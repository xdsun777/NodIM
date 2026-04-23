// examples/cli.rs
// 运行方式：在 src-tauri 目录下执行 `cargo run --example cli`

use nodim::p2p::{Node, NodeEvent, PeerId};
use std::str::FromStr;
use tokio::io::{self, AsyncBufReadExt, BufReader};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建并启动 P2P 节点
    let node = Node::new().await?;
    println!("Local Peer ID: {}", node.local_peer_id());

    // 订阅网络事件，在后台任务中实时打印
    let mut event_rx = node.subscribe_events();
    tokio::spawn(async move {
        while let Ok(event) = event_rx.recv().await {
            match event {
                NodeEvent::NewListenAddr(addr) => {
                    println!("[Event] Listening on {}", addr);
                }
                NodeEvent::PeerDiscovered(peer) => {
                    println!("[Event] Discovered peer: {}", peer);
                }
                NodeEvent::BroadcastMessage { from, data } => {
                    let msg = String::from_utf8_lossy(&data);
                    println!("[Broadcast] from {}: {}", from, msg);
                }
                NodeEvent::PrivateMessage { from, data } => {
                    let msg = String::from_utf8_lossy(&data);
                    println!("[Private] from {}: {}", from, msg);
                }
            }
        }
    });

    // 命令行交互
    let stdin = BufReader::new(io::stdin());
    let mut lines = stdin.lines();
    println!("Commands:");
    println!("  list                      - List discovered peers");
    println!("  broadcast <message>       - Send broadcast message");
    println!("  private <peer_id> <msg>   - Send private message");
    println!("  quit                      - Exit");

    while let Some(line) = lines.next_line().await? {
        let parts: Vec<&str> = line.splitn(3, ' ').collect();
        match parts.as_slice() {
            ["list"] => {
                let peers = node.discovered_peers().await?;
                if peers.is_empty() {
                    println!("No peers discovered yet.");
                } else {
                    println!("Discovered peers:");
                    for p in peers {
                        println!("  {}", p);
                    }
                }
            }
            ["broadcast", msg] => {
                node.broadcast(msg.as_bytes().to_vec()).await?;
                println!("Broadcast sent.");
            }
            ["private", peer_str, msg] => {
                let peer = PeerId::from_str(peer_str)?;
                node.send_private(peer, msg.as_bytes().to_vec()).await?;
                println!("Private message sent.");
            }
            ["quit"] => break,
            _ => println!("Unknown command."),
        }
    }

    Ok(())
}