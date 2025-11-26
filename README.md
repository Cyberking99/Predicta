# Predicta: Onchain Prediction Market Platform

> Predicta is a decentralized, open-source prediction market platform. Users can create, trade, and resolve markets onchain, powered by Celo. The platform features advanced analytics, MiniPay mini-app integration, and a focus on transparency and security.

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Usage](#usage)
- [Development](#development)

---

## Introduction

Predicta enables anyone to participate in decentralized prediction markets. Users can bet on outcomes using stablecoins, view real-time analytics, and share their stats with Satori-generated images. The platform is designed for extensibility, security, and seamless integration with Farcaster and other social protocols.

## Features

- **Onchain Markets:** Create, trade, and resolve prediction markets transparently on the blockchain.
- **ERC20 Token Betting:** All bets and payouts use a standard ERC20 tokens (stablecoins).
- **Admin Tools:** Comprehensive admin dashboard for market management, withdrawals, role management, and validation.
- **User Analytics:** Track your performance, net winnings, and leaderboard position.
- **Satori Image Generation:** Instantly share your stats as beautiful images.
- **MiniPay Mini-app:** Share and interact with markets directly from MiniPay wallet.
- **Open Source:** MIT-licensed and open for contributions.

## Architecture

- **Frontend:** Built with Next.js 15, Tailwind CSS, and TypeScript.
- **Blockchain:** Uses viem and wagmi for contract interaction; all market logic is onchain.
- **Image Generation:** Satori and sharp for dynamic SVG/PNG stats images.
- **API:** Next.js API routes for server-side logic, analytics, and image endpoints.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure environment:**

   - Copy `.env.example` to `.env.local` and set your environment variables:
     - `NEXT_PUBLIC_ALCHEMY_RPC_URL` (RPC endpoint)
     - Contract addresses (market, token, faucet)
     - Any analytics or third-party keys

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `src/app/` — Next.js app directory (API routes, pages, layout)
- `src/components/` — UI and logic components
- `src/constants/` — Contract addresses and ABIs
- `src/lib/` — Analytics, subgraph, and utility functions
- `public/` — Static assets and fonts

## Smart Contracts

- **Market Contract:** Handles market creation, trading, and resolution.
- **ERC20 Token Contract:** Used for all bets and rewards.

## Usage

1. **Create a Market:**
   - Navigate to the "Create Market" page and enter your question and options.
2. **Place a Bet:**
   - Select a market, choose your option, and enter your bet amount.
3. **Claim Winnings:**
   - After market resolution, claim your winnings from the UI.
4. **Share Stats:**
   - Use the share button to generate and share your stats image.

## Development

- **Contracts:**
  - Solidity contracts are in the `/contracts` directory.
  - Foundry for local testing and deployment.
- **Frontend:**
  - Next.js app in `frontend/src/app`.
  - Components in `frontend/src/components`.
- **Testing:**
  - Unit and integration tests for contract.
- **Linting & Formatting:**
  - Run `npm run lint` and `npm run format` before submitting PRs.