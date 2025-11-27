/**
 * RPC Market Data - Fetch market data using direct contract calls
 * Replaces subgraph queries for market information
 */

import { publicClient } from './rpc-client';
import { V2contractAddress } from '@/constants/contract';
import { V2contractAbi } from '@/constants/contract';
import type { Address } from 'viem';
import {
  fetchMarketCreatedEvents,
  fetchMarketEvents,
  getCachedData,
  setCachedData,
  paginateArray,
  type PaginationOptions,
} from './rpc-client';

// Type definitions matching subgraph interfaces
export interface FreeMarketConfig {
  id: string;
  maxFreeParticipants: string;
  tokensPerParticipant: string;
  totalPrizePool: string;
  currentFreeParticipants: string;
  isActive: boolean;
}

export interface Market {
  id: string;
  marketId: string;
  question: string;
  description: string;
  options: string[];
  endTime: string;
  category: string;
  marketType: string;
  creator: string;
  resolved: boolean;
  winningOptionId?: string;
  invalidated: boolean;
  totalVolume: string;
  liquidity: string;
  createdAt: string;
  optionCount: number;
  freeMarketConfig?: FreeMarketConfig;
}

export interface Trade {
  id: string;
  marketId: string;
  optionId: string;
  buyer: string;
  seller?: string;
  price: string;
  quantity: string;
  timestamp: string;
}

export interface UserPortfolio {
  id: string;
  totalInvested: string;
  totalWinnings: string;
  unrealizedPnL: string;
  realizedPnL: string;
  tradeCount: string;
  updatedAt: string;
}

/**
 * Fetch all markets with pagination
 */
