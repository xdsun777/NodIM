use futures::StreamExt;
use libp2p::{
    gossipsub::{Event as GossipsubEvent, IdentTopic},
    mdns::Event as MdnsEvent,
    request_response::{Event as RequestResponseEvent, Message as RequestResponseMessage},
    swarm::{Swarm, Config as SwarmConfig, SwarmEvent},
    Multiaddr, PeerId,
};
use std::collections::HashSet;
use tokio::sync::{broadcast, mpsc, oneshot};

use super::{
    behaviour::{ChatBehaviour, Event},
    codec::ChatRequest,
    error::P2pError,
    transport::build_transport,
};

/// 内部命令类型
pub enum NodeCommand {
    GetLocalPeerId { reply: oneshot::Sender<PeerId> },
    GetDiscoveredPeers { reply: oneshot::Sender<Vec<PeerId>> },
    SendBroadcast { message: Vec<u8> },
    SendPrivate { peer: PeerId, message: Vec<u8> },
}

/// 对外发布的事件
#[derive(Debug, Clone)]
pub enum NodeEvent {
    NewListenAddr(Multiaddr),
    PeerDiscovered(PeerId),
    BroadcastMessage { from: PeerId, data: Vec<u8> },
    PrivateMessage { from: PeerId, data: Vec<u8> },
}

/// P2P 节点控制器
pub struct Node {
    command_tx: mpsc::Sender<NodeCommand>,
    event_rx: broadcast::Receiver<NodeEvent>,
    pub local_peer_id: PeerId,
}

impl Node {
    /// 创建并启动 P2P 节点
    pub async fn new() -> Result<Self, P2pError> {
        let id_keys = libp2p::identity::Keypair::generate_ed25519();
        let peer_id = PeerId::from(id_keys.public());
        let transport = build_transport(&id_keys)?;

        let topic = IdentTopic::new("chat");
        let behaviour = ChatBehaviour::new(&id_keys, peer_id, topic.clone())?;

        let mut swarm = Swarm::new(
            transport,
            behaviour,
            peer_id,
            SwarmConfig::with_tokio_executor(),
        );

        swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse::<Multiaddr>()?)?;

        let (cmd_tx, cmd_rx) = mpsc::channel(32);
        let (event_tx, event_rx) = broadcast::channel(32);

        let node = Node {
            command_tx: cmd_tx.clone(),
            event_rx: event_tx.subscribe(),
            local_peer_id: peer_id,
        };

        tokio::spawn(run_event_loop(swarm, cmd_rx, event_tx, topic));

        Ok(node)
    }

    /// 获取本地 PeerId
    pub fn local_peer_id(&self) -> PeerId {
        self.local_peer_id
    }

    /// 获取当前发现的节点列表
    pub async fn discovered_peers(&self) -> Result<Vec<PeerId>, P2pError> {
        let (tx, rx) = oneshot::channel();
        self.command_tx
            .send(NodeCommand::GetDiscoveredPeers { reply: tx })
            .await
            .map_err(|_| P2pError::ChannelSend)?;
        rx.await.map_err(|_| P2pError::ChannelReceive)
    }

    /// 广播消息
    pub async fn broadcast(&self, message: Vec<u8>) -> Result<(), P2pError> {
        self.command_tx
            .send(NodeCommand::SendBroadcast { message })
            .await
            .map_err(|_| P2pError::ChannelSend)
    }

    /// 发送私聊消息
    pub async fn send_private(&self, peer: PeerId, message: Vec<u8>) -> Result<(), P2pError> {
        self.command_tx
            .send(NodeCommand::SendPrivate { peer, message })
            .await
            .map_err(|_| P2pError::ChannelSend)
    }

    /// 订阅网络事件
    pub fn subscribe_events(&self) -> broadcast::Receiver<NodeEvent> {
        self.event_rx.resubscribe()
    }
}

/// 事件循环
async fn run_event_loop(
    mut swarm: Swarm<ChatBehaviour>,
    mut cmd_rx: mpsc::Receiver<NodeCommand>,
    event_tx: broadcast::Sender<NodeEvent>,
    topic: IdentTopic,
) {
    let mut discovered_peers: HashSet<PeerId> = HashSet::new();

    loop {
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        let _ = event_tx.send(NodeEvent::NewListenAddr(address));
                    }
                    SwarmEvent::Behaviour(Event::Mdns(MdnsEvent::Discovered(list))) => {
                        for (peer_id, _) in list {
                            if discovered_peers.insert(peer_id) {
                                let _ = event_tx.send(NodeEvent::PeerDiscovered(peer_id));
                            }
                        }
                    }
                    SwarmEvent::Behaviour(Event::Mdns(MdnsEvent::Expired(list))) => {
                        for (peer_id, _) in list {
                            discovered_peers.remove(&peer_id);
                        }
                    }
                    SwarmEvent::Behaviour(Event::Gossipsub(GossipsubEvent::Message {
                        propagation_source,
                        message,
                        ..
                    })) => {
                        let _ = event_tx.send(NodeEvent::BroadcastMessage {
                            from: propagation_source,
                            data: message.data,
                        });
                    }
                    SwarmEvent::Behaviour(Event::ReqRes(RequestResponseEvent::Message {
                        peer,
                        message: RequestResponseMessage::Request { request, .. },
                    })) => {
                        let _ = event_tx.send(NodeEvent::PrivateMessage {
                            from: peer,
                            data: request.0,
                        });
                    }
                    _ => {}
                }
            }
            Some(cmd) = cmd_rx.recv() => {
                match cmd {
                    NodeCommand::GetLocalPeerId { reply } => {
                        let _ = reply.send(*swarm.local_peer_id());
                    }
                    NodeCommand::GetDiscoveredPeers { reply } => {
                        let _ = reply.send(discovered_peers.iter().copied().collect());
                    }
                    NodeCommand::SendBroadcast { message } => {
                        let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), message);
                    }
                    NodeCommand::SendPrivate { peer, message } => {
                        swarm.behaviour_mut().req_res.send_request(&peer, ChatRequest(message));
                    }
                }
            }
        }
    }
}