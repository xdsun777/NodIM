use libp2p::PeerId;

#[derive(Debug, Clone)]
pub enum P2pEvent {
    /// 本地监听地址更新
    LocalAddresses(Vec<String>),
    /// 在线节点列表变化 (所有 PeerId 字符串)
    PeersChanged(Vec<String>),
    /// 收到群聊消息 (来源 PeerId, 消息内容)
    BroadcastMessage(PeerId, String),
    /// 收到私聊消息 (来源 PeerId, 消息内容)
    PrivateMessage(PeerId, String),
    /// 文件接收进度 (来源 PeerId, 会话ID, 当前块, 总块数)
    FileProgress(PeerId, u64, u32, u32),
    /// 文件接收完成 (来源 PeerId, 文件名, 保存路径)
    FileReceived(PeerId, String, String),
}