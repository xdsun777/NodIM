use super::codec::{ChatCodec, ChatProtocol, ChatRequest, ChatResponse};
use libp2p::{
    Multiaddr, PeerId, Swarm, Transport,
    gossipsub::{
        Behaviour as Gossipsub, ConfigBuilder, Event as GossipsubEvent, IdentTopic,
        MessageAuthenticity,
    },
    mdns::{Event as MdnsEvent, tokio::Behaviour as Mdns},
    request_response::{
        Behaviour as RequestResponse, Codec, Config, Event as RequestResponseEvent,
        Message as RequestResponseMessage, ProtocolSupport,
    },
    swarm::{Config as SwarmConfig, NetworkBehaviour, SwarmEvent},
};
use tokio::io::{self, AsyncBufReadExt, BufReader};

#[derive(NetworkBehaviour)]
#[behaviour(to_swarm = "ChatEvent")]
pub struct ChatBehaviour {
    pub gossipsub: gossipsub::Gossipsub,
    pub mdns: mdns::tokio::Mdns,
    pub req_res: request_response::RequestResponse<ChatCodec>,
}

#[derive(Debug)]
pub enum ChatEvent {
    Gossipsub(gossipsub::Event),
    Mdns(mdns::Event),
    ReqRes(request_response::Event<ChatRequest, ChatResponse>),
}

impl From<gossipsub::Event> for ChatEvent {
    fn from(e: gossipsub::Event) -> Self {
        Self::Gossipsub(e)
    }
}
impl From<mdns::Event> for ChatEvent {
    fn from(e: mdns::Event) -> Self {
        Self::Mdns(e)
    }
}
impl From<request_response::Event<ChatRequest, ChatResponse>> for ChatEvent {
    fn from(e: request_response::Event<ChatRequest, ChatResponse>) -> Self {
        Self::ReqRes(e)
    }
}
