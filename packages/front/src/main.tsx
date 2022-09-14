import "./index.css";
import React from "react";
import { App } from "@/components";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { WalletSelectorContextProvider } from "@/utils/context/wallet";
import { WalletSelectorModal } from "@/components/modals/wallet";
import Buffer from "node:buffer";

// TODO: Find a better way to handle this buffer error
window.Buffer = window.Buffer || Buffer;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletSelectorContextProvider>
      <App />
      <Toaster />
      <WalletSelectorModal />
    </WalletSelectorContextProvider>
  </React.StrictMode>
);
