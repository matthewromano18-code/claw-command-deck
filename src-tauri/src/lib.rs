use tauri::Manager;

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::gateway_status,
            commands::gateway_install,
            commands::gateway_start,
            commands::gateway_stop,
            commands::openclaw_status,
            commands::get_app_config,
            commands::set_app_config,
        ])
        .setup(|app| {
            // Ensure the main window is focused on launch
            if let Some(window) = app.get_webview_window("main") {
                window.set_focus().ok();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Mission Control");
}
