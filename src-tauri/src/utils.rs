use std::fs;
use std::io::Write;

#[tauri::command]
pub fn logger(message: String, time: String, kind: &str) {
    match kind {
        "log" => println!(
            "\x1b[32m[SceneMarker LOG] \x1b[34m({}) \x1b[37m{}",
            time, message
        ),
        "warn" => println!(
            "\x1b[33m[SceneMarker WARN] \x1b[34m({}) \x1b[37m{}",
            time, message
        ),
        "error" => println!(
            "\x1b[31m[SceneMarker ERROR] \x1b[34m({}) \x1b[37m{}",
            time, message
        ),
        &_ => println!(
            "\x1b[31m[SceneMarker LOG] \x1b[34m({}) \x1b[37m{}",
            time, message
        ),
    }
}

#[tauri::command]
pub fn create_logs_dir(path: String) {
    fs::create_dir_all(path).unwrap();
}

#[tauri::command]
pub fn write_logs(name: String, message: String) {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .append(true)
        .create(true)
        .open(name)
        .unwrap();

    write!(file, "{}", message).unwrap();
}
