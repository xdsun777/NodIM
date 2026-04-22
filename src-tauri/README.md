-   # 一、总体设计理念

    采用三种核心架构思想：

    1️⃣ **Clean Architecture（整洁架构）**

    ```
    UI
    ↓
    Application
    ↓
    Domain
    ↓
    Infrastructure
    ```

    2️⃣ **Rust Workspace 模块化**

    每个核心模块都是 **独立 crate**

    3️⃣ **事件驱动架构**

    IM系统内部全部通过 **event bus** 解耦。

    ------

    # 二、Workspace 项目结构（工业级）

    推荐使用 **Rust workspace monorepo**：

    ```
    workspace
    │
    ├── apps
    │   └── desktop
    │       └── tauri-app
    │
    ├── crates
    │
    │   ├── im-domain
    │   │
    │   ├── im-application
    │   │
    │   ├── im-infra
    │   │
    │   ├── p2p-core
    │   │
    │   ├── p2p-protocols
    │   │
    │   ├── crypto-core
    │   │
    │   ├── storage-core
    │   │
    │   └── event-bus
    │
    └── Cargo.toml
    ```

    优势：

    -   每个模块可单独测试
    -   编译更快
    -   逻辑清晰

    ------

    # 三、核心模块职责

    ## 1 p2p-core

    封装 P2P 网络节点。

    核心依赖：

    -   libp2p

    模块结构：

    ```
    p2p-core
    │
    ├── node
    │   └── node.rs
    │
    ├── behaviour
    │   └── behaviour.rs
    │
    ├── discovery
    │   ├── bootstrap.rs
    │   ├── mdns.rs
    │   └── kad.rs
    │
    ├── transport
    │
    ├── peer
    │   └── peer_manager.rs
    │
    └── connection
    ```
```

职责：

-   节点生命周期
-   连接管理
    -   peer管理
-   NAT穿透
    
------
    
    ## 2 p2p-protocols
    
    实现具体协议。

```
p2p-protocols
    │
├── chat
    │
├── group
    │
    ├── file
    │
├── presence
    │
└── sync
    ```
    
    例如：
    
    ```
chat
     ├── codec.rs
     ├── protocol.rs
     └── handler.rs
```
    
每个协议：
    
```
    encode
decode
    handle
    ```
    
------

# 四、libp2p 网络行为设计

    节点 behaviour：
    
    ```
    NetworkBehaviour
    │
    ├── Kademlia
├── Gossipsub
    ├── RequestResponse
├── Identify
    ├── Relay
├── AutoNAT
    └── Ping
```
    
职责：
    
    | 组件            | 用途    |
    | --------------- | ------- |
| Kademlia        | DHT     |
    | Gossipsub       | 群聊    |
| RequestResponse | 私聊    |
    | Relay           | NAT中继 |
    | AutoNAT         | NAT检测 |
    
------
    
# 五、im-domain（核心业务模型）
    
    Domain **不依赖任何外部库**。
    
结构：
    
```
    im-domain
│
    ├── identity
│
    ├── contact
    │
    ├── message
│
    ├── group
│
    ├── conversation
    │
    └── file
```
    
示例：
    
```
    message
 ├── entity.rs
     ├── value_objects.rs
 └── repository.rs
    ```
    
    示例实体：
    
    ```
pub struct Message {
        pub id: MessageId,
    pub sender: PeerId,
        pub receiver: PeerId,
    pub timestamp: i64,
        pub content: MessageContent,
}
    ```

    ------
    
    # 六、im-application（业务用例）
    
    Application 层实现 **use cases**。
    
    ```
im-application
    │
    ├── chat
    │
├── contact
    │
├── group
    │
└── file
    ```

    例如：
    
    ```
    chat
     ├── send_message.rs
 ├── receive_message.rs
     └── sync_messages.rs
```
    
    示例：
    
```
    SendMessageUseCase
```
    
    职责：
    
```
    验证
调用domain
    调用network
存储
    ```

    ------
    
    # 七、storage-core
    
    统一数据访问层。
    
    推荐数据库：
    
    -   SQLite
    
    结构：
    
    ```
storage-core
    │
    ├── db
    │
├── repositories
    │
└── migrations
    ```
    
    Repository 实现：
    
    ```
message_repo_sqlite
    contact_repo_sqlite
