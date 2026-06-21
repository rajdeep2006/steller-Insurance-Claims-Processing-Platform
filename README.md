<img width="2821" height="1543" alt="image" src="https://github.com/user-attachments/assets/bf9dd935-3956-4f1c-98d5-434cea67ea86" />
<img width="2854" height="1522" alt="image" src="https://github.com/user-attachments/assets/decdbbe3-6c89-4658-a093-fc477f4c17ae" />
<img width="2864" height="1534" alt="image" src="https://github.com/user-attachments/assets/f1aa69e4-50c0-40f0-bca4-2a1b4cfe7fde" />
vercel deploy link:https://steller-insurance-claims-processing.vercel.app/
# StellarSure: Decentralized Insurance Claims Processing Platform

StellarSure is a Level 2 DApp built on the Stellar network using Soroban smart contracts. It allows users to enroll in automated insurance policies (Health, Auto, and Travel) by transferring premiums and file claim requests directly to the contract. The admin/underwriter can review, approve, or reject claim requests, which automatically triggers instant native wrapped XLM token payouts.

---

## Features

- **Multi-Wallet Integration**: Built using `StellarWalletsKit` supporting Freighter, Albedo, Hana, and xBull.
- **Smart Contract Business Logic**: Soroban Rust contract managing policy purchasing, claim validation, limits, expiration, and automated payouts.
- **Real-Time Synchronized Feed**: Polls Stellar RPC contract events to update the activity feed with policy enrollments and claim payouts.
- **Transaction Tracking**: Visual logs showing Pending, Success, or Failed states for every contract invocation, with direct links to the Testnet Explorer.
- **Role Switching**: Fast testing capabilities allowing users to inspect the interface as both a Policyholder and an Underwriter/Admin.

---

## Tech Stack

- **Frontend Core**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Blockchain Core**: `@stellar/stellar-sdk`
- **Wallet Connection**: `@creit.tech/stellar-wallets-kit`
- **State Management**: Zustand
- **Server Cache**: React Query (TanStack Query)

---

## Folder Structure

```
/contracts            # Soroban smart contract source and configuration
  /insurance-claim
    /src
      lib.rs          # Core contract business logic
      test.rs         # Contract flow unit tests
/scripts
  deploy.js           # Automated build, deploy, and initialization script
/src
  /app                # Next.js App Router pages
  /components         # Reusable UI layout components
  /hooks              # React Query state and event polling hooks
  /lib
    stellar.ts        # Stellar SDK and RPC server configurations
    store.ts          # Zustand state store for transaction tracking
    config.json       # Generated testnet contract addresses
```

---

## Environment Variables

Copy the example configuration to `.env.local`:
```bash
cp .env.example .env.local
```

File content:
```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
```

---

## Wallet Setup

1. Install the [Freighter Wallet](https://www.freighter.app/) extension in your browser.
2. In the Freighter settings, switch the active network to **Testnet**.
3. Create a testnet account and fund it with XLM using the [Friendbot Faucet](https://lab.stellar.org/account/fund).

---

## Contract Deployment

To compile, deploy, and initialize the contract on Stellar Testnet, run:
```bash
node scripts/deploy.js
```

Upon success, the script will output the contract configurations:
- **Contract Address**: `https://stellar.expert/explorer/testnet/contract/CDMZG2VULATO3CZX5IBA6F6FTLVP6PEZBBRBUODSBQFUBLEEPQ5I34RO`
- **Native Wrapped Token ID**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Example Transaction Hash**: `ca2be167d43c22bab26c4b3ab8f92e80948275cb1f2c59f666b80e2dc38fec6f`

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Smart Contract Tests
Ensure your Rust compiler has `wasm32-unknown-unknown` or `wasm32v1-none` target installed:
```bash
cargo test
```

### 3. Run Frontend Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the DApp.

---

## Deployment to Vercel

1. Push the code repository to GitHub.
2. Link the repository to your [Vercel Dashboard](https://vercel.com).
3. Set the environment variables in Vercel settings:
   - `NEXT_PUBLIC_STELLAR_NETWORK=testnet`
   - `NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org`
4. Click **Deploy**.
