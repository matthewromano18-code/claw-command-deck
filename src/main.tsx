import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./integration"; // Initialize Mission Control API on window

createRoot(document.getElementById("root")!).render(<App />);
