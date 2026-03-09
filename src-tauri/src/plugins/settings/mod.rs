// src-tauri/src/
// ├── core/             # 内核：应用骨架、生命周期、插件系统
// ├── components/       # 通用组件：网络、存储、加密、IPC、日志等（无业务）
// └── plugin/           # 纯业务插件：只依赖 core + components

// components/
// ├── net/              # P2P 网络、Swarm、连接管理
// ├── ipc/              # IPC 调度、命令注册
// ├── agent/            # 通信智能代理（你要的核心！）
// ├── crypto/           # 加密、密钥、签名
// ├── store/            # 本地存储 KV
// ├── config/           # 配置管理
// └── log/              # 日志

// components/
// └── agent/
//     ├── mod.rs           # 代理入口
//     ├── types.rs         # 消息类型、路由策略
//     ├── router.rs        # 智能路由选择（直连/中继/中心）
//     ├── service.rs       # 通信服务抽象 trait
//     └── dispatcher.rs    # IPC 调用自动分发