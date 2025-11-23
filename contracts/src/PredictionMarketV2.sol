// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarketV2
 * @notice Multi-option prediction market with LMSR pricing mechanism
 * @dev Supports free markets, market validation, and platform fees
 */
contract PredictionMarketV2 is AccessControl, Ownable, Pausable, ReentrancyGuard {
    
    // ============ Constants ============
    
    bytes32 public constant QUESTION_CREATOR_ROLE = keccak256("QUESTION_CREATOR_ROLE");
    bytes32 public constant QUESTION_RESOLVE_ROLE = keccak256("QUESTION_RESOLVE_ROLE");
    bytes32 public constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");
    bytes32 public constant MARKET_VALIDATOR_ROLE = keccak256("MARKET_VALIDATOR_ROLE");
    
    uint256 public constant PAYOUT_PER_SHARE = 1e18; // 1 token per winning share
    uint256 public constant MIN_MARKET_DURATION = 1 hours;
    uint256 public constant MAX_MARKET_DURATION = 365 days;
    uint256 public constant MIN_LMSR_B = 1e18; // Minimum liquidity parameter
    uint256 public constant MAX_LMSR_B = 1000000e18; // Maximum liquidity parameter
    
    // ============ State Variables ============
    
    IERC20 public bettingToken; // Deprecated: kept for backward compatibility
    address public previousBettingToken;
    address public feeCollector;
    address public freeClaimHandler;
    
    uint256 public marketCount;
    uint256 public platformFeeRate = 25; // 2.5% (basis points: 25/1000)
    uint256 public globalTradeCount;
    
    uint256 public totalPlatformFeesCollected;
    uint256 public totalLockedPlatformFees;
    uint256 public totalUnlockedPlatformFees;
    uint256 public totalWithdrawnPlatformFees;
    
    address[] public allParticipants;
    
    // Token whitelist
    mapping(address => bool) public whitelistedTokens;
    address[] public whitelistedTokenList;

    // ============ Enums ============
    
    enum MarketCategory {
        POLITICS,
        SPORTS,
        CRYPTO,
        ENTERTAINMENT,
        SCIENCE,
        OTHER
    }
    
    enum MarketType {
        STANDARD,
        FREE
    }
    
    // ============ Structs ============
    
    struct Market {
        string question;
        string description;
        uint256 endTime;
        uint256 createdAt;
        MarketCategory category;
        MarketType marketType;
        address creator;
        bool resolved;
        bool invalidated;
        bool disputed;
        bool validated;
        uint256 winningOptionId;
        uint256 optionCount;
        uint256 totalVolume;
        uint256 lmsrB; // Liquidity parameter for LMSR
        uint256 adminInitialLiquidity;
        uint256 userLiquidity;
        uint256 platformFeesCollected;
        bool adminLiquidityClaimed;
        bool earlyResolutionAllowed;
        address bettingToken; // Token used for this market
    }
    
    struct Option {
        string name;
        string description;
        uint256 totalShares;
        uint256 totalVolume;
        uint256 currentPrice;
        bool isActive;
    }
    
    struct FreeMarketParams {
        uint256 maxFreeParticipants;
        uint256 tokensPerParticipant;
    }
    
    struct FreeMarketConfig {
        uint256 maxFreeParticipants;
        uint256 tokensPerParticipant;
        uint256 currentFreeParticipants;
        uint256 totalPrizePool;
        uint256 remainingPrizePool;
        bool isActive;
    }

    struct Trade {
        uint256 marketId;
        uint256 optionId;
        address buyer;
        address seller;
        uint256 price;
        uint256 quantity;
        uint256 timestamp;
    }
    
    struct UserPortfolio {
        uint256 totalInvested;
        uint256 totalWinnings;
        int256 unrealizedPnL;
        int256 realizedPnL;
        uint256 tradeCount;
    }
    
    struct PricePoint {
        uint256 price;
        uint256 timestamp;
        uint256 volume;
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(uint256 => Option)) public options;
    mapping(uint256 => FreeMarketConfig) public freeMarketConfigs;
    
    // User shares: user => marketId => optionId => shares
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userShares;
    
    // User cost basis: user => marketId => optionId => cost
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userCostBasis;
    
    // Claim status: marketId => user => (claimedWinnings, claimedFreeTokens)
    mapping(uint256 => mapping(address => bool)) public hasClaimedWinnings;
    mapping(uint256 => mapping(address => bool)) public hasClaimedFreeTokens;
    
    // User portfolios
    mapping(address => UserPortfolio) public userPortfolios;
    
    // Trade history: user => trades[]
    mapping(address => Trade[]) public userTradeHistory;
    
    // Price history: marketId => optionId => pricePoints[]
    mapping(uint256 => mapping(uint256 => PricePoint[])) public priceHistory;
    
    // Market categorization
    mapping(MarketCategory => uint256[]) public categoryMarkets;
    mapping(MarketType => uint256[]) public marketsByType;

    // ============ Events ============
    
    event MarketCreated(
        uint256 indexed marketId,
        string question,
        string[] options,
        uint256 endTime,
        MarketCategory category,
        MarketType marketType,
        address creator
    );
    
    event TradeExecuted(
        uint256 indexed marketId,
        uint256 indexed optionId,
        address buyer,
        address seller,
        uint256 price,
        uint256 quantity,
        uint256 timestamp
    );
    
    event MarketResolved(
        uint256 indexed marketId,
        uint256 winningOptionId,
        address resolver
    );
    
    event MarketInvalidated(
        uint256 indexed marketId,
        address validator,
        uint256 refundedAmount
    );
    
    event MarketValidated(
        uint256 indexed marketId,
        address validator
    );
    
    event MarketDisputed(
        uint256 indexed marketId,
        address disputer,
        string reason
    );
    
    event Claimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );
    
    event FreeTokensClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 tokens
    );

    event FreeMarketConfigSet(
        uint256 indexed marketId,
        uint256 maxFreeParticipants,
        uint256 tokensPerParticipant,
        uint256 totalPrizePool
    );
    
    event FeeAccrued(
        uint256 indexed marketId,
        uint256 indexed optionId,
        bool isBuy,
        uint256 rawAmount,
        uint256 fee
    );
    
    event FeesUnlocked(
        uint256 indexed marketId,
        uint256 amount
    );
    
    event PlatformFeesWithdrawn(
        address indexed collector,
        uint256 amount
    );
    
    event AdminLiquidityWithdrawn(
        uint256 indexed marketId,
        address indexed creator,
        uint256 amount
    );
    
    event FeeCollectorUpdated(
        address indexed oldCollector,
        address indexed newCollector
    );
    
    event BComputed(
        uint256 indexed marketId,
        uint256 bValue,
        uint256 coverageRatioNum,
        uint256 coverageRatioDen
    );
    
    event SlippageProtect(
        uint256 indexed marketId,
        uint256 indexed optionId,
        bool isBuy,
        uint256 quantity,
        uint256 bound,
        uint256 actualTotal
    );
    
    event TokenWhitelisted(
        address indexed token,
        address indexed admin
    );
    
    event TokenRemovedFromWhitelist(
        address indexed token,
        address indexed admin
    );

    // ============ Constructor ============
    
    constructor(address _bettingToken) Ownable(msg.sender) {
        require(_bettingToken != address(0), "Invalid token address");
        feeCollector = msg.sender;
        
        // Automatically whitelist the initial betting token
        whitelistedTokens[_bettingToken] = true;
        whitelistedTokenList.push(_bettingToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(QUESTION_CREATOR_ROLE, msg.sender);
        _grantRole(QUESTION_RESOLVE_ROLE, msg.sender);
        _grantRole(MARKET_CREATOR_ROLE, msg.sender);
        _grantRole(MARKET_VALIDATOR_ROLE, msg.sender);
    }
    
    // ============ Modifiers ============
    
    modifier marketExists(uint256 _marketId) {
        require(_marketId < marketCount, "Market does not exist");
        _;
    }
    
    modifier marketNotResolved(uint256 _marketId) {
        require(!markets[_marketId].resolved, "Market already resolved");
        _;
    }
    
    modifier marketNotInvalidated(uint256 _marketId) {
        require(!markets[_marketId].invalidated, "Market invalidated");
        _;
    }
    
    modifier marketActive(uint256 _marketId) {
        require(block.timestamp < markets[_marketId].endTime, "Market ended");
        _;
    }
    
    modifier marketEnded(uint256 _marketId) {
        require(block.timestamp >= markets[_marketId].endTime, "Market not ended");
        _;
    }

    // ============ Market Creation ============
    
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
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(whitelistedTokens[_bettingToken], "Token not whitelisted");
        return _createMarket(
            _question,
            _description,
            _optionNames,
            _optionDescriptions,
            _duration,
            _category,
            _marketType,
            _initialLiquidity,
            _earlyResolutionAllowed,
            _freeParams,
            _bettingToken
        );
    }

    function _createMarket(
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
    ) internal returns (uint256) {
        require(bytes(_question).length > 0, "Question required");
        require(_optionNames.length >= 2, "At least 2 options required");
        require(_optionNames.length == _optionDescriptions.length, "Options mismatch");
        require(_duration >= MIN_MARKET_DURATION && _duration <= MAX_MARKET_DURATION, "Invalid duration");
        require(_initialLiquidity > 0, "Initial liquidity required");
        require(whitelistedTokens[_bettingToken], "Token not whitelisted");
        
        uint256 marketId = marketCount++;
        uint256 endTime = block.timestamp + _duration;
        
        // Transfer initial liquidity
        require(IERC20(_bettingToken).transferFrom(msg.sender, address(this), _initialLiquidity), "Transfer failed");
        
        // Calculate LMSR B parameter
        uint256 lmsrB = _calculateLMSRB(_initialLiquidity, _optionNames.length);
        
        markets[marketId] = Market({
            question: _question,
            description: _description,
            endTime: endTime,
            createdAt: block.timestamp,
            category: _category,
            marketType: _marketType,
            creator: msg.sender,
            resolved: false,
            invalidated: false,
            disputed: false,
            validated: false,
            winningOptionId: 0,
            optionCount: _optionNames.length,
            totalVolume: 0,
            lmsrB: lmsrB,
            adminInitialLiquidity: _initialLiquidity,
            userLiquidity: 0,
            platformFeesCollected: 0,
            adminLiquidityClaimed: false,
            earlyResolutionAllowed: _earlyResolutionAllowed,
            bettingToken: _bettingToken
        });

        // Initialize options with equal shares from initial liquidity
        uint256 sharesPerOption = _initialLiquidity / _optionNames.length;
        for (uint256 i = 0; i < _optionNames.length; i++) {
            options[marketId][i] = Option({
                name: _optionNames[i],
                description: _optionDescriptions[i],
                totalShares: sharesPerOption,
                totalVolume: 0,
                currentPrice: 1e18 / _optionNames.length, // Equal initial price
                isActive: true
            });
        }
        
        // Setup free market if applicable
        if (_marketType == MarketType.FREE && _freeParams.maxFreeParticipants > 0) {
            uint256 totalPrizePool = _freeParams.maxFreeParticipants * _freeParams.tokensPerParticipant;
            freeMarketConfigs[marketId] = FreeMarketConfig({
                maxFreeParticipants: _freeParams.maxFreeParticipants,
                tokensPerParticipant: _freeParams.tokensPerParticipant,
                currentFreeParticipants: 0,
                totalPrizePool: totalPrizePool,
                remainingPrizePool: totalPrizePool,
                isActive: true
            });
            
            emit FreeMarketConfigSet(marketId, _freeParams.maxFreeParticipants, _freeParams.tokensPerParticipant, totalPrizePool);
        }
        
        categoryMarkets[_category].push(marketId);
        marketsByType[_marketType].push(marketId);
        
        emit MarketCreated(marketId, _question, _optionNames, endTime, _category, _marketType, msg.sender);
        emit BComputed(marketId, lmsrB, _initialLiquidity, _optionNames.length);
        
        return marketId;
    }
    
    function _calculateLMSRB(uint256 _liquidity, uint256 _optionCount) internal pure returns (uint256) {
        // B = liquidity / ln(optionCount)
        // Simplified: B ≈ liquidity / optionCount for practical purposes
        uint256 b = (_liquidity * 1e18) / (_optionCount * 1e18);
        if (b < MIN_LMSR_B) b = MIN_LMSR_B;
        if (b > MAX_LMSR_B) b = MAX_LMSR_B;
        return b;
    }

    // ============ Trading Functions ============
    
    function buyShares(
        uint256 _marketId,
        uint256 _optionId,
        uint256 _quantity,
        uint256 _maxPricePerShare,
        uint256 _maxTotalCost
    ) external whenNotPaused nonReentrant 
        marketExists(_marketId)
        marketActive(_marketId)
        marketNotResolved(_marketId)
        marketNotInvalidated(_marketId) {
        
        require(_optionId < markets[_marketId].optionCount, "Invalid option");
        require(_quantity > 0, "Quantity must be > 0");
        require(options[_marketId][_optionId].isActive, "Option not active");
        
        // Calculate cost using LMSR
        uint256 totalCost = _calculateBuyCost(_marketId, _optionId, _quantity);
        uint256 pricePerShare = (totalCost * 1e18) / _quantity;
        
        // Slippage protection
        require(pricePerShare <= _maxPricePerShare, "Price per share too high");
        require(totalCost <= _maxTotalCost, "Total cost too high");
        
        emit SlippageProtect(_marketId, _optionId, true, _quantity, _maxTotalCost, totalCost);
        
        // Calculate platform fee
        uint256 fee = (totalCost * platformFeeRate) / 1000;
        uint256 totalPayment = totalCost + fee;
        
        // Transfer tokens
        IERC20 marketToken = IERC20(markets[_marketId].bettingToken);
        require(marketToken.transferFrom(msg.sender, address(this), totalPayment), "Transfer failed");
        
        // Update state
        options[_marketId][_optionId].totalShares += _quantity;
        options[_marketId][_optionId].totalVolume += totalCost;
        markets[_marketId].totalVolume += totalCost;
        markets[_marketId].platformFeesCollected += fee;
        markets[_marketId].userLiquidity += totalCost;
        
        userShares[msg.sender][_marketId][_optionId] += _quantity;
        userCostBasis[msg.sender][_marketId][_optionId] += totalCost;
        
        // Update portfolio
        userPortfolios[msg.sender].totalInvested += totalCost;
        userPortfolios[msg.sender].tradeCount++;

        // Record trade
        Trade memory trade = Trade({
            marketId: _marketId,
            optionId: _optionId,
            buyer: msg.sender,
            seller: address(0),
            price: pricePerShare,
            quantity: _quantity,
            timestamp: block.timestamp
        });
        userTradeHistory[msg.sender].push(trade);
        globalTradeCount++;
        
        // Update price
        _updatePrice(_marketId, _optionId);
        
        // Record price history
        priceHistory[_marketId][_optionId].push(PricePoint({
            price: options[_marketId][_optionId].currentPrice,
            timestamp: block.timestamp,
            volume: totalCost
        }));
        
        // Track fees
        totalPlatformFeesCollected += fee;
        totalLockedPlatformFees += fee;
        
        emit FeeAccrued(_marketId, _optionId, true, totalCost, fee);
        emit TradeExecuted(_marketId, _optionId, msg.sender, address(0), pricePerShare, _quantity, block.timestamp);
    }
    
    function sellShares(
        uint256 _marketId,
        uint256 _optionId,
        uint256 _quantity,
        uint256 _minPricePerShare,
        uint256 _minTotalProceeds
    ) external whenNotPaused nonReentrant 
        marketExists(_marketId)
        marketActive(_marketId)
        marketNotResolved(_marketId)
        marketNotInvalidated(_marketId) {
        
        require(_optionId < markets[_marketId].optionCount, "Invalid option");
        require(_quantity > 0, "Quantity must be > 0");
        require(userShares[msg.sender][_marketId][_optionId] >= _quantity, "Insufficient shares");

        // Calculate proceeds using LMSR
        uint256 totalProceeds = _calculateSellProceeds(_marketId, _optionId, _quantity);
        uint256 pricePerShare = (totalProceeds * 1e18) / _quantity;
        
        // Slippage protection
        require(pricePerShare >= _minPricePerShare, "Price per share too low");
        require(totalProceeds >= _minTotalProceeds, "Total proceeds too low");
        
        emit SlippageProtect(_marketId, _optionId, false, _quantity, _minTotalProceeds, totalProceeds);
        
        // Calculate platform fee
        uint256 fee = (totalProceeds * platformFeeRate) / 1000;
        uint256 netProceeds = totalProceeds - fee;
        
        // Update state
        options[_marketId][_optionId].totalShares -= _quantity;
        options[_marketId][_optionId].totalVolume += totalProceeds;
        markets[_marketId].totalVolume += totalProceeds;
        markets[_marketId].platformFeesCollected += fee;
        
        userShares[msg.sender][_marketId][_optionId] -= _quantity;
        
        // Update cost basis proportionally
        uint256 costReduction = (userCostBasis[msg.sender][_marketId][_optionId] * _quantity) / 
                                (userShares[msg.sender][_marketId][_optionId] + _quantity);
        userCostBasis[msg.sender][_marketId][_optionId] -= costReduction;
        
        // Update portfolio
        int256 pnl = int256(netProceeds) - int256(costReduction);
        userPortfolios[msg.sender].realizedPnL += pnl;
        userPortfolios[msg.sender].tradeCount++;
        
        // Transfer proceeds
        IERC20 marketToken = IERC20(markets[_marketId].bettingToken);
        require(marketToken.transfer(msg.sender, netProceeds), "Transfer failed");
        
        // Record trade
        Trade memory trade = Trade({
            marketId: _marketId,
            optionId: _optionId,
            buyer: address(0),
            seller: msg.sender,
            price: pricePerShare,
            quantity: _quantity,
            timestamp: block.timestamp
        });
        userTradeHistory[msg.sender].push(trade);
        globalTradeCount++;

        // Update price
        _updatePrice(_marketId, _optionId);
        
        // Record price history
        priceHistory[_marketId][_optionId].push(PricePoint({
            price: options[_marketId][_optionId].currentPrice,
            timestamp: block.timestamp,
            volume: totalProceeds
        }));
        
        // Track fees
        totalPlatformFeesCollected += fee;
        totalLockedPlatformFees += fee;
        
        emit FeeAccrued(_marketId, _optionId, false, totalProceeds, fee);
        emit TradeExecuted(_marketId, _optionId, address(0), msg.sender, pricePerShare, _quantity, block.timestamp);
    }
    
    function _calculateBuyCost(uint256 _marketId, uint256 _optionId, uint256 _quantity) internal view returns (uint256) {
        // Simplified LMSR: cost = B * ln(exp(newShares/B) / exp(oldShares/B))
        // For practical implementation: cost ≈ quantity * currentPrice * adjustment
        uint256 currentShares = options[_marketId][_optionId].totalShares;
        uint256 newShares = currentShares + _quantity;
        uint256 b = markets[_marketId].lmsrB;
        
        // Simplified calculation: average price between current and new state
        uint256 avgPrice = _calculatePrice(_marketId, _optionId, currentShares + _quantity / 2);
        return (_quantity * avgPrice) / 1e18;
    }
    
    function _calculateSellProceeds(uint256 _marketId, uint256 _optionId, uint256 _quantity) internal view returns (uint256) {
        uint256 currentShares = options[_marketId][_optionId].totalShares;
        require(currentShares >= _quantity, "Insufficient market shares");
        
        // Simplified calculation: average price between current and new state
        uint256 avgPrice = _calculatePrice(_marketId, _optionId, currentShares - _quantity / 2);
        return (_quantity * avgPrice) / 1e18;
    }

    function _calculatePrice(uint256 _marketId, uint256 _optionId, uint256 _shares) internal view returns (uint256) {
        // LMSR price: P_i = exp(q_i/B) / sum(exp(q_j/B))
        // Simplified: proportional to shares with exponential weighting
        Market memory market = markets[_marketId];
        uint256 totalWeightedShares = 0;
        uint256 optionWeight = _shares;
        
        for (uint256 i = 0; i < market.optionCount; i++) {
            uint256 shares = (i == _optionId) ? _shares : options[_marketId][i].totalShares;
            totalWeightedShares += shares;
        }
        
        if (totalWeightedShares == 0) return 1e18 / market.optionCount;
        return (optionWeight * 1e18) / totalWeightedShares;
    }
    
    function _updatePrice(uint256 _marketId, uint256 _optionId) internal {
        options[_marketId][_optionId].currentPrice = _calculatePrice(
            _marketId, 
            _optionId, 
            options[_marketId][_optionId].totalShares
        );
    }
    
    // ============ Market Resolution ============
    
    function resolveMarket(uint256 _marketId, uint256 _winningOptionId) 
        external 
        onlyRole(QUESTION_RESOLVE_ROLE)
        marketExists(_marketId)
        marketEnded(_marketId)
        marketNotResolved(_marketId)
        marketNotInvalidated(_marketId) {
        
        require(_winningOptionId < markets[_marketId].optionCount, "Invalid option");
        require(!markets[_marketId].disputed, "Market disputed");
        
        markets[_marketId].resolved = true;
        markets[_marketId].winningOptionId = _winningOptionId;
        
        // Unlock platform fees
        uint256 feesToUnlock = markets[_marketId].platformFeesCollected;
        totalLockedPlatformFees -= feesToUnlock;
        totalUnlockedPlatformFees += feesToUnlock;
        
        emit FeesUnlocked(_marketId, feesToUnlock);
        emit MarketResolved(_marketId, _winningOptionId, msg.sender);
    }

    function invalidateMarket(uint256 _marketId)
        external
        onlyRole(MARKET_VALIDATOR_ROLE)
        marketExists(_marketId)
        marketNotResolved(_marketId) {
        
        markets[_marketId].invalidated = true;
        
        // Refund platform fees
        uint256 feesToRefund = markets[_marketId].platformFeesCollected;
        totalLockedPlatformFees -= feesToRefund;
        totalPlatformFeesCollected -= feesToRefund;
        
        emit MarketInvalidated(_marketId, msg.sender, feesToRefund);
    }
    
    function validateMarket(uint256 _marketId)
        external
        onlyRole(MARKET_VALIDATOR_ROLE)
        marketExists(_marketId) {
        
        require(!markets[_marketId].validated, "Already validated");
        markets[_marketId].validated = true;
        
        emit MarketValidated(_marketId, msg.sender);
    }
    
    function disputeMarket(uint256 _marketId, string memory _reason)
        external
        marketExists(_marketId)
        marketNotResolved(_marketId) {
        
        require(userShares[msg.sender][_marketId][0] > 0 || 
                userShares[msg.sender][_marketId][1] > 0, "Must be participant");
        
        markets[_marketId].disputed = true;
        
        emit MarketDisputed(_marketId, msg.sender, _reason);
    }
    
    // ============ Claiming Functions ============
    
    function claimWinnings(uint256 _marketId)
        external
        nonReentrant
        marketExists(_marketId) {
        
        require(markets[_marketId].resolved, "Market not resolved");
        require(!markets[_marketId].invalidated, "Market invalidated");
        require(!hasClaimedWinnings[_marketId][msg.sender], "Already claimed");

        uint256 winningOptionId = markets[_marketId].winningOptionId;
        uint256 userWinningShares = userShares[msg.sender][_marketId][winningOptionId];
        
        require(userWinningShares > 0, "No winning shares");
        
        uint256 payout = userWinningShares * PAYOUT_PER_SHARE / 1e18;
        hasClaimedWinnings[_marketId][msg.sender] = true;
        
        // Update portfolio
        userPortfolios[msg.sender].totalWinnings += payout;
        
        IERC20 marketToken = IERC20(markets[_marketId].bettingToken);
        require(marketToken.transfer(msg.sender, payout), "Transfer failed");
        
        emit Claimed(_marketId, msg.sender, payout);
    }
    
    function claimFreeTokens(uint256 _marketId, uint256 _optionId)
        external
        nonReentrant
        marketExists(_marketId)
        marketActive(_marketId)
        marketNotResolved(_marketId)
        marketNotInvalidated(_marketId) {
        
        require(markets[_marketId].marketType == MarketType.FREE, "Not a free market");
        require(!hasClaimedFreeTokens[_marketId][msg.sender], "Already claimed");
        require(_optionId < markets[_marketId].optionCount, "Invalid option");
        
        FreeMarketConfig storage config = freeMarketConfigs[_marketId];
        require(config.isActive, "Free market not active");
        require(config.currentFreeParticipants < config.maxFreeParticipants, "Max participants reached");
        require(config.remainingPrizePool >= config.tokensPerParticipant, "Insufficient prize pool");
        
        // Update state
        hasClaimedFreeTokens[_marketId][msg.sender] = true;
        config.currentFreeParticipants++;
        config.remainingPrizePool -= config.tokensPerParticipant;
        
        // Allocate shares
        userShares[msg.sender][_marketId][_optionId] += config.tokensPerParticipant;
        options[_marketId][_optionId].totalShares += config.tokensPerParticipant;
        
        emit FreeTokensClaimed(_marketId, msg.sender, config.tokensPerParticipant);
    }

    // ============ Admin Functions ============
    
    function withdrawAdminLiquidity(uint256 _marketId)
        external
        nonReentrant
        marketExists(_marketId) {
        
        require(msg.sender == markets[_marketId].creator, "Not creator");
        require(markets[_marketId].resolved || markets[_marketId].invalidated, "Market not finalized");
        require(!markets[_marketId].adminLiquidityClaimed, "Already claimed");
        
        markets[_marketId].adminLiquidityClaimed = true;
        uint256 amount = markets[_marketId].adminInitialLiquidity;
        
        IERC20 marketToken = IERC20(markets[_marketId].bettingToken);
        require(marketToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit AdminLiquidityWithdrawn(_marketId, msg.sender, amount);
    }
    
    function withdrawPlatformFees()
        external
        onlyOwner
        nonReentrant {
        
        uint256 amount = totalUnlockedPlatformFees - totalWithdrawnPlatformFees;
        require(amount > 0, "No fees to withdraw");
        
        totalWithdrawnPlatformFees += amount;
        
        address collector = feeCollector != address(0) ? feeCollector : owner();
        require(bettingToken.transfer(collector, amount), "Transfer failed");
        
        emit PlatformFeesWithdrawn(collector, amount);
    }
    
    function withdrawPlatformFeesForToken(address _token, uint256 _amount)
        external
        onlyOwner
        nonReentrant {
        
        require(whitelistedTokens[_token], "Token not whitelisted");
        require(_amount > 0, "Amount must be > 0");
        
        address collector = feeCollector != address(0) ? feeCollector : owner();
        require(IERC20(_token).transfer(collector, _amount), "Transfer failed");
        
        emit PlatformFeesWithdrawn(collector, _amount);
    }
    
    function emergencyWithdraw(uint256 _amount)
        external
        onlyOwner {
        
        require(bettingToken.transfer(owner(), _amount), "Transfer failed");
    }
    
    function emergencyWithdrawToken(address _token, uint256 _amount)
        external
        onlyOwner {
        
        require(IERC20(_token).transfer(owner(), _amount), "Transfer failed");
    }

    // ============ Configuration Functions ============
    
    function setPlatformFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 100, "Fee rate too high"); // Max 10%
        platformFeeRate = _feeRate;
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }
    
    function setFreeClaimHandler(address _handler) external onlyOwner {
        freeClaimHandler = _handler;
    }
    
    // ============ Token Whitelist Management ============
    
    function addWhitelistedToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!whitelistedTokens[_token], "Token already whitelisted");
        
        whitelistedTokens[_token] = true;
        whitelistedTokenList.push(_token);
        
        emit TokenWhitelisted(_token, msg.sender);
    }
    
    function removeWhitelistedToken(address _token) external onlyOwner {
        require(whitelistedTokens[_token], "Token not whitelisted");
        
        whitelistedTokens[_token] = false;
        
        // Remove from array
        for (uint256 i = 0; i < whitelistedTokenList.length; i++) {
            if (whitelistedTokenList[i] == _token) {
                whitelistedTokenList[i] = whitelistedTokenList[whitelistedTokenList.length - 1];
                whitelistedTokenList.pop();
                break;
            }
        }
        
        emit TokenRemovedFromWhitelist(_token, msg.sender);
    }
    
    function getWhitelistedTokens() external view returns (address[] memory) {
        return whitelistedTokenList;
    }
    
    function isTokenWhitelisted(address _token) external view returns (bool) {
        return whitelistedTokens[_token];
    }
    
    function getMarketToken(uint256 _marketId) external view marketExists(_marketId) returns (address) {
        return markets[_marketId].bettingToken;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Role Management ============
    
    function grantQuestionCreatorRole(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(QUESTION_CREATOR_ROLE, _account);
    }
    
    function grantQuestionResolveRole(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(QUESTION_RESOLVE_ROLE, _account);
    }
    
    function grantMarketValidatorRole(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MARKET_VALIDATOR_ROLE, _account);
    }

    // ============ View Functions ============
    
    function getMarketBasicInfo(uint256 _marketId)
        external
        view
        marketExists(_marketId)
        returns (
            string memory question,
            string memory description,
            uint256 endTime,
            MarketCategory category,
            uint256 optionCount,
            bool resolved,
            MarketType marketType,
            bool invalidated,
            uint256 totalVolume
        ) {
        Market memory market = markets[_marketId];
        return (
            market.question,
            market.description,
            market.endTime,
            market.category,
            market.optionCount,
            market.resolved,
            market.marketType,
            market.invalidated,
            market.totalVolume
        );
    }
    
    function getMarketOption(uint256 _marketId, uint256 _optionId)
        external
        view
        marketExists(_marketId)
        returns (
            string memory name,
            string memory description,
            uint256 totalShares,
            uint256 totalVolume,
            uint256 currentPrice,
            bool isActive
        ) {
        Option memory option = options[_marketId][_optionId];
        return (
            option.name,
            option.description,
            option.totalShares,
            option.totalVolume,
            option.currentPrice,
            option.isActive
        );
    }

    function getMarketExtendedMeta(uint256 _marketId)
        external
        view
        marketExists(_marketId)
        returns (
            uint256 winningOptionId,
            bool disputed,
            bool validated,
            address creator,
            bool earlyResolutionAllowed
        ) {
        Market memory market = markets[_marketId];
        return (
            market.winningOptionId,
            market.disputed,
            market.validated,
            market.creator,
            market.earlyResolutionAllowed
        );
    }
    
    function getMarketFinancialsData(uint256 _marketId)
        external
        view
        marketExists(_marketId)
        returns (
            uint256 createdAt,
            address creator,
            bool adminLiquidityClaimed,
            uint256 adminInitialLiquidity,
            uint256 userLiquidity,
            uint256 totalVolume,
            uint256 platformFeesCollected
        ) {
        Market memory market = markets[_marketId];
        return (
            market.createdAt,
            market.creator,
            market.adminLiquidityClaimed,
            market.adminInitialLiquidity,
            market.userLiquidity,
            market.totalVolume,
            market.platformFeesCollected
        );
    }
    
    function getMarketFreeConfig(uint256 _marketId)
        external
        view
        marketExists(_marketId)
        returns (
            uint256 maxFreeParticipants,
            uint256 tokensPerParticipant,
            uint256 currentFreeParticipants,
            uint256 totalPrizePool,
            uint256 remainingPrizePool,
            bool isActive
        ) {
        FreeMarketConfig memory config = freeMarketConfigs[_marketId];
        return (
            config.maxFreeParticipants,
            config.tokensPerParticipant,
            config.currentFreeParticipants,
            config.totalPrizePool,
            config.remainingPrizePool,
            config.isActive
        );
    }

    function getMarketOptionUserShares(uint256 _marketId, uint256 _optionId, address _user)
        external
        view
        returns (uint256) {
        return userShares[_user][_marketId][_optionId];
    }
    
    function getUserClaimStatus(uint256 _marketId, address _user)
        external
        view
        returns (bool claimedWinnings, bool claimedFreeTokens) {
        return (
            hasClaimedWinnings[_marketId][_user],
            hasClaimedFreeTokens[_marketId][_user]
        );
    }
    
    function getMarketLMSRB(uint256 _marketId)
        external
        view
        marketExists(_marketId)
        returns (uint256) {
        return markets[_marketId].lmsrB;
    }
    
    function getMarketDisputeStatus(uint256 _marketId)
        external
        view
        marketExists(_marketId)
        returns (bool) {
        return markets[_marketId].disputed;
    }
    
    // ============ Placeholder Functions for ABI Compatibility ============
    
    function updateLMSRPrices(uint256 marketId) external {
        // Price updates happen automatically in buy/sell
    }
    
    function updateMaxOptionShares(uint256 marketId, uint256 optionId) external {
        // Not needed in this implementation
    }
    
    function updateOptionShares(uint256 marketId, uint256 optionId, uint256 quantity) external {
        // Internal function, not exposed
    }
    
    function updateUserShares(address user, uint256 marketId, uint256 optionId, uint256 quantity) external {
        // Internal function, not exposed
    }
}
