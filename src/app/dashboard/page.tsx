"use client";

import { useAppStore } from "../../lib/store";
import { RPC_URL, NETWORK_PASSPHRASE, CONTRACT_ID, TOKEN_ID, ADMIN_ADDRESS } from "../../lib/stellar";
import { ShieldAlert, Globe, Server, Code, FileText, CheckCircle2, Wallet, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { address, balance, isConnected, walletType, isAdminMode } = useAppStore();

  const explorerLink = address 
    ? `https://stellar.expert/explorer/testnet/account/${address}` 
    : "#";

  return (
    <div className="space-y-8 py-6">
      <div className="pb-4 border-b border-zinc-900">
        <h1 className="text-2xl font-mono font-bold text-zinc-100 uppercase tracking-wider">Wallet Dashboard</h1>
        <p className="text-zinc-500 text-xs mt-1">Manage your Stellar connection, balances, and inspect the DApp&apos;s smart contract parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Connection Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/10 border border-zinc-850 rounded p-5 space-y-5 hover:bg-zinc-900/15 hover:border-zinc-800 transition-all duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="h-4.5 w-4.5 text-zinc-500" />
                Connection Identity
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold uppercase tracking-wider ${
                isConnected ? "bg-zinc-900 border-zinc-800 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-red-500"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`} />
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {isConnected ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-3.5 rounded border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Stellar Address</span>
                    <span className="text-zinc-300 block mt-1 break-all select-all">{address}</span>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Wallet Integration</span>
                    <span className="text-zinc-300 block mt-1">{walletType} Module</span>
                  </div>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded border border-zinc-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Account Balance</span>
                    <span className="text-xl font-bold text-zinc-150 block mt-1">{balance} XLM</span>
                  </div>
                  <a 
                    href={explorerLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-250 font-bold underline transition-colors"
                  >
                    <span>View in Explorer</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="inline-flex p-3 rounded bg-zinc-950 border border-zinc-900 text-zinc-500">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider">No Wallet Connected</h3>
                <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed">Click &quot;Connect Wallet&quot; at the top of the page to link your Freighter or Albedo wallet.</p>
              </div>
            )}
          </div>

          {/* User Mode Alert Box */}
          {isConnected && (
            <div className="border rounded border-zinc-850 p-5 flex items-start gap-4 bg-zinc-900/10 hover:bg-zinc-900/15 hover:border-zinc-800 transition-all duration-200">
              <div className="p-2 rounded border bg-zinc-950 border-zinc-900 text-zinc-400 shrink-0">
                {isAdminMode ? <Code className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div className="space-y-1">
                <h4 className="font-mono font-bold text-zinc-200 text-xs uppercase tracking-wider">{isAdminMode ? "Admin/Underwriter Mode Active" : "Policy Holder Mode Active"}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans mt-1">
                  {isAdminMode 
                    ? "You are inspecting the contract state as an Underwriter. You are authorized to review filed claims, approve payouts, and decline invalid filings." 
                    : "You are inspecting the contract state as a Policyholder. You can enroll in auto/medical/flight policies, pay premiums, and file claim requests."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Network & Contract Configurations */}
        <div className="space-y-6">
          {/* Network Specs */}
          <div className="bg-zinc-900/10 border border-zinc-850 rounded p-5 space-y-4 hover:bg-zinc-900/15 hover:border-zinc-800 transition-all duration-200">
            <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Globe className="h-4.5 w-4.5 text-zinc-500" />
              Network Properties
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-500">Chain Network</span>
                <span className="font-bold text-zinc-350">Stellar Testnet</span>
              </div>
              <div className="py-1 border-b border-zinc-900 space-y-1">
                <span className="text-zinc-500 block">Passphrase</span>
                <span className="text-[10px] text-zinc-450 block break-all select-all">{NETWORK_PASSPHRASE}</span>
              </div>
              <div className="py-1 space-y-1">
                <span className="text-zinc-500 block">RPC Endpoint</span>
                <span className="text-[10px] text-zinc-450 block break-all select-all">{RPC_URL}</span>
              </div>
            </div>
          </div>

          {/* Contract Specs */}
          <div className="bg-zinc-900/10 border border-zinc-850 rounded p-5 space-y-4 hover:bg-zinc-900/15 hover:border-zinc-800 transition-all duration-200">
            <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Server className="h-4.5 w-4.5 text-zinc-500" />
              Contract Parameters
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-zinc-500 block">Insurance Contract ID</span>
                {CONTRACT_ID === "CONTRACT_ADDRESS_HERE" ? (
                  <span className="text-amber-500 text-[10px]">NOT_DEPLOYED (Deploy script pending)</span>
                ) : (
                  <span className="text-[10px] text-zinc-350 break-all select-all block">{CONTRACT_ID}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <span className="text-zinc-500 block">Asset Token Address (XLM)</span>
                <span className="text-[10px] text-zinc-350 break-all select-all block">{TOKEN_ID}</span>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Contract Admin Address</span>
                {ADMIN_ADDRESS === "G_ADMIN_ADDRESS_HERE" ? (
                  <span className="text-zinc-500 text-[10px]">Pending Deployment</span>
                ) : (
                  <span className="text-[10px] text-zinc-350 break-all select-all block">{ADMIN_ADDRESS}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
