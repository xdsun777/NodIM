use async_trait::async_trait;
use std::{error::Error, sync::Mutex};

use futures::{
    io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    prelude::*,
};
use libp2p::{
    Multiaddr, PeerId, Transport,
    gossipsub::{Behaviour, ConfigBuilder, Event, IdentTopic, MessageAuthenticity},
    identity,
    mdns::{Event as MdnsEvent, tokio::Behaviour as Mdns},
    noise,
    request_response::{
        Behaviour as RequestResponse, Codec, Config, Event as RequestResponseEvent, ProtocolSupport,
    },
    swarm::{NetworkBehaviour, Swarm, SwarmEvent},
    tcp, yamux,
};
use tauri::Emitter;

// 全局状态
static TAURI_APP: Mutex<Option<tauri::AppHandle>> = Mutex::new(None);
static SWARM: Mutex<Option<Swarm<ChatBehaviour>>> = Mutex::new(None);

#[derive(Clone)]
pub struct ChatProtocol;
impl AsRef<str> for ChatProtocol {
    fn as_ref(&self) -> &str {
        "/chat/1"
    }
}

#[derive(Clone, Default)]
pub struct ChatCodec;

#[derive(Debug, Clone)]
pub struct ChatRequest(Vec<u8>);
#[derive(Debug, Clone)]
pub struct ChatResponse(Vec<u8>);

#[async_trait]
impl Codec for ChatCodec {
    type Protocol = ChatProtocol;
    type Request = ChatRequest;
    type Response = ChatResponse;

    async fn read_request<T: AsyncRead + Unpin + Send>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Request> {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatRequest(buf))
    }

    async fn read_response<T: AsyncRead + Unpin + Send>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Response> {
        let mut buf = Vec::new();
        io.read_to_end(&mut buf).await?;
        Ok(ChatResponse(buf))
    }

    async fn write_request<T: AsyncWrite + Unpin + Send>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        data: ChatRequest,
    ) -> std::io::Result<()> {
        io.write_all(&data.0).await
    }

    async fn write_response<T: AsyncWrite + Unpin + Send>(
        &mut self,
        _: &Self::Protocol,
        io: &mut T,
        data: ChatResponse,
    ) -> std::io::Result<()> {
        io.write_all(&data.0).await
    }
}

#[derive(NetworkBehaviour)]
#[behaviour(to_swarm = "ChatEvent")]
pub struct ChatBehaviour {
    pub gossipsub: Behaviour,
    pub mdns: Mdns,
    pub req_res: RequestResponse<ChatCodec>,
}

#[derive(Debug)]
pub enum ChatEvent {
    Gossipsub(Event),
    Mdns(MdnsEvent),
    ReqRes(RequestResponseEvent<ChatRequest, ChatResponse>),
}

impl From<Event> for ChatEvent {
    fn from(e: Event) -> Self {
        Self::Gossipsub(e)
    }
}
impl From<MdnsEvent> for ChatEvent {
    fn from(e: MdnsEvent) -> Self {
        Self::Mdns(e)
    }
}
impl From<RequestResponseEvent<ChatRequest, ChatResponse>> for ChatEvent {
    fn from(e: RequestResponseEvent<ChatRequest, ChatResponse>) -> Self {
        Self::ReqRes(e)
    }
}

// ------------- 命令只在这里出现一次，无重复 -------------

async fn run_libp2p_loop() {
    let swarm = SWARM.lock().unwrap().take().unwrap();
    let app = TAURI_APP.lock().unwrap().clone().unwrap();
    let mut swarm = swarm;

    loop {
        match swarm.select_next_some().await {
            SwarmEvent::Behaviour(ChatEvent::Gossipsub(Event::Message { message, .. })) => {
                let _ = app.emit("remote-video-frame", message.data);
            }
            SwarmEvent::Behaviour(ChatEvent::Mdns(MdnsEvent::Discovered(list))) => {
                for (peer, _) in list {
                    println!("发现节点: {}", peer);
                }
            }
            _ => {}
        }
    }
}

#[tauri::command]
fn send_video_frame(data: Vec<u8>) {
    if let Ok(mut swarm) = SWARM.try_lock() {
        if let Some(swarm) = swarm.as_mut() {
            let topic = IdentTopic::new("chat");
            let _ = swarm.behaviour_mut().gossipsub.publish(topic, data);
        }
    }
}

pub async fn app_run() -> Result<(), Box<dyn Error>> {
    let id_keys = identity::Keypair::generate_ed25519();
    let peer_id = PeerId::from(id_keys.public());
    println!("Peer ID: {}", peer_id);

    let transport = tcp::tokio::Transport::new(tcp::Config::default())
        .upgrade(libp2p::core::upgrade::Version::V1)
        .authenticate(noise::Config::new(&id_keys)?)
        .multiplex(yamux::Config::default())
        .boxed();

    let gossipsub_config = ConfigBuilder::default().build().unwrap();
    let mut gossipsub = Behaviour::new(
        MessageAuthenticity::Signed(id_keys.clone()),
        gossipsub_config,
    )
    .unwrap();

    gossipsub.subscribe(&IdentTopic::new("chat")).unwrap();

    // ------------- 修复：去掉 .await -------------
    let mdns = Mdns::new(Default::default(), peer_id)?;

    let req_res = RequestResponse::new(
        std::iter::once((ChatProtocol, ProtocolSupport::Full)),
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
        libp2p::swarm::Config::with_tokio_executor(),
    );
    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse::<Multiaddr>()?)?;

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_video_frame])
        .setup(move |app| {
            *TAURI_APP.lock().unwrap() = Some(app.handle().clone());
            *SWARM.lock().unwrap() = Some(swarm);
            tokio::spawn(run_libp2p_loop());
            Ok(())
        })
        .run(tauri::generate_context!())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
async fn run()-> Result<(), Box<dyn std::error::Error>> {
    app_run().await
}
