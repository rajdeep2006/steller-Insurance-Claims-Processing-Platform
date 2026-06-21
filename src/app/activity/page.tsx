"use client";

import { useEffect, useState } from "react";
import { useAppStore, ContractEventTrack } from "../../lib/store";
import { rpcServer, CONTRACT_ID, parseScVal } from "../../lib/stellar";
import { 
  Activity, 
  ShieldCheck, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Coins, 
  Terminal,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { scValToNative, xdr } from "@stellar/stellar-sdk";

export default function ActivityPage() {
  const { events, addEvent, setEvents } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncLedger, setLastSyncLedger] = useState<number | null>(null);

  // Poll for events from Stellar RPC
  useEffect(() => {
    if (CONTRACT_ID === "CONTRACT_ADDRESS_HERE") {
      // If contract not deployed, insert mock events for local demonstration
      if (events.length === 0) {
        const mockEvents: ContractEventTrack[] = [
          {
            id: "mock-1",
            type: "policy_created",
            timestamp: Date.now() - 3600000 * 2, // 2 hours ago
            wallet: "GDV2U...XJ3Q",
            details: "Enrolled in Auto Insurance Policy (ID: #1, Premium: 25 XLM, Coverage: 1200 XLM)"
          },
          {
            id: "mock-2",
            type: "policy_created",
            timestamp: Date.now() - 3600000 * 1.5, // 1.5 hours ago
            wallet: "GBGP5...KCSO",
            details: "Enrolled in Health & Medical Policy (ID: #2, Premium: 10 XLM, Coverage: 500 XLM)"
          },
          {
            id: "mock-3",
            type: "claim_filed",
            timestamp: Date.now() - 3600000 * 1, // 1 hour ago
            wallet: "GBGP5...KCSO",
            details: "Filed Claim #1 for 400 XLM against Health Policy #2 (Evidence: 'Medical clinic treatment invoice')"
          },
          {
            id: "mock-4",
            type: "claim_approved",
            timestamp: Date.now() - 1800000, // 30 mins ago
            wallet: "GBGP5...KCSO",
            details: "Claim #1 (400 XLM) Approved and Paid by Admin"
          }
        ];
        setEvents(mockEvents);
      }
      return;
    }

    const fetchLiveEvents = async () => {
      try {
        setIsSyncing(true);
        // Get latest ledger to calculate ledger range
        const ledgerInfo = await rpcServer.getLatestLedger();
        const currentLedger = ledgerInfo.sequence;

        // Sync from 5000 ledgers back if first time, else from last synced ledger
        const startLedger = lastSyncLedger ? lastSyncLedger + 1 : currentLedger - 5000;
        
        if (startLedger > currentLedger) {
          setIsSyncing(false);
          return;
        }

        const response = await rpcServer.getEvents({
          startLedger: startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [CONTRACT_ID]
            }
          ]
        });

        if (response.events && response.events.length > 0) {
          for (const rawEvent of response.events) {
            try {
              const topics = rawEvent.topic.map((t) => scValToNative(t));
              const val = scValToNative(rawEvent.value);
              
              const eventType = topics[0].toString();
              let details = "";
              let wallet = "";

              if (eventType === "policy_created") {
                const policyId = Number(topics[1]);
                wallet = topics[2].toString();
                const policyType = val.toString();
                details = `Enrolled in ${policyType.toUpperCase()} Policy (ID: #${policyId})`;
              } else if (eventType === "claim_filed") {
                const claimId = Number(topics[1]);
                wallet = topics[2].toString();
                const policyId = Number(topics[3]);
                const amount = Number(val) / 10000000;
                details = `Filed Claim #${claimId} for ${amount} XLM against Policy #${policyId}`;
              } else if (eventType === "claim_approved") {
                const claimId = Number(topics[1]);
                wallet = topics[2].toString();
                const amount = Number(val) / 10000000;
                details = `Claim #${claimId} (${amount} XLM) Approved and Paid`;
              } else if (eventType === "claim_rejected") {
                const claimId = Number(topics[1]);
                wallet = topics[2].toString();
                const amount = Number(val) / 10000000;
                details = `Claim #${claimId} (${amount} XLM) Rejected`;
              }

              if (details) {
                addEvent({
                  id: rawEvent.id,
                  type: eventType,
                  timestamp: rawEvent.ledgerClosedAt ? new Date(rawEvent.ledgerClosedAt).getTime() : Date.now(),
                  wallet: wallet,
                  details: details
                });
              }
            } catch (err) {
              console.error("Error parsing event:", err);
            }
          }
        }
        
        setLastSyncLedger(currentLedger);
      } catch (e) {
        console.error("Error fetching live events:", e);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchLiveEvents();
    const interval = setInterval(fetchLiveEvents, 10000);
    return () => clearInterval(interval);
  }, [events.length, lastSyncLedger, addEvent, setEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "policy_created":
        return <ShieldCheck className="h-5 w-5 text-zinc-400" />;
      case "claim_filed":
        return <FileText className="h-5 w-5 text-zinc-400" />;
      case "claim_approved":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "claim_rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getEventBg = (type: string) => {
    return "bg-zinc-900/10 border-zinc-850 hover:border-zinc-800 text-zinc-300";
  };

  const formatAddress = (addr: string) => {
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-5 w-5 text-zinc-400" />
            Activity Feed
          </h1>
          <p className="text-zinc-500 text-xs mt-1">Real-time Soroban contract events broadcasted directly from Stellar Testnet.</p>
        </div>

        <button
          onClick={() => setLastSyncLedger(null)} // Trigger full resync
          disabled={isSyncing}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 disabled:opacity-50 text-xs font-mono font-bold px-4 py-2.5 rounded text-zinc-350 hover:text-white transition-all active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Resync Feed</span>
        </button>
      </div>

      {CONTRACT_ID === "CONTRACT_ADDRESS_HERE" && (
        <div className="bg-zinc-900/10 border border-zinc-850 text-zinc-300 p-4 rounded flex items-start gap-3 text-xs font-mono">
          <Terminal className="h-4.5 w-4.5 shrink-0 mt-0.5 text-zinc-500" />
          <div>
            <span className="font-bold">Demonstration Mode:</span> showing simulated platform activity events. Once the contract is deployed, this feed will connect directly to the live Stellar Testnet RPC.
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-zinc-900/10 border border-dashed border-zinc-850 rounded p-16 text-center text-zinc-500">
            <Activity className="h-8 w-8 mx-auto text-zinc-700 mb-3" />
            <p className="text-xs">No activity recorded on contract yet. Syncing ledger events...</p>
          </div>
        ) : (
          events.map((ev: ContractEventTrack) => (
            <div 
              key={ev.id} 
              className={`border p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${getEventBg(ev.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900 shrink-0">
                  {getEventIcon(ev.type)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold text-zinc-200 leading-relaxed">{ev.details}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Terminal className="h-3.5 w-3.5 text-zinc-755" />
                      Actor: <span className="text-zinc-400">{formatAddress(ev.wallet)}</span>
                    </span>
                    <span className="flex items-center gap-1 font-sans">
                      <Clock className="h-3.5 w-3.5 text-zinc-755" />
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {CONTRACT_ID !== "CONTRACT_ADDRESS_HERE" && !ev.id.startsWith("mock-") && (
                <a 
                  href={`https://stellar.expert/explorer/testnet/tx/${ev.id.split("-")[0]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-zinc-450 hover:text-zinc-250 underline font-mono shrink-0 self-end sm:self-center"
                >
                  <span>Tx Hash</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
