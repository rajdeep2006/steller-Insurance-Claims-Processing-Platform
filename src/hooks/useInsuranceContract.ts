import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  rpcServer, 
  CONTRACT_ID, 
  NETWORK_PASSPHRASE, 
  parseScVal 
} from "../lib/stellar";
import { useAppStore, ContractEventTrack } from "../lib/store";
import { 
  Address, 
  Contract, 
  TransactionBuilder, 
  Account, 
  xdr, 
  nativeToScVal, 
  TimeoutInfinite,
  rpc
} from "@stellar/stellar-sdk";

// Define dummy account for simulation
const DUMMY_ACCOUNT = new Account("GCJ5PQOY2X35SMRCRA4AGYB4ICK4IUDW4DJBK7NJ6OKO3YYKO66GXC6O", "0");

// Types matching the smart contract structs
export interface Policy {
  id: number;
  holder: string;
  premium: string;
  coverage: string;
  policyType: string;
  isActive: boolean;
  expiration: number;
}

export interface Claim {
  id: number;
  policyId: number;
  claimant: string;
  amount: string;
  description: string;
  status: number; // 0 = Pending, 1 = Approved, 2 = Rejected, 3 = Paid
  createdAt: number;
}

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------

async function simulateCall(functionName: string, args: xdr.ScVal[] = []): Promise<any> {
  if (CONTRACT_ID === "CONTRACT_ADDRESS_HERE") {
    console.warn("Contract not deployed yet.");
    return null;
  }
  
  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(DUMMY_ACCOUNT, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(TimeoutInfinite)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  
  if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
    return parseScVal(sim.result.retval);
  }
  return null;
}

