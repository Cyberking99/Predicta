# Multi-Token Whitelist Feature

## Overview
The PredictionMarketV2 contract now supports multiple ERC20 tokens for staking/betting. Admins can whitelist approved tokens, and market creators can choose which whitelisted token to use for their market.

## Key Changes

### 1. Token Whitelist System
- **State Variables:**
  - `mapping(address => bool) public whitelistedTokens` - Tracks approved tokens
  - `address[] public whitelistedTokenList` - Array of all whitelisted tokens

### 2. Per-Market Token Support
- Each market now has its own `bettingToken` field in the Market struct
- Markets can use different tokens independently

### 3. Admin Functions

#### Add Token to Whitelist
```solidity
function addWhitelistedToken(address _token) external onlyOwner
```
- Adds a new token to the whitelist
- Emits `TokenWhitelisted` event

#### Remove Token from Whitelist
```solidity
function removeWhitelistedToken(address _token) external onlyOwner
```
- Removes a token from the whitelist
- Emits `TokenRemovedFromWhitelist` event

#### View Functions
```solidity
function getWhitelistedTokens() external view returns (address[] memory)
function isTokenWhitelisted(address _token) external view returns (bool)
function getMarketToken(uint256 _marketId) external view returns (address)
```

### 4. Market Creation

#### New Function: Create Market with Custom Token
```solidity
function createMarketWithToken(
    string memory _question,
    string memory _description,
    string[] memory _optionNames,
    string[] memory _optionDescriptions,
    uint256 _duration,
    MarketCategory _category,
    MarketType _marketType,
    uint256 _initialLiquidity,
    bool _earlyResolutionAllowed,
    FreeMarketParams memory _freeParams,
    address _bettingToken
) external returns (uint256)
```

#### Existing Functions (Backward Compatible)
- `createMarket()` functions continue to work using the default `bettingToken`
- No breaking changes to existing integrations

### 5. Fee Withdrawal

#### New Function: Withdraw Fees for Specific Token
```solidity
function withdrawPlatformFeesForToken(address _token, uint256 _amount) external onlyOwner
```
- Allows admin to withdraw platform fees collected in any whitelisted token

#### Emergency Withdrawal
```solidity
function emergencyWithdrawToken(address _token, uint256 _amount) external onlyOwner
```
- Emergency function to withdraw any token

## Migration Notes

### Automatic Initialization
- The initial `bettingToken` passed to the constructor is automatically whitelisted
- Existing functionality remains unchanged

### Backward Compatibility
- All existing `createMarket()` functions work as before
- Markets created without specifying a token use the default `bettingToken`
- No changes required to existing frontend/backend integrations

## Usage Example

```solidity
// 1. Admin whitelists a new token (e.g., USDC)
predictionMarket.addWhitelistedToken(usdcAddress);

// 2. Check if token is whitelisted
bool isWhitelisted = predictionMarket.isTokenWhitelisted(usdcAddress);

// 3. Create a market using USDC
uint256 marketId = predictionMarket.createMarketWithToken(
    "Will ETH reach $5000?",
    "Prediction for ETH price",
    ["Yes", "No"],
    ["ETH will reach $5000", "ETH won't reach $5000"],
    7 days,
    MarketCategory.CRYPTO,
    MarketType.STANDARD,
    1000e6, // 1000 USDC (6 decimals)
    false,
    FreeMarketParams(0, 0),
    usdcAddress
);

// 4. Users buy/sell shares using USDC for this market
// (buyShares and sellShares automatically use the market's token)

// 5. Admin withdraws USDC fees
predictionMarket.withdrawPlatformFeesForToken(usdcAddress, amount);
```

## Security Considerations

1. **Token Validation**: Only whitelisted tokens can be used for markets
2. **Per-Market Isolation**: Each market operates with its own token independently
3. **Admin Control**: Only contract owner can manage the whitelist
4. **No Token Mixing**: Users can't accidentally use wrong tokens (enforced by contract)

## Events

```solidity
event TokenWhitelisted(address indexed token, address indexed admin);
event TokenRemovedFromWhitelist(address indexed token, address indexed admin);
```

## Testing Checklist

- [ ] Add token to whitelist
- [ ] Remove token from whitelist
- [ ] Create market with custom token
- [ ] Buy shares with market's token
- [ ] Sell shares with market's token
- [ ] Claim winnings in market's token
- [ ] Withdraw admin liquidity in market's token
- [ ] Withdraw platform fees for specific token
- [ ] Verify token validation on market creation
- [ ] Test backward compatibility with existing createMarket functions
