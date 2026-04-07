use anyhow::Result;
use libp2p::{PeerId, request_response::RequestResponseMessage};
use crate::p2p::node::SWARM;

// ====================== 补全缺失的 send() 函数 ======================
pub async fn send(peer_id: String, data: Vec<u8>) -> Result<Vec<u8>> {
    let peer_id = PeerId::parse(&peer_id)?;
    let mut swarm = SWARM.write().await;
    let swarm = swarm.as_mut().unwrap();

    // 发送请求
    let request_id = swarm.behaviour_mut().req_res.send_request(&peer_id, data);

    // 等待响应
    while let Some(event) = swarm.select_next_some().await.into() {
        if let libp2p::swarm::SwarmEvent::Behaviour(behaviour_event) = event {
            if let crate::p2p::node::NodeBehaviourEvent::ReqRes(res_event) = behaviour_event {
                if let libp2p::request_response::RequestResponseEvent::Message {
                    message: RequestResponseMessage::Response { response, .. },
                    ..
                } = res_event {
                    return Ok(response);
                }
            }
        }
    }

    Err(anyhow::anyhow!("发送失败，未收到响应"))
}