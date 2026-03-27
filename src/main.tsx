import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./integration"; // Initialize Mission Control API on window
import { initPlatform } from "./services/platform";

// Initialize platform (detects Tauri vs browser), then render
initPlatform().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
