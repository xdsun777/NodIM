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
