import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { PlayerProvider } from "./context/PlayerContext.tsx";
import BackgroundAnimation from "./components/BackgroundAnimation.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
    <PlayerProvider>
      <BackgroundAnimation />
      <App />
    </PlayerProvider>
  // </StrictMode>
);
