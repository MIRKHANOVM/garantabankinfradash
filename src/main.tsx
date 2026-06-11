import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeContext";
import { CapacityProvider } from "./context/CapacityContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <CapacityProvider>
        <App />
      </CapacityProvider>
    </ThemeProvider>
  </React.StrictMode>
);