group_repo_sqlite
    ```

    ------
    
    # 八、crypto-core
    
    统一加密模块。
    
    推荐算法：

```
    x25519
chacha20poly1305
    ed25519
```

结构：
    
```
    crypto-core
│
    ├── identity
    │
    ├── encryption
│
    └── signatures
```

    职责：

```
    密钥生成
消息加密
    签名验证
```

------

# 九、事件总线

IM 系统内部必须事件驱动。
    
crate：
    
```
    event-bus
```

事件类型：
    
```
    PeerConnected
    PeerDisconnected
    MessageReceived
GroupMessageReceived
    FileReceived
```

    流程：

```
    network
↓
    event
    ↓
    application
↓
    UI
```

Rust实现：
    
```
    tokio broadcast
```

------

# 十、消息处理管线

    工业级 IM 必须 pipeline。

```
    Network
↓
    Decode
    ↓
    Decrypt
↓
    Validate
↓
    Store
↓
    EmitEvent
```

优点：
    
-   可扩展
    -   可插入过滤器

    ------
    
    # 十一、离线消息设计

    P2P系统常用方案：

    ### store nodes

    专门节点：

    ```
    message cache
    ```

    流程：

    ```
A send
    ↓
store node
    ↓
    B online
    ↓
pull
    ```

    TTL：
    
```
    3 ~ 7 days
```

------

# 十二、文件传输协议

文件不走聊天协议。
    
    独立协议：
    
    ```
    file protocol
