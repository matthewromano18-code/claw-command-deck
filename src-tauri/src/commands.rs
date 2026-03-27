use serde::{Deserialize, Serialize};
use std::process::Command;

// ─── Gateway Process Status ────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct GatewayProcessStatus {
    pub installed: bool,
    pub running: bool,
    pub version: Option<String>,
    pub pid: Option<u32>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShellResult {
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

// ─── Gateway Commands ──────────────────────────────────────

#[tauri::command]
pub async fn gateway_status() -> Result<GatewayProcessStatus, String> {
    match Command::new("openclaw").args(["gateway", "status"]).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            Ok(GatewayProcessStatus {
                installed: true,
                running: output.status.success(),
                version: if output.status.success() {
                    Some(stdout.trim().to_string())
                } else {
                    None
                },
                pid: None,
                error: if !output.status.success() {
                    Some(stderr)
                } else {
                    None
                },
            })
        }
        Err(_) => Ok(GatewayProcessStatus {
            installed: false,
            running: false,
            version: None,
            pid: None,
            error: Some("openclaw binary not found".to_string()),
        }),
    }
}

#[tauri::command]
pub async fn gateway_install() -> Result<ShellResult, String> {
    run_command("openclaw", &["gateway", "install"])
}

#[tauri::command]
pub async fn gateway_start() -> Result<ShellResult, String> {
    run_command("openclaw", &["gateway", "start"])
}

#[tauri::command]
pub async fn gateway_stop() -> Result<ShellResult, String> {
    run_command("openclaw", &["gateway", "stop"])
}

#[tauri::command]
pub async fn openclaw_status() -> Result<ShellResult, String> {
    run_command("openclaw", &["status"])
}

// ─── App Config ────────────────────────────────────────────

#[tauri::command]
pub async fn get_app_config(key: String) -> Result<Option<String>, String> {
    // Reads from tauri-plugin-store are done on the JS side.
    // This command is a placeholder for any native-only config.
    Ok(Some(format!("config:{}", key)))
}

#[tauri::command]
pub async fn set_app_config(key: String, value: String) -> Result<(), String> {
    let _ = (key, value);
    Ok(())
}

// ─── Helpers ───────────────────────────────────────────────

fn run_command(program: &str, args: &[&str]) -> Result<ShellResult, String> {
    match Command::new(program).args(args).output() {
        Ok(output) => Ok(ShellResult {
            code: output.status.code().unwrap_or(-1),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        }),
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}
