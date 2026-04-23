pub mod behaviour;
pub mod codec;
pub mod error;
pub mod node;
pub mod transport;

// 重导出 libp2p 类型
pub use libp2p::{Multiaddr, PeerId};

// 重导出 Node 和 NodeEvent
pub use node::{Node, NodeEvent};