```
    
流程：
    
```
    request
    ↓
    open stream
    ↓
    chunk transfer
    ```
    
    chunk：
    
    ```
    64KB
    ```
    
    支持：
    
    ```
    resume
    ```
    
    ------
    
    # 十三、桌面应用层
    
    桌面客户端：
    
    使用
    
    -   Tauri
    
    结构：
    
    ```
    tauri-app
    │
    ├── commands
    │
    ├── state
    │
    └── ui bridge
    ```
    
    前端调用：
    
    ```
    invoke("send_message")
    ```
    
    ------
    
    # 十四、系统启动流程
    
    ```
    load identity
    ↓
    start p2p node
    ↓
    connect bootstrap
    ↓
    init DHT
    ↓
    load contacts
    ↓
    connect peers
    ↓
    start protocols
    ```
    
    ------
    
    # 十五、消息发送流程
    
    ```
    UI
    ↓
    SendMessageUseCase
    ↓
    encrypt
    ↓
    p2p protocol
    ↓
    peer
    ↓
    decrypt
    ↓
    store
    ↓
    emit event
    ```
    
    ------
    
    # 十六、性能目标
    
    单节点目标：
    
    ```
    2000 peers500 msg/s<200ms latency
    ```
    
    ------
    
    # 十七、未来扩展能力
    
    架构支持扩展：
    
    ```
    voice chat
    video
    bots
    plugins
    ```
    
    甚至可以加入：
    
    -   IPFS 存储
    -   Matrix 互通
    
    ------
    
    # 十八、工业级项目的关键经验
    
    真正做 IM 系统时：
    
    最难的是：
    
    1️⃣ NAT穿透
     2️⃣ 离线消息
     3️⃣ 节点发现
     4️⃣ 消息顺序
     5️⃣ spam 防护
    
    ------
    
    ✅ **一句话总结这套架构**
    
    ```
    workspace
    ↓
    domain
    ↓
    application
    ↓
    infra (p2p + storage + crypto)
    ↓
    event bus
    ↓
    tauri UI
    ```







| 分类             | 组件 / 概念                               | 核心作用           | 关键能力                                                     |
| ---------------- | ----------------------------------------- | ------------------ | ------------------------------------------------------------ |
| **基础身份**     | Peer ID                                   | 节点唯一身份标识   | 基于公钥哈希，全网唯一，用于识别、认证、寻址                 |
|                  | PeerInfo                                  | 节点信息封装       | 包含 PeerID + 监听地址集合                                   |
|                  | Multiaddr                                 | 统一多协议地址格式 | 一条地址描述协议 + 地址 + 端口，如 `/ip4/1.2.3.4/tcp/4001/p2p/Qmxxx` |
| **传输层**       | Transports                                | 底层网络传输       | 支持 TCP、UDP、QUIC、WebTransport、WebRTC、WebSocket 等      |
|                  | Connection Upgrading                      | 连接升级           | 裸连接 → 加密 → 流复用 的标准化流程                          |
| **流复用**       | Stream Multiplexing (mplex/yamux)         | 单连接多逻辑流     | 一条 TCP/QUIC 承载多条独立双向流，避免频繁建连               |
| **安全通道**     | Security Channels                         | 节点加密与认证     | 实现 TLS 1.3、Noise 等加密协议，防窃听防伪造                 |
| **NAT 与穿越**   | NAT Traversal                             | 内网节点互通       | 支持 UPNP、NAT-PMP、autonat 检测                             |
|                  | Hole Punching                             | 点对点打洞         | 让两个内网节点直接建立连接                                   |
|                  | Circuit Relay                             | 中继转发           | 无法直连时通过第三方中继节点通信                             |
| **节点发现**     | Peer Discovery                            | 发现网络中其他节点 | 组播、mDNS、bootstrap 节点、随机漫步                         |
|                  | Rendezvous                                | 会合点服务         | 节点注册自己，其他节点通过会合点查询发现                     |
| **路由与寻址**   | Peer Routing                              | 查找节点地址       | 知道 PeerID 就能找到其监听地址                               |
|                  | Content Routing                           | 查找内容提供者     | 根据 CID 找到谁拥有该数据                                    |
|                  | Distributed Hash Table (DHT)              | 分布式哈希表       | Kademlia DHT，同时支持 Peer 路由 + 内容路由                  |
|                  | Pubsub (Gossipsub)                        | 发布 / 订阅广播    | 主题消息广播，可靠、可扩展、防篡改                           |
| **数据交换**     | Bitswap                                   | P2P 块交换协议     | 类似 BT 下载，请求 / 发送数据块，用于 IPFS                   |
|                  | Autorelay                                 | 自动中继           | 节点无法被直连时自动寻找并使用中继                           |
| **协议协商**     | Protocol Negotiation (multistream-select) | 协议握手与选择     | 双方协商支持的协议版本，确定通信格式                         |
| **连接管理**     | Connection Manager                        | 连接池管理         | 维护连接数量、修剪无用连接、保活                             |
|                  | Connection Gating                         | 连接防火墙         | 允许 / 拒绝特定节点、地址、协议的连接                        |
| **消息与可靠性** | Message Ordering & Reliability            | 流级可靠保证       | 基于流的有序可靠传输，类似 TCP 语义                          |
| **网络监测**     | Metrics & Observability                   | 监控与可观测性     | 连接数、流数、流量、延迟、错误率                             |






需求总结
目标：开发一个局域网内的 P2P 工具，具有以下功能：

自动发现局域网内其他客户端（通过 mDNS）。

群聊（广播消息，使用 Gossipsub）。

私聊（一对一消息，使用 Request-Response）。

文件传输（发送图片、文本、视频文件等，支持分块传输）。

技术栈：

后端：Rust + libp2p（版本 0.54.x）。

前端：Tauri（桌面应用框架），使用 JavaScript/TypeScript 构建 UI。

错误处理：

p2plib（独立的 P2P 通信库）使用 thiserror。

Tauri 命令模块使用 anyhow。

通信模型：

Tauri 前端通过 Tauri 命令（invoke）触发操作。

命令模块将请求转换为 P2pCommand 枚举，通过通道发送给后台运行的 P2P 节点任务。

P2P 节点任务产生 P2pEvent 事件，通过另一个通道发送给 Tauri 主循环，再由 app.emit 转发到前端。

代码组织：

p2p 模块：独立库，包含所有 libp2p 相关逻辑，导出 P2PNode、P2pCommand、P2pEvent 等。

commands 模块：Tauri 命令函数，调用 P2PNode 的方法。

lib.rs（移动端入口）和 main.rs（桌面端入口）：只负责初始化 Tauri 应用，设置状态，启动 P2P 节点任务，并转发事件到前端。

测试：提供独立的命令行测试程序，不依赖 Tauri，用于验证 p2plib 功能。

当前状态：

你希望我一步一步从头指导，不要一次性给出完整代码。

先确认需求，然后逐步实现每个模块，每步完成后可验证。

请确认以上总结是否准确，是否有遗漏或需要调整的地方？确认后，我们将从第一步：搭建项目结构，定义 p2plib 的错误类型和事件枚举开始。