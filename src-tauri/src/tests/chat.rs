use async_trait::async_trait;
use futures::SinkExt;
use std::{error::Error, iter, time::Duration};

use futures::{
    io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    prelude::*,
};
use libp2p::{
    Multiaddr, PeerId, Swarm, Transport,
    core::upgrade,
    gossipsub::{
        Behaviour as Gossipsub, ConfigBuilder, Event as GossipsubEvent, IdentTopic,
        MessageAuthenticity,
    },
    identity,
    mdns::{Event as MdnsEvent, tokio::Behaviour as Mdns},
    noise,
    request_response::{
        Behaviour as RequestResponse, Codec, Config, Event as RequestResponseEvent,
        Message as RequestResponseMessage, ProtocolSupport,
    },
    swarm::{Config as SwarmConfig, NetworkBehaviour, SwarmEvent},
    tcp, yamux,
};
use tokio::io::{self, AsyncBufReadExt, BufReader};

#[derive(Clone)]
struct ChatProtocol();

impl AsRef<str> for ChatProtocol {
    fn as_ref(&self) -> &str {
        "/nodim/chat/1"
    }
}

#[derive(Clone, Default)]
struct ChatCodec;

#[derive(Debug, Clone)]
struct ChatRequest(Vec<u8>);

#[derive(Debug, Clone)]
struct ChatResponse(Vec<u8>);

#[async_trait]
impl Codec for ChatCodec {
    type Protocol = ChatProtocol;
    type Request = ChatRequest;
    type Response = ChatResponse;

    async fn read_request<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Request>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatRequest(buf))
    }

    async fn read_response<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Response>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatResponse(buf))
    }

    async fn write_request<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        ChatRequest(data): ChatRequest,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        io.write_all(&data).await
    }

    async fn write_response<T>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        ChatResponse(data): ChatResponse,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        io.write_all(&data).await
    }
}

#[derive(NetworkBehaviour)]
#[behaviour(to_swarm = "Event")]
struct ChatBehaviour {
    gossipsub: Gossipsub,
    mdns: Mdns,
    req_res: RequestResponse<ChatCodec>,
}

#[derive(Debug)]
enum Event {
    Gossipsub(GossipsubEvent),
    Mdns(MdnsEvent),
    ReqRes(RequestResponseEvent<ChatRequest, ChatResponse>),
}

impl From<GossipsubEvent> for Event {
    fn from(e: GossipsubEvent) -> Self {
        Event::Gossipsub(e)
    }
}
impl From<MdnsEvent> for Event {
    fn from(e: MdnsEvent) -> Self {
        Event::Mdns(e)
    }
}
impl From<RequestResponseEvent<ChatRequest, ChatResponse>> for Event {
    fn from(e: RequestResponseEvent<ChatRequest, ChatResponse>) -> Self {
        Event::ReqRes(e)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let id_keys = identity::Keypair::generate_ed25519();
    let peer_id = PeerId::from(id_keys.public());
    println!("PeerId: {}", peer_id);

    let transport = tcp::tokio::Transport::new(tcp::Config::default())
        .upgrade(upgrade::Version::V1)
        .authenticate(noise::Config::new(&id_keys)?)
        .multiplex(yamux::Config::default())
        .boxed();

    let gossipsub_config = ConfigBuilder::default()
        .heartbeat_interval(Duration::from_secs(5))
        .build()?;

    let mut gossipsub = Gossipsub::new(
        MessageAuthenticity::Signed(id_keys.clone()),
        gossipsub_config,
    )?;

    let topic = IdentTopic::new("chat");
    gossipsub.subscribe(&topic)?;

    let mdns = Mdns::new(Default::default(), peer_id)?;

    let req_res = RequestResponse::new(
        iter::once((ChatProtocol(), ProtocolSupport::Full)),
        Config::default(),
    );

    let behaviour = ChatBehaviour {
        gossipsub,
        mdns,
        req_res,
    };

    let mut swarm = Swarm::new(
        transport,
        behaviour,
        peer_id,
        SwarmConfig::with_tokio_executor(),
    );

    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse::<Multiaddr>()?)?;

    // 读取用户输入
    let mut stdin = BufReader::new(io::stdin()).lines();

    loop {
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        println!("Listening on {address}");
                    }

                    SwarmEvent::Behaviour(Event::Mdns(event)) => match event {
                        MdnsEvent::Discovered(peers) => {
                            for (peer, _) in peers {
                                println!("discovered {peer}");
                            }
                        }
                        _ => {}
                    },

                    SwarmEvent::Behaviour(Event::Gossipsub(GossipsubEvent::Message {
                        propagation_source,
                        message,
                        ..
                    })) => {
                        println!(
                            "msg from {}: {}",
                            propagation_source,
                            String::from_utf8_lossy(&message.data)
                        );
                    }

                    SwarmEvent::Behaviour(Event::ReqRes(RequestResponseEvent::Message {
                        peer,
                        message,
                    })) => {
                        if let RequestResponseMessage::Request { request, .. } = message {
                            println!(
                                "private msg from {}: {}",
                                peer,
                                String::from_utf8_lossy(&request.0)
                            );
                        }
                        // 忽略响应（可扩展）
                    }

                    _ => {}
                }
            }

            line_result = stdin.next_line() => {
                match line_result {
                    Ok(Some(line)) => {
                        if line.is_empty() {
                            continue;
                        }

                        // 处理私聊命令
                        if let Some(stripped) = line.strip_prefix("/msg ") {
                            // 格式: /msg <peer_id> <消息>
                            if let Some((peer_id_str, msg)) = stripped.split_once(' ') {
                                match peer_id_str.parse::<PeerId>() {
                                    Ok(target) => {
                                        let request = ChatRequest(msg.as_bytes().to_vec());
                                        swarm.behaviour_mut().req_res.send_request(&target, request);
                                        println!("Private message sent to {}", target);
                                    }
                                    Err(_) => {
                                        eprintln!("Invalid peer ID: {}", peer_id_str);
                                    }
                                }
                            } else {
                                eprintln!("Usage: /msg <peer_id> <message>");
                            }
                        } else {
                            // 广播消息
                            match swarm.behaviour_mut().gossipsub.publish(topic.clone(), line.as_bytes()) {
                                Ok(_) => println!("Broadcast message sent"),
                                Err(e) => eprintln!("Failed to broadcast: {}", e),
                            }
                        }
                    }
                    Ok(None) => break, // stdin 关闭
                    Err(e) => eprintln!("Error reading stdin: {}", e),
                }
            }
        }
    }

    Ok(())
}