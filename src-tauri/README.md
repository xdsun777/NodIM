```text
src-tauri/src/
├── core/                 # 微内核（只做调度，无业务/无基础能力）
│   ├── app.rs            # 应用宿主（全局上下文、生命周期）
│   ├── plugin.rs         # 插件管理器（注册/安装/卸载插件）
│   ├── event.rs          # 全局事件总线（插件/组件通信）
│   └── lib.rs            # 内核对外暴露的核心接口
├── components/           # 基础通用组件（无业务，可复用）
│   ├── agent/            # 通信Agent（自适应P2P/中继/中心路由）
│   │   ├── mod.rs
│   │   ├── router.rs     # 智能路由选择
│   │   └── service.rs    # 通信服务抽象/实现
│   ├── net/              # P2P网络基础能力（libp2p封装）
│   │   ├── mod.rs
│   │   ├── swarm.rs      # Swarm管理
│   │   └── peer.rs       # PeerID/连接管理
│   ├── ipc/              # IPC基础能力（命令注册/分发）
│   │   ├── mod.rs
│   │   └── handler.rs    # IPC处理器
│   ├── crypto/           # 加密基础能力（Noise/密钥管理）
│   │   ├── mod.rs
│   │   └── key.rs        # 密钥生成/加解密
│   ├── store/            # 本地存储基础能力（KV/持久化）
│   │   ├── mod.rs
│   │   └── kv.rs         # KV存储接口
│   └── logger/           # 日志基础能力
│       └── mod.rs
├── plugins/              # 业务插件（纯逻辑，依赖内核+组件）
│   ├── message/          # 消息插件
│   │   ├── mod.rs
│   │   └── ipc.rs        # 消息相关IPC注册
│   ├── contact/          # 联系人插件
│   │   └── mod.rs
│   ├── call/             # 音视频插件
│   │   └── mod.rs
│   └── settings/         # 设置插件
│       └── mod.rs
└── main.rs               # 应用入口（仅初始化内核+加载组件/插件）
```

## Tauri可用插件
```
https://github.com/tauri-apps/plugins-workspace
```