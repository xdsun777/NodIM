use libp2p::{
    gossipsub::{
        self, ConfigBuilder, IdentTopic, MessageAuthenticity,
    },
    mdns::tokio::Behaviour as Mdns,mdns,
    request_response::{self, ProtocolSupport},
    swarm::NetworkBehaviour,
    PeerId,
};
use std::{iter, time::Duration};

use super::codec::{ChatCodec, ChatProtocol, ChatRequest, ChatResponse};

#[derive(NetworkBehaviour)]
#[behaviour(to_swarm = "Event")]
pub struct ChatBehaviour {
    pub gossipsub: gossipsub::Behaviour,
    pub mdns: Mdns,
    pub req_res: request_response::Behaviour<ChatCodec>,
}

#[derive(Debug)]
pub enum Event {
    Gossipsub(gossipsub::Event),
    Mdns(mdns::Event),
    ReqRes(request_response::Event<ChatRequest, ChatResponse>),
}

impl From<gossipsub::Event> for Event {
    fn from(e: gossipsub::Event) -> Self {
        Event::Gossipsub(e)
    }
}

impl From<mdns::Event> for Event {
    fn from(e: mdns::Event) -> Self {
        Event::Mdns(e)
    }
}

impl From<request_response::Event<ChatRequest, ChatResponse>> for Event {
    fn from(e: request_response::Event<ChatRequest, ChatResponse>) -> Self {
        Event::ReqRes(e)
    }
}

impl ChatBehaviour {
    pub fn new(
        keypair: &libp2p::identity::Keypair,
        peer_id: PeerId,
        topic: IdentTopic,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let gossipsub_config = ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(5))
            .build()?;

        let mut gossipsub = gossipsub::Behaviour::new(
            MessageAuthenticity::Signed(keypair.clone()),
            gossipsub_config,
        )?;
        gossipsub.subscribe(&topic)?;

        let mdns = Mdns::new(Default::default(), peer_id)?;

        let req_res = request_response::Behaviour::new(
            iter::once((ChatProtocol(), ProtocolSupport::Full)),
            request_response::Config::default(),
        );

        Ok(Self {
            gossipsub,
            mdns,
            req_res,
        })
    }
}