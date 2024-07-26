import { HashRouter, Route, Routes } from "react-router-dom";
import React from "react";
import AuthGuard from "./Auth.guard";
import ConnectRequest from "./connect_request/ConnectRequest";
import SignMessage from "./sign_message/SignMessage";
import SignPayload from "./sign_payload";

function Notification() {
  return (
    <React.StrictMode>
      <HashRouter>
        <AuthGuard>
          <Routes>
            <Route path="connect" element={<ConnectRequest />} />
            <Route path="sign-message" element={<SignMessage />} />
            <Route path="sign-payload" element={<SignPayload />} />
          </Routes>
        </AuthGuard>
      </HashRouter>
    </React.StrictMode>
  );
}

export default Notification;
