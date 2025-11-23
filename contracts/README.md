# Buster Market Smart Contracts

Solidity smart contracts for the Buster prediction market platform.

## Contracts

### PredictionMarketV2.sol
Multi-option prediction market with LMSR (Logarithmic Market Scoring Rule) pricing mechanism.

**Features:**
- Multi-option markets (2+ options per market)
- LMSR automated market maker
- Free markets with prize pools
- Market validation and dispute system
- Platform fee collection
- Role-based access control

### BettingToken.sol
ERC20 token used for betting in prediction markets.

**Features:**
- Standard ERC20 functionality
- Built-in faucet for new users
- Pausable for emergency situations
- Owner-controlled minting

## Setup

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Installation

```bash
cd contracts
forge install
```

### Compile

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy

1. Create a `.env` file:
```bash
PRIVATE_KEY=your_private_key
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_key
```

2. Deploy to Base Sepolia (testnet):
```bash
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
```

3. Deploy to Base (mainnet):
```bash
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

## Contract Addresses

### Base Mainnet
- BettingToken: `TBD`
- PredictionMarketV2: `TBD`

### Base Sepolia
- BettingToken: `TBD`
- PredictionMarketV2: `TBD`

## Architecture

### Market Creation Flow
1. Creator calls `createMarket()` with initial liquidity
2. Contract calculates LMSR B parameter based on liquidity
3. Options are initialized with equal shares
4. Market is added to category and type indices

### Trading Flow
1. User calls `buyShares()` or `sellShares()`
2. Contract calculates cost/proceeds using LMSR
3. Platform fee is deducted
4. Shares are updated
5. Price is recalculated
6. Trade is recorded in history

### Resolution Flow
1. Resolver calls `resolveMarket()` with winning option
2. Platform fees are unlocked
3. Users can claim winnings with `claimWinnings()`

### Invalidation Flow
1. Validator calls `invalidateMarket()`
2. Platform fees are refunded
3. Users can withdraw their investments

## Security

- ReentrancyGuard on all state-changing functions
- Role-based access control for sensitive operations
- Pausable for emergency situations
- Slippage protection on trades
- Input validation on all functions

## License

MIT
