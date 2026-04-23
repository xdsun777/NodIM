mod commands;
pub mod p2p;

use tauri::Manager; // 必须导入此 trait 才能调用 app_handle()

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(async {
        tauri::Builder::default()
            .plugin(tauri_plugin_os::init())
            .invoke_handler(tauri::generate_handler![
                commands::get_local_peer_id,
                commands::get_discovered_peers,
                commands::send_broadcast,
                commands::send_private_msg
            ])
            .setup(|app| {
                let app_handle = app.app_handle().clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = commands::setup_p2p(app_handle).await {
                        eprintln!("Failed to setup P2P: {}", e);
                    }
                });
                Ok(())
            })
            .run(tauri::generate_context!())
            .expect("Tauri 启动失败");

        Ok(())
    })
}