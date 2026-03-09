use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

type EventHandler = Box<dyn Fn(Option<serde_json::Value>) + Send + Sync>;

/// 全局事件总线（微内核核心能力）
#[derive(Clone)]
pub struct EventBus {
    handlers: Arc<RwLock<HashMap<String, Vec<EventHandler>>>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self {
            handlers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 监听事件
    pub async fn on<F>(&self, event_name: &str, handler: F)
    where
        F: Fn(Option<serde_json::Value>) + Send + Sync + 'static,
    {
        let mut handlers = self.handlers.write().await;
        handlers.entry(event_name.to_string())
            .or_insert_with(Vec::new)
            .push(Box::new(handler));
    }

    /// 触发事件
    pub async fn emit(&self, event_name: &str, data: impl Into<Option<serde_json::Value>>) {
        let data = data.into();
        let handlers = self.handlers.read().await;
        if let Some(handlers) = handlers.get(event_name) {
            for handler in handlers {
                handler(data.clone());
            }
        }
    }
}