use thiserror::Error;
use libp2p::{multiaddr, TransportError};

#[derive(Debug, Error)]
pub enum P2pError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Channel send failed")]
    ChannelSend,
    #[error("Channel receive failed")]
    ChannelReceive,
    #[error("Invalid PeerId")]
    InvalidPeerId,
    #[error("Multiaddr parsing error: {0}")]
    Multiaddr(#[from] multiaddr::Error),
    #[error("Transport error: {0}")]
    Transport(#[from] TransportError<std::io::Error>),
    #[error("Libp2p behaviour error: {0}")]
    Behaviour(#[from] Box<dyn std::error::Error + Send + Sync>),
    #[error("Other error: {0}")]
    Other(#[from] Box<dyn std::error::Error>),
}