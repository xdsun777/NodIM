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