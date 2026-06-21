import { create } from "zustand";

export interface TransactionTrack {
  hash: string;
  status: "pending" | "success" | "failed";
  method: string;
  timestamp: number;
}

export interface ContractEventTrack {
  id: string;
  type: string;
  timestamp: number;
  wallet: string;
  details: string;
}

interface AppState {
  // Wallet state
  address: string | null;
  balance: string;
  walletType: string | null;
  isConnected: boolean;
  isAdminMode: boolean;
  
  // Transaction history tracking
  transactions: TransactionTrack[];
  
  // Real-time activity feed
  events: ContractEventTrack[];
  
  // Actions
  setWallet: (address: string | null, walletType: string | null) => void;
  setBalance: (balance: string) => void;
  disconnectWallet: () => void;
  toggleAdminMode: () => void;
  
  addTransaction: (hash: string, method: string) => void;
  updateTransactionStatus: (hash: string, status: "success" | "failed") => void;
  
  addEvent: (event: ContractEventTrack) => void;
  setEvents: (events: ContractEventTrack[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  address: null,
  balance: "0.0",
  walletType: null,
  isConnected: false,
  isAdminMode: false,
  transactions: [],
  events: [],

  setWallet: (address, walletType) =>
    set({
      address,
      walletType,
      isConnected: !!address,
    }),
  
  setBalance: (balance) => set({ balance }),

  disconnectWallet: () =>
    set({
      address: null,
      balance: "0.0",
      walletType: null,
      isConnected: false,
      isAdminMode: false,
    }),

  toggleAdminMode: () => set((state) => ({ isAdminMode: !state.isAdminMode })),

  addTransaction: (hash, method) =>
    set((state) => ({
      transactions: [
        { hash, status: "pending", method, timestamp: Date.now() },
        ...state.transactions,
      ],
    })),

  updateTransactionStatus: (hash, status) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.hash === hash ? { ...tx, status } : tx
      ),
    })),

  addEvent: (event) =>
    set((state) => {
      // Avoid duplicate events by ID
      if (state.events.some((e) => e.id === event.id)) {
        return state;
      }
      return { events: [event, ...state.events] };
    }),

  setEvents: (events) => set({ events }),
}));
