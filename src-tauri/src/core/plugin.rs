use async_trait::async_trait;
use crate::core::app::NodimApp;

// 插件通用接口（所有业务插件实现此接口）
#[async_trait]
pub trait NodimPlugin: Send + Sync {
    /// 插件唯一标识
    fn name(&self) -> &'static str;
    /// 插件安装（注册IPC/监听事件/调用组件）
    async fn install(&self, app: &mut NodimApp);
    /// 插件卸载（可选）
    fn uninstall(&self) -> Result<(), String> { Ok(()) }
}

// 组件通用接口（所有基础组件实现此接口）
#[async_trait]
pub trait NodimComponent: Send + Sync {
    /// 组件唯一标识
    fn name(&self) -> &'static str;
    /// 组件初始化（加载基础能力）
    async fn init(&self, app: &mut NodimApp);
}

// 插件管理器（微内核核心调度器）
pub struct PluginManager {
    plugins: Vec<Box<dyn NodimPlugin>>,
}

impl PluginManager {
    pub fn new() -> Self {
        Self { plugins: Vec::new() }
    }

    /// 注册插件
    pub fn register(&mut self, plugin: Box<dyn NodimPlugin>) {
        self.plugins.push(plugin);
    }

    /// 安装所有插件
    pub async fn install_all(&self, app: &mut NodimApp) {
        for plugin in &self.plugins {
            plugin.install(app).await;
            log::info!("插件 {} 安装完成", plugin.name());
        }
    }
}

// 组件管理器（微内核核心调度器）
pub struct ComponentManager {
    components: Vec<Box<dyn NodimComponent>>,
}

impl ComponentManager {
    pub fn new() -> Self {
        Self { components: Vec::new() }
    }

    /// 注册组件
    pub fn register(&mut self, component: Box<dyn NodimComponent>) {
        self.components.push(component);
    }

    /// 初始化所有组件
    pub async fn init_all(&self, app: &mut NodimApp) {
        for component in &self.components {
            component.init(app).await;
            log::info!("组件 {} 初始化完成", component.name());
        }
    }
}