"use client";

import { useState } from "react";
import { useAppStore } from "../../lib/store";
import { 
  useUserPolicies, 
  useUserClaims, 
  useSubmitContractTx,
  Policy,
  Claim
} from "../../hooks/useInsuranceContract";
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Hourglass, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Clock, 
  Coins, 
  AlertCircle,
  ShieldCheck as ShieldIcon,
  HeartPulse,
  Car,
  Plane,
  ChevronRight
} from "lucide-react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { Address, nativeToScVal } from "@stellar/stellar-sdk";

export default function ClaimsPage() {
  const { address, isConnected, isAdminMode } = useAppStore();
  const { data: policies = [], isLoading: loadingPolicies, error: errorPolicies } = useUserPolicies(address);
  const { data: claims = [], isLoading: loadingClaims, error: errorClaims } = useUserClaims(address);
  const contractTxMutation = useSubmitContractTx();

  // Dialog / Modal State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);

  const openBuyModal = () => {
    contractTxMutation.reset();
    setShowBuyModal(true);
  };

  const closeBuyModal = () => {
    contractTxMutation.reset();
    setShowBuyModal(false);
  };

  const openClaimModal = (policyId: number) => {
    contractTxMutation.reset();
    setSelectedPolicyId(policyId);
    setShowClaimModal(true);
  };

  const closeClaimModal = () => {
    contractTxMutation.reset();
    setShowClaimModal(false);
  };

  // Buy Policy Form State
  const [policyType, setPolicyType] = useState<"health" | "auto" | "travel">("health");
  const [durationDays, setDurationDays] = useState<number>(30);

  // File Claim Form State
  const [claimAmount, setClaimAmount] = useState("");
  const [claimDesc, setClaimDesc] = useState("");

  // Admin Claim Input State
  const [adminClaimId, setAdminClaimId] = useState("");

  const policyMetadata = {
    health: {
      name: "Health & Medical",
      premium: "10",
      coverage: "500",
      icon: <HeartPulse className="h-5 w-5 text-zinc-400" />
    },
    auto: {
      name: "Auto & Transit",
      premium: "25",
      coverage: "1200",
      icon: <Car className="h-5 w-5 text-zinc-400" />
    },
    travel: {
      name: "Travel & Flight",
      premium: "5",
      coverage: "250",
      icon: <Plane className="h-5 w-5 text-zinc-400" />
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-zinc-800 text-xs font-mono font-bold bg-zinc-900 text-amber-500">
            <Hourglass className="h-3 w-3" />
            Pending
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-zinc-800 text-xs font-mono font-bold bg-zinc-900 text-blue-400">
            <ShieldCheck className="h-3 w-3" />
            Approved
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-zinc-800 text-xs font-mono font-bold bg-zinc-900 text-red-500">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-zinc-800 text-xs font-mono font-bold bg-zinc-900 text-emerald-500">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      default:
        return null;
    }
  };

  // Buy Policy Call
  const handleBuyPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const meta = policyMetadata[policyType];
    const premiumAmount = Number(meta.premium) * 10000000; // 7 decimals
    const coverageAmount = Number(meta.coverage) * 10000000; // 7 decimals
    const durationSeconds = durationDays * 24 * 60 * 60;

    try {
      await contractTxMutation.mutateAsync({
        walletKit: StellarWalletsKit,
        method: "buy_policy",
        args: [
          new Address(address).toScVal(),
          nativeToScVal(premiumAmount, { type: "i128" }),
          nativeToScVal(coverageAmount, { type: "i128" }),
          nativeToScVal(policyType, { type: "symbol" }),
          nativeToScVal(durationSeconds, { type: "u64" })
        ]
      });
      setShowBuyModal(false);
    } catch (err: any) {
      console.error("Failed to purchase policy:", err);
    }
  };

  // File Claim Call
  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || selectedPolicyId === null) return;

    const amountBase = Number(claimAmount) * 10000000; // 7 decimals

    try {
      await contractTxMutation.mutateAsync({
        walletKit: StellarWalletsKit,
        method: "file_claim",
        args: [
          new Address(address).toScVal(),
          nativeToScVal(selectedPolicyId, { type: "u32" }),
          nativeToScVal(amountBase, { type: "i128" }),
          nativeToScVal(claimDesc, { type: "string" })
        ]
      });
      setShowClaimModal(false);
      setClaimAmount("");
      setClaimDesc("");
    } catch (err: any) {
      console.error("Failed to file claim:", err);
    }
  };

  // Admin Actions
  const handleAdminAction = async (action: "approve_claim" | "reject_claim", id: number) => {
    if (!address) return;
    try {
      await contractTxMutation.mutateAsync({
        walletKit: StellarWalletsKit,
        method: action,
        args: [
          new Address(address).toScVal(),
          nativeToScVal(id, { type: "u32" })
        ]
      });
    } catch (err: any) {
      console.error(`Failed to ${action}:`, err);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto space-y-6">
        <div className="inline-flex p-4 rounded bg-zinc-900 border border-zinc-800 text-zinc-455">
          <ShieldIcon className="h-8 w-8 text-zinc-400" />
        </div>
        <h2 className="text-xl font-mono font-bold text-zinc-200 uppercase tracking-wider">Wallet Connection Required</h2>
        <p className="text-sm text-zinc-500 font-sans">To inspect active insurance policies, purchase coverage, or request payouts, please link your Stellar wallet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-100 uppercase tracking-wider">Policies & Claims</h1>
          <p className="text-zinc-500 text-xs mt-1">Enroll in smart contract policies and file payouts requests directly.</p>
        </div>
        <button
          onClick={openBuyModal}
          className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-mono font-bold text-xs px-4 py-2.5 rounded border border-zinc-300 transition-all"
        >
          <Plus className="h-4 w-4" />
          Buy Coverage Policy
        </button>
      </div>

      {/* Transaction status card if any is executing */}
      {contractTxMutation.isPending && (
        <div className="bg-zinc-900 border border-zinc-850 text-zinc-350 p-4 rounded flex items-center gap-3 font-mono text-xs">
          <div className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          <span>Submitting transaction to Stellar Testnet ledger...</span>
        </div>
      )}

      {contractTxMutation.isError && (
        <div className="bg-zinc-950 border border-red-900 text-red-400 p-4 rounded flex items-start gap-3 text-xs font-mono">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Transaction Failed:</span>{" "}
            <span className="text-red-305/80">{contractTxMutation.error.message}</span>
          </div>
        </div>
      )}

      {contractTxMutation.isSuccess && (
        <div className="bg-zinc-900 border border-zinc-850 text-emerald-400 p-4 rounded flex items-center gap-3 text-xs font-mono">
          <CheckCircle className="h-4 w-4" />
          <span>Transaction executed successfully on ledger!</span>
        </div>
      )}

      {/* Grid: Policies and Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Policies */}
        <div className="space-y-6">
          <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-2">
            <ShieldIcon className="h-4 w-4 text-zinc-500" />
            My Active Policies
          </h2>

          {loadingPolicies ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-zinc-900/10 border border-zinc-850 rounded p-5 h-24 animate-pulse" />
              ))}
            </div>
          ) : policies.length === 0 ? (
            <div className="bg-zinc-900/10 border border-dashed border-zinc-850 rounded p-8 text-center text-zinc-500">
              <ShieldIcon className="h-6 w-6 mx-auto text-zinc-700 mb-2" />
              <p className="text-xs">No active policies found. Purchase one above to get covered.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy: Policy) => {
                const meta = policyMetadata[policy.policyType as keyof typeof policyMetadata] || {
                  name: policy.policyType,
                  premium: "0",
                  coverage: "0",
                  icon: <ShieldIcon className="h-4 w-4 text-zinc-500" />
                };
                const expirationDate = new Date(policy.expiration * 1000);
                const isExpired = Date.now() > policy.expiration * 1000;

                return (
                  <div key={policy.id} className="bg-zinc-900/20 border border-zinc-850 rounded p-4 hover:border-zinc-800 hover:bg-zinc-900/35 transition-all duration-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-zinc-950 p-2 rounded border border-zinc-900 text-zinc-400">{meta.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-bold text-zinc-200 text-xs uppercase tracking-wider">{meta.name}</h3>
                          <span className="text-[10px] text-zinc-500 font-mono">ID: #{policy.id}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-sans">
                          <Clock className="h-3.5 w-3.5" />
                          Expires: {expirationDate.toLocaleDateString()} {isExpired && <span className="text-red-500 font-bold font-mono">(Expired)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-855">
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase tracking-wider font-mono">Max Coverage</span>
                        <span className="text-xs font-mono font-bold text-zinc-300">{(Number(policy.coverage) / 10000000).toLocaleString()} XLM</span>
                      </div>
                      <button
                        onClick={() => openClaimModal(policy.id)}
                        disabled={isExpired}
                        className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 text-[10px] font-mono font-bold px-3 py-1.5 rounded text-zinc-450 transition-colors"
                      >
                        File Claim
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Claim Requests */}
        <div className="space-y-6">
          <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-2">
            <FileText className="h-4 w-4 text-zinc-500" />
            My Claims History
          </h2>

          {loadingClaims ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-zinc-900/10 border border-zinc-850 rounded p-5 h-24 animate-pulse" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-zinc-900/10 border border-dashed border-zinc-850 rounded p-8 text-center text-zinc-500">
              <FileText className="h-6 w-6 mx-auto text-zinc-700 mb-2" />
              <p className="text-xs">No claims filed yet. File a claim against your active policy.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim: Claim) => {
                const claimAmountXLM = Number(claim.amount) / 10000000;
                const claimDate = new Date(claim.createdAt * 1000);

                return (
                  <div key={claim.id} className="bg-zinc-900/20 border border-zinc-850 rounded p-4 hover:border-zinc-800 hover:bg-zinc-900/35 transition-all duration-200 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-bold text-zinc-200 text-xs uppercase tracking-wider">Claim #{claim.id}</h3>
                          <span className="text-[10px] text-zinc-500 font-mono">Policy: #{claim.policyId}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-sans">
                          <Clock className="h-3.5 w-3.5" />
                          Filed on: {claimDate.toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    <p className="text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-900 leading-relaxed font-mono">
                      {claim.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-zinc-850 pt-3">
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase tracking-wider font-mono">Requested Amount</span>
                        <span className="text-xs font-mono font-bold text-zinc-300">{claimAmountXLM.toLocaleString()} XLM</span>
                      </div>

                      {/* Admin Action Buttons */}
                      {isAdminMode && claim.status === 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAdminAction("approve_claim", claim.id)}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[10px] font-mono font-bold px-3 py-1.5 rounded transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAdminAction("reject_claim", claim.id)}
                            className="bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-250 border border-zinc-850 text-[10px] font-mono font-bold px-3 py-1.5 rounded text-zinc-550 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Buy Policy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-zinc-950/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-850 w-full max-w-md rounded p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-mono font-bold text-zinc-200 uppercase tracking-wider">Purchase Insurance Policy</h3>
              <p className="text-xs text-zinc-500 mt-1 font-sans">Select coverage category and enrollment duration.</p>
            </div>

            <form onSubmit={handleBuyPolicy} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Coverage Category</label>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  {(["health", "auto", "travel"] as const).map((type) => {
                    const active = policyType === type;
                    const meta = policyMetadata[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPolicyType(type)}
                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${
                          active 
                            ? "bg-zinc-950 text-zinc-100 border-zinc-750" 
                            : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800"
                        }`}
                      >
                        {meta.icon}
                        <span className="text-[10px] font-bold mt-2 capitalize">{type}</span>
                        <span className="text-[9px] text-zinc-500 mt-0.5">{meta.premium} XLM</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Duration</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-350 text-xs font-mono focus:outline-none focus:border-zinc-750"
                >
                  <option value={7}>7 Days (Short Term)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded border border-zinc-900 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Premium Cost</span>
                  <span className="font-bold text-zinc-300">{policyMetadata[policyType].premium} XLM</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Max Claim Coverage</span>
                  <span className="font-bold text-zinc-300">{policyMetadata[policyType].coverage} XLM</span>
                </div>
              </div>

              {contractTxMutation.isError && (
                <div className="bg-zinc-950 border border-red-900 text-red-400 p-3 rounded flex items-start gap-2.5 text-xs font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error:</span>{" "}
                    <span className="text-red-305/85">{contractTxMutation.error.message}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 font-mono">
                <button
                  type="button"
                  onClick={closeBuyModal}
                  disabled={contractTxMutation.isPending}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-bold px-4 py-2 rounded text-zinc-455 hover:text-zinc-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contractTxMutation.isPending}
                  className="bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 text-xs font-bold px-4 py-2 rounded border border-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  {contractTxMutation.isPending && (
                    <div className="h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  )}
                  {contractTxMutation.isPending ? "Signing..." : "Confirm & Buy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-zinc-950/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-855 w-full max-w-md rounded p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-mono font-bold text-zinc-200 uppercase tracking-wider">File Claim Request</h3>
              <p className="text-xs text-zinc-500 mt-1 font-sans">Submit invoice details for policy ID #{selectedPolicyId}.</p>
            </div>

            <form onSubmit={handleFileClaim} className="space-y-4">
              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Requested Claim Amount (XLM)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="Enter claim payout request"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded pl-3.5 pr-12 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-750 font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-[10px] text-zinc-500 font-bold">XLM</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Incident Details / Evidence Link</label>
                <textarea
                  required
                  rows={3}
                  value={claimDesc}
                  onChange={(e) => setClaimDesc(e.target.value)}
                  placeholder="Provide clinical details or receipt links..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-300 text-xs font-mono focus:outline-none focus:border-zinc-750 font-sans"
                />
              </div>

              {contractTxMutation.isError && (
                <div className="bg-zinc-950 border border-red-900 text-red-400 p-3 rounded flex items-start gap-2.5 text-xs font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error:</span>{" "}
                    <span className="text-red-305/85">{contractTxMutation.error.message}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 font-mono">
                <button
                  type="button"
                  onClick={closeClaimModal}
                  disabled={contractTxMutation.isPending}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-bold px-4 py-2 rounded text-zinc-455 hover:text-zinc-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contractTxMutation.isPending}
                  className="bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 text-xs font-bold px-4 py-2 rounded border border-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  {contractTxMutation.isPending && (
                    <div className="h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  )}
                  {contractTxMutation.isPending ? "Filing..." : "File Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
