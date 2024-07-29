import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./home/Home";
import AuthGuard from "./Auth.guard";
import AccountCreation from "./welcome/AccountCreation";
import WalletList from "./wallet_list/WalletList";
import Settings from "./settings/Settings";
import SignUp from "./sign_up/SignUp";
import ShowPrivateKey from "./show_private_key/ShowPrivateKey";
import ImportToken from "./import_token/ImportToken";
import ImportNFT from "./import_nft/ImportNFT";
import HelpCenter from "./help_center/HelpCenter";
import ConnectedSites from "./connected_sites/ConnectedSites";
import ImportPrivateKey from "./import_private_key/ImportPrivateKey";
import CreateAccount from "./create_account/CreateAccount";
import ShowRecoveryPhase from "./show_recovery_phrase/ShowRecoveryPhase";
import SendToken from "./send_token/SendToken";
import "react-loading-skeleton/dist/skeleton.css";
import SendNFT from "./send_nft/SendNFT";
import TransactionDetails from "./TransactionDetails";
import Identity from "./identity/Identity";
import DevNetworks from "./dev_networks/DevNetworks";
function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            <Route path="/index.html" element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/welcome" element={<AccountCreation />} />
            <Route path="/wallet-list" element={<WalletList />} />
            <Route path="/recovery-phase" element={<ShowRecoveryPhase />} />
            <Route path="/show-private-key" element={<ShowPrivateKey />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import-token" element={<ImportToken />} />
            <Route path="/import-nft" element={<ImportNFT />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/connected-sites" element={<ConnectedSites />} />
            <Route path="/import-private-key" element={<ImportPrivateKey />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/send-token" element={<SendToken />} />
            <Route path="/send-nft" element={<SendNFT />} />
            <Route path="/identity" element={<Identity />} />
            <Route path="/select-networks" element={<DevNetworks />} />
            <Route
              path="/transaction-details/:hash"
              element={<TransactionDetails />}
            />
          </Routes>
        </AuthGuard>
      </BrowserRouter>
    </React.StrictMode>
  );
}

export default App;
