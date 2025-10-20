use std::env;

use tauri::Manager;

mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            utils::get_args,
            utils::logger,
            utils::write_logs,
            utils::create_logs_dir
        ])
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::Destroyed => {
                if window.label() == "main" {
                    let app = window.app_handle();
                    for (_label, w) in app.webview_windows() {
                        let _ = w.destroy();
                    }
                    app.exit(0);
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
