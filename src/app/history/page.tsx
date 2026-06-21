"use client";

import { useAppStore, TransactionTrack } from "../../lib/store";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Hourglass, 
  Clock, 
  Terminal, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export default function HistoryPage() {
  const { transactions } = useAppStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Hourglass className="h-5 w-5 text-amber-500 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-zinc-900 text-amber-500 border-zinc-800";
      case "success":
        return "bg-zinc-900 text-emerald-500 border-zinc-800";
      case "failed":
        return "bg-zinc-900 text-red-500 border-zinc-800";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-850";
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "buy_policy":
        return "Purchase Policy";
      case "file_claim":
        return "File Claim Request";
      case "approve_claim":
        return "Approve Claim Payout";
      case "reject_claim":
        return "Reject Claim Request";
      default:
        return method;
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  return (
    <div className="space-y-8 py-6">
      <div className="pb-4 border-b border-zinc-900">
        <h1 className="text-2xl font-mono font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
          <History className="h-5 w-5 text-zinc-400" />
          Transaction History
        </h1>
        <p className="text-zinc-500 text-xs mt-1 font-sans">Inspect recent state changes and contract interactions submitted to Stellar Testnet.</p>
      </div>

      <div className="bg-zinc-900/10 border border-zinc-850 rounded overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-3 font-mono">
            <History className="h-8 w-8 mx-auto text-zinc-700 mb-2" />
            <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-xs">No Transactions Found</h3>
            <p className="text-[11px] max-w-sm mx-auto text-zinc-500 leading-relaxed font-sans">
              When you buy policies, submit claims, or perform administrative approvals, your transactions will appear here with live tracking.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {transactions.map((tx: TransactionTrack) => {
              const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${tx.hash}`;
              const formattedDate = new Date(tx.timestamp).toLocaleString();

              return (
                <div key={tx.hash} className="p-4 hover:bg-zinc-900/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-900 shrink-0">
                      {getStatusIcon(tx.status)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-mono font-bold text-zinc-200 text-xs uppercase tracking-wider">{getMethodLabel(tx.method)}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${getStatusLabel(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Terminal className="h-3.5 w-3.5" />
                          Hash: <span className="text-zinc-400 select-all">{truncateHash(tx.hash)}</span>
                        </span>
                        <span className="flex items-center gap-1 font-sans">
                          <Clock className="h-3.5 w-3.5" />
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a 
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-zinc-300 hover:text-zinc-100 font-mono font-bold border border-zinc-850 hover:border-zinc-750 bg-zinc-900 px-3.5 py-2 rounded transition-all active:scale-95 shrink-0"
                  >
                    <span>Inspect Ledger</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
