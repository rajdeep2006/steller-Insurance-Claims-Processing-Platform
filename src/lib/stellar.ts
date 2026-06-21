import { rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import config from "./config.json";

export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export const rpcServer = new rpc.Server(RPC_URL);

export const CONTRACT_ID = config.contractId;
export const TOKEN_ID = config.tokenId;
export const ADMIN_ADDRESS = config.adminAddress;

export function parseScVal(val: string | xdr.ScVal): any {
  if (typeof val === "string") {
    return scValToNative(xdr.ScVal.fromXDR(val, "base64"));
  }
  return scValToNative(val);
}
