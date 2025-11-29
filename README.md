<div align="center">

# 🔮 PREDICTA

> **Predict And Earn Onchain.**

**A decentralized, open-source prediction market platform on Celo MiniPay**

![Celo](https://img.shields.io/badge/Celo-F5F5F5?style=for-the-badge&logo=celo&logoColor=35D07F)
![MiniPay](https://img.shields.io/badge/MiniPay-Enabled-green?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Solidity](https://img.shields.io/badge/Solidity-0.8+-363636?style=for-the-badge&logo=solidity&logoColor=white)

[🚀 Live Demo](#-demo) • [📱 Features](#-key-features) • [🏗️ Architecture](#️-technical-architecture) • [💻 Development](#-getting-started) • [📖 Docs](#-documentation)

---

</div>

---

## 🌟 What is PREDICTA?

Predicta is a **mobile-first decentralized prediction market platform** specifically built for **Celo MiniPay**, enabling users to participate in prediction markets directly from their mobile wallets with full transparency and security.

### 🎯 The Problem We Solve

Traditional prediction markets often suffer from:

- ❌ **Desktop-focused UX** (hard to use on mobile)
- ❌ **Opaque Mechanisms** (off-chain logic)
- ❌ **Complex Onboarding** (difficult wallet management)
- ❌ **Lack of Social Features** (boring experience)

**Predicta changes this by bringing a seamless, social, and mobile-first prediction experience to Celo.**

---

## 💡 Our Solution

Predicta offers a **comprehensive prediction ecosystem** designed for accessibility and engagement.

### 🎵 For Users

- ✅ **Predict & Earn** - Stake on various market outcomes using stablecoins
- ✅ **MiniPay Integration** - Seamless interaction within Opera Mini
- ✅ **Leaderboard** - Compete with others and track your net winnings
- ✅ **Social Sharing** - Share your predictions on other platforms
- ✅ **Multiple Token Support** - Create markets with various stablecoins.
- ✅ **Event Variety** - Sports, politics, crypto, and more.
- ✅ **1v1 Challenges** - Compete head-to-head with other users on various games.
- ✅ **Earn Rewards** - Complete challenges/tasks and earn rewards.


### 🚀 Built on Celo

- 📱 **Mobile-First Design** - Fully responsive interface
- ⚡ **Fast Transactions** - Powered by Celo's high-speed network
- 💰 **Low Fees** - Affordable participation for everyone

---

## ⚡ Key Features

### 🎯 Onchain Markets

- **Transparent Logic**: All market creation, trading, and resolution happens onchain.
- **ERC20 Betting**: Use standard stablecoins (cUSD and USDC) for all bets and payouts.
- **Secure Resolution**: Admin-managed or decentralized resolution mechanisms.

### 📱 MiniPay Mini-app

- **Native Feel**: Designed to feel like a native app within Opera Mini.
- **One-Tap Connect**: Instant wallet connection and transaction signing.
- **Accessible**: Reach millions of users in emerging markets.

### 📊 User Analytics

- **Performance Tracking**: Monitor your win rate and total earnings.
- **Leaderboard**: See where you stand among top predictors.
- **History**: Detailed history of all your past predictions.

---

## ⛓️ Contract Addresses
| Name | Address |
|---|---|
| Predicta | `0x89F95b6084E0c6002d83acf994a9b3e913B1e1AA` |
| EventContract | `0x22C6615cAE123dA2De62cbcE64F18F613DF6cacf` |
| cUSD | `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` |
| USDC | `0x01C5C0122039549AD1493B8220cABEdD739BC44E` |

---

## 🏗️ Technical Architecture

### 📦 Smart Contracts (Solidity + Foundry)

**Deployed on Celo Alfajores Testnet**

```
contracts/
├── src/
│   ├── Predicta.sol             # Core market logic
│   ├── PredictaEventContract.sol # Event management
│   └── Errors.sol               # Custom errors
├── script/
│   └── CreateEvents.s.sol       # Script to create sample events
│   └── Predicta.s.sol           # Deployment script
```

**Key Contract Features:**

- ✅ **Market Management** - Create and resolve markets
- ✅ **Betting System** - Secure staking and payout calculation
- ✅ **Event Handling** - Robust event lifecycle management
- ✅ **Gas Optimized** - Efficient storage and execution

### 💻 Frontend (Vite + React) - Key Components

```
frontend/
├── src/
│   ├── pages/
│   │   ├── PublicPage/          # Public facing pages (Markets, Events)
│   │   ├── PrivatePage/         # User dashboard
│   │   ├── Wallet.jsx           # Wallet management
│   │   └── BetHistory.jsx       # User betting history
│   ├── components/              # Reusable UI components
│   ├── utils/                   # Helper functions
│   └── wagmi/                   # Wallet configuration
```

**Tech Stack:**

- ⚛️ **React 18** - Component-based UI
- ⚡ **Vite** - Blazing fast build tool
- 🎨 **Tailwind CSS** - Utility-first styling
- 🔗 **Wagmi + Viem** - Type-safe Ethereum interactions
- 🌈 **Reown Appkit** - Best-in-class wallet connection

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Git
- A Celo wallet (MiniPay or Metamask)

### Installation

```bash
# Clone the repository
git clone https://github.com/Cyberking99/Predicta.git
cd Predicta

# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Add your RPC URL and Contract Addresses

# Run development server
npm run dev
```

### Contract Development

```bash
cd contracts

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Run tests
forge test
```

---

## 📱 Demo

### 🎯 Live Demo

- **Frontend:** [https://predicta-app.vercel.app/](https://predicta-app.vercel.app/)
- **Chain:** Celo Sepolia
- **Explorer:** [CeloScan](https://sepolia.celoscan.io/)

---

## 📜 License

MIT License - see [LICENSE](LICENSE)