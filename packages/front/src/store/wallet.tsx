import { create } from "zustand";
import {
  setupWalletSelector,
  WalletSelector,
} from "@near-wallet-selector/core";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupWelldoneWallet } from "@near-wallet-selector/welldone-wallet";
import { setupXDEFI } from "@near-wallet-selector/xdefi";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { useEnv } from "@/hooks/useEnv";
import { providers } from "near-api-js";

interface Balance {
  available: string;
}

export interface WalletStoreInterface {
  toggleModal: () => void;
  accountId: string | null;
  showWalletModal: boolean;
  signOut: () => Promise<void>;
  selector: WalletSelector | null;
  initWallet: () => Promise<string>;
  viewNearBalance: () => Promise<Balance>;
}

export const useWallet = create<WalletStoreInterface>((set, get) => ({
  accountId: null,
  selector: null,
  showWalletModal: false,

  toggleModal: () => {
    const { showWalletModal } = get();

    set(() => ({ showWalletModal: !showWalletModal }));
  },

  initWallet: async () => {
    const newSelector = await setupWalletSelector({
      network: useEnv("VITE_NEAR_NETWORK"),
      debug: true,
      modules: [
        setupMeteorWallet(),
        setupNearWallet(),
        setupMyNearWallet(),
        setupSender(),
        setupNightly(),
        setupWelldoneWallet(),
        setupXDEFI(),
        setupHereWallet(),
      ],
    });

    const state = newSelector.store.getState();

    const newAccount =
      state?.accounts.find((account) => account.active)?.accountId || "";

    try {
      set(() => ({
        accountId: newAccount,
        selector: newSelector,
      }));
    } catch (e) {
      console.warn(e);

      return "";
    }

    return newAccount;
  },

  signOut: async () => {
    const { selector } = get();

    if (!selector) {
      return;
    }

    const wallet = await selector.wallet();

    try {
      await wallet.signOut();
    } catch (e) {
      console.warn(e);

      return;
    }

    set(() => ({ accountId: "" }));
  },

  viewNearBalance: async (): Promise<Balance> => {
    const { accountId } = get();

    const provider = new providers.JsonRpcProvider({
      url: useEnv("VITE_NEAR_NODE_URL"),
    });

    const {
      amount,
    } = (await provider.query({
      finality: "final",
      account_id: accountId,
      request_type: "view_account",
    })) as any;

    return {
      available: amount,
    } as Balance;
  },
}));