export async function getMarkets(
  first: number = 20,
  skip: number = 0,
  orderBy: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<Market[]> {
  // Validate inputs
  if (first <= 0 || skip < 0) {
    throw new Error('Invalid pagination parameters');
  }

  const cacheKey = `markets_${first}_${skip}_${orderBy}_${orderDirection}`;
  const cached = getCachedData<Market[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Get market count from contract
    const marketCount = await publicClient.readContract({
      address: V2contractAddress as Address,
      abi: V2contractAbi,
      functionName: 'marketCount',
    }) as bigint;

    const count = Number(marketCount);
    const markets: Market[] = [];

    // Fetch markets in batch
    const startId = skip;
    const endId = Math.min(skip + first, count);

    for (let i = startId; i < endId; i++) {
      try {
        const market = await getMarketById(i.toString());
        if (market) {
          markets.push(market);
        }
      } catch (error) {
        console.error(`Error fetching market ${i}:`, error);
      }
    }

    // Sort markets
    markets.sort((a, b) => {
      const aValue = orderBy === 'createdAt' ? parseInt(a.createdAt) : parseInt(a.endTime);
      const bValue = orderBy === 'createdAt' ? parseInt(b.createdAt) : parseInt(b.endTime);
      return orderDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Cache result
    setCachedData(cacheKey, markets, 0n);

    return markets;
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

/**
 * Fetch a single market by ID
 */
export async function getMarketById(marketId: string): Promise<Market | null> {
  if (!marketId) {
    throw new Error('Market ID is required');
  }

  const cacheKey = `market_${marketId}`;
  const cached = getCachedData<Market>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const id = BigInt(marketId);

    // Fetch basic market info
    const [
      basicInfo,
      extendedMeta,
      financials,
    ] = await Promise.all([
      publicClient.readContract({
        address: V2contractAddress as Address,
        abi: V2contractAbi,
        functionName: 'getMarketBasicInfo',
        args: [id],
      }) as Promise<any>,
      publicClient.readContract({
        address: V2contractAddress as Address,
        abi: V2contractAbi,
        functionName: 'getMarketExtendedMeta',
        args: [id],
      }) as Promise<any>,
      publicClient.readContract({
        address: V2contractAddress as Address,
        abi: V2contractAbi,
        functionName: 'getMarketFinancialsData',
        args: [id],
      }) as Promise<any>,
    ]);

    // Fetch options
    const optionCount = Number(basicInfo[4]);
    const options: string[] = [];

    for (let i = 0; i < optionCount; i++) {
      const option = await publicClient.readContract({
        address: V2contractAddress as Address,
        abi: V2contractAbi,
        functionName: 'getMarketOption',
        args: [id, BigInt(i)],
      }) as any;

      options.push(option[0]); // option name
    }

    // Fetch free market config if applicable
    let freeMarketConfig: FreeMarketConfig | undefined;
    if (basicInfo[6].toString() === "1") { // MarketType.FREE_ENTRY
      try {
        const freeInfo = await publicClient.readContract({
          address: V2contractAddress as Address,
          abi: V2contractAbi,
          functionName: 'getFreeMarketInfo' as any,
          args: [id],
        }) as any;

        if (freeInfo) {
          freeMarketConfig = {
            id: marketId,
            maxFreeParticipants: freeInfo[0].toString(),
            tokensPerParticipant: freeInfo[1].toString(),
            currentFreeParticipants: freeInfo[2].toString(),
            totalPrizePool: freeInfo[3].toString(),
            isActive: freeInfo[5],
          };
        }
      } catch (e) {
        console.error(`Error fetching free market info for ${marketId}:`, e);
      }
    }

    const market: Market = {
      id: marketId,
      marketId: marketId,
      question: basicInfo[0],
      description: basicInfo[1],
      options,
      endTime: basicInfo[2].toString(),
      category: basicInfo[3].toString(),
      marketType: basicInfo[6].toString() === "1" ? "FREE" : "PAID", // Normalize to "FREE" or "PAID" to match subgraph if needed, or keep as "0"/"1"
      creator: extendedMeta[3],
      resolved: basicInfo[5],
      winningOptionId: extendedMeta[0]?.toString(),
      invalidated: basicInfo[7],
      totalVolume: financials[5].toString(),
      liquidity: financials[4].toString(),
      createdAt: financials[0].toString(),
      optionCount,
      freeMarketConfig,
    };

    // Cache result
    setCachedData(cacheKey, market, 0n);

    return market;
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error);
    return null;
  }
}

/**
 * Fetch trades for a specific market
 */
export async function getTradesByMarket(
  marketId: string,
  first: number = 100,
  skip: number = 0,
  orderBy: string = 'timestamp',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<Trade[]> {
  if (!marketId || first <= 0 || skip < 0) {
    throw new Error('Invalid parameters');
  }

  const cacheKey = `trades_${marketId}_${first}_${skip}`;
  const cached = getCachedData<Trade[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { trades } = await fetchMarketEvents(BigInt(marketId));

    const formattedTrades: Trade[] = trades.map((trade, index) => ({
      id: `${marketId}-${index}`,
      marketId: trade.marketId,
      optionId: trade.optionId,
      buyer: trade.buyer,
      seller: trade.seller,
      price: trade.price,
      quantity: trade.quantity,
      timestamp: trade.timestamp,
    }));

    // Sort trades
    formattedTrades.sort((a, b) => {
      const aValue = parseInt(a.timestamp);
      const bValue = parseInt(b.timestamp);
      return orderDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Paginate
    const paginated = paginateArray(formattedTrades, { page: skip / first + 1, pageSize: first });

    // Cache result
    setCachedData(cacheKey, paginated.data, 0n);

    return paginated.data;
  } catch (error) {
    console.error('Error fetching trades:', error);
    return [];
  }
}

/**
 * Fetch user portfolio from contract
 */
export async function getUserPortfolio(userAddress: string): Promise<UserPortfolio | null> {
  if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
    throw new Error('Valid user address is required');
  }

  const cacheKey = `portfolio_${userAddress}`;
  const cached = getCachedData<UserPortfolio>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const portfolio = await publicClient.readContract({
      address: V2contractAddress as Address,
      abi: V2contractAbi,
      functionName: 'userPortfolios',
      args: [userAddress as Address],
    }) as any;

    const result: UserPortfolio = {
      id: userAddress.toLowerCase(),
      totalInvested: portfolio[0].toString(),
      totalWinnings: portfolio[1].toString(),
      unrealizedPnL: portfolio[2].toString(),
      realizedPnL: portfolio[3].toString(),
      tradeCount: portfolio[4].toString(),
      updatedAt: Date.now().toString(),
    };

    // Cache result
    setCachedData(cacheKey, result, 0n);

    return result;
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    return null;
  }
}

/**
 * Get user shares for a specific market option
 */
export async function getUserShares(
  userAddress: string,
  marketId: string,
  optionId: string
): Promise<bigint> {
  try {
    const shares = await publicClient.readContract({
      address: V2contractAddress as Address,
      abi: V2contractAbi,
      functionName: 'getMarketOptionUserShares',
      args: [BigInt(marketId), BigInt(optionId), userAddress as Address],
    }) as bigint;

    return shares;
  } catch (error) {
    console.error('Error fetching user shares:', error);
    return 0n;
  }
}
