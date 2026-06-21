"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "../lib/store";
import { useEffect } from "react";
import { fetchAccountBalance } from "../hooks/useInsuranceContract";
import { Shield, Wallet, Power, User, ShieldAlert } from "lucide-react";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";

export default function Navbar() {
  const pathname = usePathname();
  const { 
    address, 
    balance, 
    isConnected, 
    isAdminMode, 
    setWallet, 
    setBalance, 
    disconnectWallet, 
    toggleAdminMode 
  } = useAppStore();

  // Initialize StellarWalletsKit on mount
  useEffect(() => {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [
        new FreighterModule(),
        new AlbedoModule()
      ]
    });
  }, []);

  // Update balance periodically if connected
  useEffect(() => {
    if (!address) return;
    const updateBalance = async () => {
      const bal = await fetchAccountBalance(address);
      setBalance(bal);
    };
    updateBalance();
    const interval = setInterval(updateBalance, 10000);
    return () => clearInterval(interval);
  }, [address, setBalance]);

  const handleConnect = async () => {
    try {
      const res = await StellarWalletsKit.authModal();
      setWallet(res.address, "Freighter/Albedo");
      const bal = await fetchAccountBalance(res.address);
      setBalance(bal);
    } catch (err: any) {
      console.error("Wallet modal open error:", err);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="border-b border-zinc-900 bg-zinc-950 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-mono font-bold text-zinc-100 text-base tracking-wider">
              <Shield className="h-5 w-5 text-zinc-400" />
              <span>STELLAR<span className="text-zinc-500">SURE</span></span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
              <Link 
                href="/" 
                className={`px-3 py-1.5 rounded border transition-all ${pathname === "/" ? "text-zinc-100 bg-zinc-900 border-zinc-800" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:border-zinc-900"}`}
              >
                Overview
              </Link>
              <Link 
                href="/dashboard" 
                className={`px-3 py-1.5 rounded border transition-all ${pathname === "/dashboard" ? "text-zinc-100 bg-zinc-900 border-zinc-800" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:border-zinc-900"}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/claims" 
                className={`px-3 py-1.5 rounded border transition-all ${pathname === "/claims" ? "text-zinc-100 bg-zinc-900 border-zinc-800" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:border-zinc-900"}`}
              >
                Policies & Claims
              </Link>
              <Link 
                href="/activity" 
                className={`px-3 py-1.5 rounded border transition-all ${pathname === "/activity" ? "text-zinc-100 bg-zinc-900 border-zinc-800" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:border-zinc-900"}`}
              >
                Activity
              </Link>
              <Link 
                href="/history" 
                className={`px-3 py-1.5 rounded border transition-all ${pathname === "/history" ? "text-zinc-100 bg-zinc-900 border-zinc-800" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:border-zinc-900"}`}
              >
                Transactions
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isConnected && (
              <button
                onClick={toggleAdminMode}
                className={`flex items-center gap-1 text-[11px] font-mono px-3 py-1 rounded border transition-all ${
                  isAdminMode 
                    ? "bg-zinc-900 text-zinc-100 border-zinc-800 hover:bg-zinc-850" 
                    : "bg-zinc-950 text-zinc-500 border-zinc-900 hover:text-zinc-300 hover:border-zinc-850"
                }`}
              >
                {isAdminMode ? <ShieldAlert className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                <span>{isAdminMode ? "Admin View" : "User View"}</span>
              </button>
            )}

            {isConnected ? (
              <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-850 rounded p-1.5 pl-3">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Balance</p>
                  <p className="text-sm font-mono font-bold text-zinc-100">{balance} <span className="text-zinc-500 text-xs font-normal">XLM</span></p>
                </div>
                <div className="h-8 w-[1px] bg-zinc-850" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-450 font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-900">
                    {truncateAddress(address!)}
                  </span>
                  <button
                    onClick={disconnectWallet}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                    title="Disconnect Wallet"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-mono font-bold text-xs px-4.5 py-2 rounded border border-zinc-300 transition-all active:scale-95"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
