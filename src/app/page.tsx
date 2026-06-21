"use client";

import Link from "next/link";
import { useAppStore } from "../lib/store";
import { 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Coins, 
  ArrowRight, 
  ShieldAlert,
  FileCheck2,
  HeartPulse,
  Plane,
  Car
} from "lucide-react";

export default function Home() {
  const { isConnected, address } = useAppStore();

  const features = [
    {
      icon: <HeartPulse className="h-6 w-6 text-zinc-400" />,
      title: "Health & Medical",
      description: "Secure coverage for unexpected clinical bills and emergency treatments.",
      premium: "10 XLM",
      coverage: "500 XLM"
    },
    {
      icon: <Car className="h-6 w-6 text-zinc-400" />,
      title: "Auto Insurance",
      description: "Fast coverage options for roadside damage and repair fees.",
      premium: "25 XLM",
      coverage: "1200 XLM"
    },
    {
      icon: <Plane className="h-6 w-6 text-zinc-400" />,
      title: "Travel & Flight",
      description: "Instant compensation for delayed transit or lost baggage.",
      premium: "5 XLM",
      coverage: "250 XLM"
    }
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <Cpu className="h-3.5 w-3.5 text-zinc-500" />
          <span>Soroban Smart Contracts on Stellar Testnet</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-zinc-100 leading-tight">
          Decentralized Insurance <br />
          <span className="text-zinc-500">
            Processed Instantly
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto font-sans leading-relaxed">
          StellarSure leverages the Stellar blockchain to create trustless insurance pools. Enroll in policies, file claims, and receive instant payouts with zero intermediaries.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3 font-mono">
          <Link
            href="/claims"
            className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs px-5 py-2.5 rounded border border-zinc-300 transition-all"
          >
            <span>Explore Policies</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-bold text-xs px-5 py-2.5 rounded transition-all"
          >
            Manage Wallet
          </Link>
        </div>
      </div>

      {/* Trust & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/10 border border-zinc-850 p-5 rounded flex items-start gap-4 hover:border-zinc-800 hover:bg-zinc-900/30 transition-all duration-200">
          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 text-zinc-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-zinc-200 text-xs uppercase tracking-wider">Immutable Policies</h3>
            <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed font-sans">Your coverage details are locked inside Soroban contract storage, protecting you against arbitrary claim rejections.</p>
          </div>
        </div>

        <div className="bg-zinc-900/10 border border-zinc-850 p-5 rounded flex items-start gap-4 hover:border-zinc-800 hover:bg-zinc-900/30 transition-all duration-200">
          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 text-zinc-400 shrink-0">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-zinc-200 text-xs uppercase tracking-wider">Direct Token Payouts</h3>
            <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed font-sans">Claims are paid in native wrapped Stellar tokens, sending liquidity straight to your address upon claim approval.</p>
          </div>
        </div>

        <div className="bg-zinc-900/10 border border-zinc-850 p-5 rounded flex items-start gap-4 hover:border-zinc-800 hover:bg-zinc-900/30 transition-all duration-200">
          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 text-zinc-400 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-zinc-200 text-xs uppercase tracking-wider">Real-Time Event Logs</h3>
            <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed font-sans">Track contract executions and claim payouts immediately through our fully synced network activity feed.</p>
          </div>
        </div>
      </div>

      {/* Insurance Product Catalog */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-mono font-bold text-zinc-200 uppercase tracking-wider">Available Insurance Categories</h2>
          <p className="text-zinc-500 text-xs mt-1 font-sans">Choose a coverage pool and buy policies with standard premium rates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="bg-zinc-900/20 border border-zinc-850 rounded p-5 hover:border-zinc-750 hover:bg-zinc-900/40 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="bg-zinc-950 p-2.5 rounded w-fit border border-zinc-850">{feature.icon}</div>
                <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider group-hover:text-zinc-100 transition-colors">{feature.title}</h3>
                <p className="text-zinc-400 text-xs font-sans leading-relaxed">{feature.description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Premium</span>
                  <span className="text-xs font-bold text-zinc-350">{feature.premium}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Max Coverage</span>
                  <span className="text-xs font-bold text-zinc-300">{feature.coverage}</span>
                </div>
                <Link 
                  href="/claims" 
                  className="p-1.5 rounded bg-zinc-950 text-zinc-400 hover:bg-zinc-900 border border-zinc-855 hover:text-zinc-150 transition-all"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Callout */}
      {!isConnected && (
        <div className="bg-zinc-900/10 border border-zinc-850 p-6 rounded flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 text-zinc-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-zinc-200 font-mono font-bold text-xs uppercase tracking-wider">Wallet Connection Required</h4>
              <p className="text-zinc-500 text-xs mt-1.5 font-sans">To buy policies, file claim requests, or review historical payouts, you must first connect your Stellar wallet.</p>
            </div>
          </div>
          <Link 
            href="/dashboard"
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-mono font-bold text-xs px-5 py-2.5 rounded transition-colors whitespace-nowrap border border-zinc-300"
          >
            Go to Wallet Setup
          </Link>
        </div>
      )}
    </div>
  );
}
