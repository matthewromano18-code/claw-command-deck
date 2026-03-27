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
    Ok(Some(format!("config:{}", key)))
}

#[tauri::command]
pub async fn set_app_config(key: String, value: String) -> Result<(), String> {
    let _ = (key, value);
    Ok(())
}

// ─── OpenClaw Config File Operations ──────────────────────

#[tauri::command]
pub async fn read_openclaw_config() -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|_| "Cannot determine HOME directory".to_string())?;
    let path = format!("{}/.openclaw/openclaw.json", home);
    std::fs::read_to_string(&path).map_err(|e| format!("Cannot read config: {}", e))
}

#[tauri::command]
pub async fn write_openclaw_config(content: String) -> Result<(), String> {
    let home = std::env::var("HOME").map_err(|_| "Cannot determine HOME directory".to_string())?;
    let dir = format!("{}/.openclaw", home);
    std::fs::create_dir_all(&dir).map_err(|e| format!("Cannot create config dir: {}", e))?;
    let path = format!("{}/openclaw.json", dir);
    std::fs::write(&path, content).map_err(|e| format!("Cannot write config: {}", e))
}

#[tauri::command]
pub async fn gateway_restart() -> Result<ShellResult, String> {
    // Stop then start
    let _ = run_command("openclaw", &["gateway", "stop"]);
    std::thread::sleep(std::time::Duration::from_millis(500));
    run_command("openclaw", &["gateway", "start"])
}

#[tauri::command]
pub async fn openclaw_configure() -> Result<ShellResult, String> {
    run_command("openclaw", &["configure"])
}

#[tauri::command]
pub async fn check_cli_installed() -> Result<bool, String> {
    match Command::new("which").arg("openclaw").output() {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
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
