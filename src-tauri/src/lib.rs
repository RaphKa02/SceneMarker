use std::env;
use tauri::{Emitter, Manager};

mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            utils::logger,
            utils::write_logs,
            utils::create_logs_dir
        ])
        .setup(|app| {
            // Hol dir die Command Line Argumente
            let args: Vec<String> = env::args().collect();

            println!("Args: {:?}", args);

            // Wenn eine Datei übergeben wurde (z.B. per Doppelklick)
            if args.len() > 1 {
                let file_path = &args[1];

                if let Some(window) = app.get_webview_window("main") {
                    window.emit("file-opened", file_path).unwrap();
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
