// P2P固定配置（加密+多路复用+自动发现）
use libp2p::{PeerId, multiaddr::Multiaddr};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct P2pConfig {
    pub listen_addr: Multiaddr,    // 监听地址
    pub keep_alive: bool,          // 长连接
    pub enable_mdns: bool,         // 自动发现
}

impl Default for P2pConfig {
    fn default() -> Self {
        Self {
            listen_addr: "/ip4/0.0.0.0/tcp/0".parse().unwrap(),
            keep_alive: true,
            enable_mdns: true,
        }
    }
}

// 全局节点状态
#[derive(Debug, Default)]
pub struct NodeState {
    pub peer_id: Option<PeerId>,
    pub discovered_peers: HashSet<PeerId>,
    pub connected_peers: HashSet<PeerId>,
}