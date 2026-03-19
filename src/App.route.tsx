import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "@features/wallet/home/Home";
import AuthGuard from "./Auth.guard";
import AccountCreation from "./welcome/AccountCreation";
import WalletList from "@features/wallet/wallet_list/WalletList";
import Settings from "@features/settings/settings/Settings";
import SignUp from "./sign_up/SignUp";
import ShowPrivateKey from "@features/settings/show_private_key/ShowPrivateKey";
import ImportToken from "@features/wallet/import_token/ImportToken";
import ImportNFT from "@features/wallet/import_nft/ImportNFT";
import HelpCenter from "@features/settings/help_center/HelpCenter";
import ConnectedSites from "@features/settings/connected_sites/ConnectedSites";
import ImportPrivateKey from "@features/wallet/import_private_key/ImportPrivateKey";
import CreateAccount from "@features/wallet/create_account/CreateAccount";
import ShowRecoveryPhase from "@features/settings/show_recovery_phrase/ShowRecoveryPhase";
import SendToken from "@features/wallet/send_token/SendToken";
import SelectTokenSend from "@features/wallet/send_token/SelectTokenSend";
import TransferComplete from "@features/wallet/send_token/TransferComplete";
import Receive from "@features/wallet/receive/Receive";
import "react-loading-skeleton/dist/skeleton.css";
import SendNFT from "@features/wallet/send_nft/SendNFT";
import TransactionDetails from "./TransactionDetails";
import Identity from "./identity/Identity";
import DevNetworks from "@features/settings/dev_networks/DevNetworks";
import AirdropEligibility from "./airdrop_checker/AirdropEligibility";
import MainLayout from "./layouts/MainLayout";
import Transactions from "@features/transactions/Transactions";
// import Portfolio from "@features/nlo/Portfolio";
import NLOWelcome from "@features/nlo/NLOWelcome";
import NLOLearn from "@features/nlo/NLOLearn";
import NLONameAgent from "@features/nlo/NLONameAgent";
import NLODemo from "@features/nlo/NLODemo";
import NLOKnowMore from "@features/nlo/NLOKnowMore";
import NLOEditWallet from "@features/nlo/NLOEditWallet";
import NewPosition from "@features/nlo/NewPosition";
import SelectDepositToken from "@features/nlo/SelectDepositToken";
import DepositProgress from "@features/nlo/DepositProgress";
import PositionsActive from "@features/nlo/PositionsActive";
import PositionDetails from "@features/nlo/PositionDetails";
import StrategyDetail from "@features/nlo/StrategyDetail";
import WithdrawCapital from "@features/nlo/WithdrawCapital";
import ExitPosition from "@features/nlo/ExitPosition";
import TransferProcessing from "@features/nlo/TransferProcessing";
import WithdrawalComplete from "@features/nlo/WithdrawalComplete";
import WithdrawalFailed from "@features/nlo/WithdrawalFailed";
import NLOWallet from "@features/nlo/NLOWallet";
import ILScan from "@features/il_scan/ILScan";
import ManageNetworks from "@features/settings/manage_networks/ManageNetworks";
import AddEditNetwork from "@features/settings/manage_networks/AddEditNetwork";
import AddCustomNetwork from "@features/settings/manage_networks/AddCustomNetwork";

const App = () => {

  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            {/* Main tabs with bottom navigation */}
            <Route element={<MainLayout />}>
              <Route path="/index.html" element={<Home />} />
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              {/* <Route path="/portfolio" element={<Portfolio />} /> */}
              <Route path="/portfolio" element={<ILScan />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/nlo-welcome" element={<NLOWelcome />} />
            </Route>

            {/* Sub-pages without bottom navigation */}
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/welcome" element={<AccountCreation />} />
            <Route path="/wallet-list" element={<WalletList />} />
            <Route path="/recovery-phase" element={<ShowRecoveryPhase />} />
            <Route path="/show-private-key" element={<ShowPrivateKey />} />
            <Route path="/import-token" element={<ImportToken />} />
            <Route path="/import-nft" element={<ImportNFT />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/connected-sites" element={<ConnectedSites />} />
            <Route path="/import-private-key" element={<ImportPrivateKey />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/select-token-send" element={<SelectTokenSend />} />
            <Route path="/send-token" element={<SendToken />} />
            <Route path="/transfer-complete" element={<TransferComplete />} />
            <Route path="/receive" element={<Receive />} />
            <Route path="/send-nft" element={<SendNFT />} />
            <Route path="/nlo-learn" element={<NLOLearn />} />
            <Route path="/nlo-demo" element={<NLODemo />} />
            <Route path="/nlo-know-more" element={<NLOKnowMore />} />
            <Route path="/nlo-edit-wallet" element={<NLOEditWallet />} />
            <Route path="/nlo-name-agent" element={<NLONameAgent />} />
            <Route path="/new-position" element={<NewPosition />} />
            <Route path="/nlo-select-token" element={<SelectDepositToken />} />
            <Route path="/deposit-progress" element={<DepositProgress />} />
            <Route path="/positions-active" element={<PositionsActive />} />
            <Route path="/position-details/:id" element={<PositionDetails />} />
            <Route path="/strategy-detail/:id" element={<StrategyDetail />} />
            <Route path="/withdraw" element={<WithdrawCapital />} />
            <Route path="/exit-position/:id" element={<ExitPosition />} />
            <Route path="/transfer-processing" element={<TransferProcessing />} />
            <Route path="/withdrawal-complete" element={<WithdrawalComplete />} />
            <Route path="/withdrawal-failed" element={<WithdrawalFailed />} />
            <Route path="/nlo-wallet" element={<NLOWallet />} />
            <Route path="/identity" element={<Identity />} />
            <Route path="/select-networks" element={<DevNetworks />} />
            <Route path="/manage-networks" element={<ManageNetworks />} />
            <Route path="/edit-network/:chainId" element={<AddEditNetwork />} />
            <Route path="/add-network" element={<AddCustomNetwork />} />
            <Route path="/airdrop-eligibility" element={<AirdropEligibility />} />
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
