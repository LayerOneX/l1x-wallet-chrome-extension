import React from "react";
import ReactDOM from "react-dom/client";
import Notification from "./Notification.route.tsx";
import "./App.css"
import 'react-loading-skeleton/dist/skeleton.css'
ReactDOM.createRoot(document.getElementById("root-notification")!).render(
  <React.StrictMode>
      <Notification />
  </React.StrictMode>
);
