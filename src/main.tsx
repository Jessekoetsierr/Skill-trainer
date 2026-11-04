import { createRoot } from "react-dom/client";
import "coachman-ui/fonts.css";
import "coachman-ui/tokens.css";
import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
