import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./i18n";
import { useStore } from "./store/useStore";

useStore.getState().initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 1500 }} />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
