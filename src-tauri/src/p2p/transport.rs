use libp2p::{
    core::{muxing::StreamMuxerBox, upgrade, Transport},
    identity, noise, tcp, yamux, PeerId,
};

pub fn build_transport(
    keypair: &identity::Keypair,
) -> std::io::Result<libp2p::core::transport::Boxed<(PeerId, StreamMuxerBox)>> {
    // 将 noise::Error 映射为 std::io::Error
    let noise_config = noise::Config::new(keypair)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

    let transport = tcp::tokio::Transport::new(tcp::Config::default())
        .upgrade(upgrade::Version::V1)
        .authenticate(noise_config)
        .multiplex(yamux::Config::default())
        .boxed();
    Ok(transport)
}