// Helper to poll transactions to completion
export async function pollTransactionCompletion(hash: string): Promise<any> {
  let attempts = 0;
  while (attempts < 30) {
    const txInfo = await rpcServer.getTransaction(hash);
    if (txInfo.status === "SUCCESS") {
      return txInfo;
    } else if (txInfo.status === "FAILED") {
      throw new Error("Transaction execution failed on ledger.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }
  throw new Error("Transaction polling timed out.");
}

// Helper to get native account balance
export async function fetchAccountBalance(address: string): Promise<string> {
  try {
    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
    if (!res.ok) return "0.00";
    const data = await res.json();
    const nativeBalance = data.balances?.find((b: any) => b.asset_type === "native");
    return nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : "0.00";
  } catch (e) {
    console.error("Error fetching balance:", e);
    return "0.00";
  }
}

// ----------------------------------------------------
// React Query Hooks
// ----------------------------------------------------

export function useUserPolicies(address: string | null) {
  return useQuery({
    queryKey: ["userPolicies", address],
    queryFn: async (): Promise<Policy[]> => {
      if (!address) return [];
      
      const policyIds: number[] = await simulateCall("get_user_policies", [
        new Address(address).toScVal()
      ]);
      
      if (!policyIds || policyIds.length === 0) return [];
      
      const policies: Policy[] = [];
      for (const id of policyIds) {
        const rawPolicy = await simulateCall("get_policy", [
          nativeToScVal(id, { type: "u32" })
        ]);
        if (rawPolicy) {
          policies.push({
            id: Number(rawPolicy.id),
            holder: rawPolicy.holder,
            premium: rawPolicy.premium.toString(),
            coverage: rawPolicy.coverage.toString(),
            policyType: rawPolicy.policy_type.toString(),
            isActive: rawPolicy.is_active,
            expiration: Number(rawPolicy.expiration),
          });
        }
      }
      return policies;
    },
    enabled: !!address && CONTRACT_ID !== "CONTRACT_ADDRESS_HERE",
    refetchInterval: 10000, // Refetch every 10 seconds for real-time sync
  });
}

export function useUserClaims(address: string | null) {
  return useQuery({
    queryKey: ["userClaims", address],
    queryFn: async (): Promise<Claim[]> => {
      if (!address) return [];
      
      const claimIds: number[] = await simulateCall("get_user_claims", [
        new Address(address).toScVal()
      ]);
      
      if (!claimIds || claimIds.length === 0) return [];
      
      const claims: Claim[] = [];
      for (const id of claimIds) {
        const rawClaim = await simulateCall("get_claim", [
          nativeToScVal(id, { type: "u32" })
        ]);
        if (rawClaim) {
          claims.push({
            id: Number(rawClaim.id),
            policyId: Number(rawClaim.policy_id),
            claimant: rawClaim.claimant,
            amount: rawClaim.amount.toString(),
            description: rawClaim.description.toString(),
            status: Number(rawClaim.status),
            createdAt: Number(rawClaim.created_at),
          });
        }
      }
      return claims;
    },
    enabled: !!address && CONTRACT_ID !== "CONTRACT_ADDRESS_HERE",
    refetchInterval: 10000,
  });
}

// Fetch all policy IDs (useful for admin overview/stats)
export function useAllContractStats() {
  return useQuery({
    queryKey: ["contractStats"],
    queryFn: async () => {
      const policyCount = await simulateCall("get_policy", [nativeToScVal(0, { type: "u32" })]) 
        .catch(() => 0) || 0;
      return {
        policyCount: 0,
        claimCount: 0
      };
    },
    enabled: CONTRACT_ID !== "CONTRACT_ADDRESS_HERE",
  });
}

// ----------------------------------------------------
// Mutations (State-Modifying Actions)
// ----------------------------------------------------

interface SubmitTransactionArgs {
  walletKit: any;
  method: string;
  args: xdr.ScVal[];
}

export function useSubmitContractTx() {
  const queryClient = useQueryClient();
  const { address, addTransaction, updateTransactionStatus } = useAppStore();

  return useMutation({
    mutationFn: async ({ walletKit, method, args }: SubmitTransactionArgs): Promise<string> => {
      if (!address) throw new Error("Wallet not connected");
      if (CONTRACT_ID === "CONTRACT_ADDRESS_HERE") throw new Error("Contract not deployed");

      // 1. Fetch source account sequence number
      const accountResponse = await rpcServer.getLatestLedger();
      // Fetch source account info using Horizon for transaction building
      const horizonRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (!horizonRes.ok) {
        throw new Error("Could not load account info from Stellar Testnet. Please fund your account using a testnet faucet.");
      }
      const accountData = await horizonRes.json();
      const sourceAccount = new Account(address, accountData.sequence);

      // 2. Build the initial transaction
      const contract = new Contract(CONTRACT_ID);
      const tx = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(TimeoutInfinite)
        .build();

      // 3. Simulate the transaction to determine fee and footprint
      const sim = await rpcServer.simulateTransaction(tx);
      if (!rpc.Api.isSimulationSuccess(sim)) {
        const simError = (sim as any).error || "transaction simulation reverted";
        const simErrorLower = String(simError).toLowerCase();
        if (simErrorLower.includes("insufficient") || simErrorLower.includes("balance") || simErrorLower.includes("underfunded")) {
          throw new Error("Transaction simulation failed: Insufficient balance. Please check your wallet balance.");
        }
        throw new Error(`Simulation failed: ${simError}`);
      }

      // 4. Assemble the transaction with simulation results
      const assembledTx = rpc.assembleTransaction(tx, sim).build();

      // 5. Request signature from the wallet
      let signedTxXdr: string;
      try {
        const result = await walletKit.signTransaction(assembledTx.toXDR(), {
          networkPassphrase: NETWORK_PASSPHRASE,
          address,
        });
        signedTxXdr = result.signedTxXdr;
      } catch (err: any) {
        console.error("Wallet signing error raw:", err);
        const errMsg = typeof err === "string"
          ? err
          : (err?.message || err?.error || JSON.stringify(err) || String(err));
        
        const lowerMsg = errMsg.toLowerCase();
        if (lowerMsg.includes("reject") || lowerMsg.includes("cancel") || lowerMsg.includes("closed the modal") || lowerMsg.includes("user rejected")) {
          throw new Error("Transaction cancelled. User rejected the signature request in the wallet.");
        }
        if (lowerMsg.includes("not connected") || lowerMsg.includes("not installed") || lowerMsg.includes("not found")) {
          throw new Error("Wallet extension not found. Please ensure Freighter or Albedo is installed, unlocked, and connected.");
        }
        throw new Error(errMsg || "Failed to sign transaction with the wallet.");
      }

      // 6. Submit the signed transaction XDR
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
      const sendResult = await rpcServer.sendTransaction(signedTx);
      
      if (sendResult.status === "ERROR") {
        const errorResult = String(sendResult.errorResult).toLowerCase();
        if (errorResult.includes("insufficient") || errorResult.includes("underfunded")) {
          throw new Error("Transaction submission failed: Insufficient balance to cover network fees.");
        }
        throw new Error(`Transaction submission failed: ${sendResult.errorResult}`);
      }

      const txHash = sendResult.hash;
      addTransaction(txHash, method);

      // 7. Poll until transaction is mined in ledger
      try {
        await pollTransactionCompletion(txHash);
        updateTransactionStatus(txHash, "success");
      } catch (err) {
        updateTransactionStatus(txHash, "failed");
        throw err;
      }

      return txHash;
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger UI update
      queryClient.invalidateQueries({ queryKey: ["userPolicies"] });
      queryClient.invalidateQueries({ queryKey: ["userClaims"] });
    },
  });
}
