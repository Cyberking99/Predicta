/**
 * RPC Client - Direct blockchain data fetching using viem
 * Replaces subgraph queries with direct contract calls and event logs
 */

import { createPublicClient, http, parseAbiItem, type Address, type Log } from 'viem';
import { base } from 'wagmi/chains';
import { V2contractAddress } from '@/constants/contract';

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
});

// Event signatures for filtering logs
export const EVENT_SIGNATURES = {
  MarketCreated: parseAbiItem('event MarketCreated(uint256 indexed marketId, string question, string[] options, uint256 endTime, uint8 category, uint8 marketType, address creator)'),
  TradeExecuted: parseAbiItem('event TradeExecuted(uint256 indexed marketId, uint256 indexed optionId, address buyer, address seller, uint256 price, uint256 quantity, uint256 timestamp)'),
  MarketResolved: parseAbiItem('event MarketResolved(uint256 indexed marketId, uint256 winningOptionId, address resolver)'),
  MarketInvalidated: parseAbiItem('event MarketInvalidated(uint256 indexed marketId, address validator, uint256 refundedAmount)'),
  MarketValidated: parseAbiItem('event MarketValidated(uint256 indexed marketId, address validator)'),
  Claimed: parseAbiItem('event Claimed(uint256 indexed marketId, address indexed user, uint256 amount)'),
  FreeTokensClaimed: parseAbiItem('event FreeTokensClaimed(uint256 indexed marketId, address indexed user, uint256 tokens)'),
} as const;

// Cache for block numbers to optimize event fetching
const LAST_SYNCED_BLOCK_KEY = 'rpc_last_synced_block';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface CachedData<T> {
  data: T;
  lastUpdated: number;
  blockNumber: bigint;
}

// In-memory cache
const cache = new Map<string, CachedData<any>>();

/**
 * Get the last synced block number from localStorage
 */
export function getLastSyncedBlock(): bigint {
  if (typeof window === 'undefined') return 0n;
  
  const stored = localStorage.getItem(LAST_SYNCED_BLOCK_KEY);
  return stored ? BigInt(stored) : 0n;
}

/**
 * Update the last synced block number
 */
export function setLastSyncedBlock(blockNumber: bigint): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(LAST_SYNCED_BLOCK_KEY, blockNumber.toString());
}

/**
 * Get cached data if still valid
 */
export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.lastUpdated > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Set cached data
 */
export function setCachedData<T>(key: string, data: T, blockNumber: bigint): void {
  cache.set(key, {
    data,
    lastUpdated: Date.now(),
    blockNumber,
  });
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}


/**
 * Fetch events with pagination and caching
 */
export async function fetchEvents<T extends Log>(
  eventSignature: any,
  options: {
    fromBlock?: bigint;
    toBlock?: bigint;
    address?: Address;
    args?: any;
  } = {}
): Promise<T[]> {
  const address = options.address || V2contractAddress as Address;
  const toBlock = options.toBlock || await publicClient.getBlockNumber();
  const fromBlock = options.fromBlock || 0n;

  try {
    const logs = await publicClient.getLogs({
      address,
      event: eventSignature,
      fromBlock,
      toBlock,
      args: options.args,
    });

    return logs as T[];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

/**
 * Fetch market creation events
 */
export async function fetchMarketCreatedEvents(
  fromBlock?: bigint,
  toBlock?: bigint
): Promise<any[]> {
  const events = await fetchEvents(EVENT_SIGNATURES.MarketCreated, {
    fromBlock,
    toBlock,
  });

  return events.map((event: any) => ({
    marketId: event.args.marketId?.toString(),
    question: event.args.question,
    options: event.args.options,
    endTime: event.args.endTime?.toString(),
    category: event.args.category,
    marketType: event.args.marketType,
    creator: event.args.creator,
    blockNumber: event.blockNumber?.toString(),
    blockTimestamp: event.blockNumber, // Will need to fetch actual timestamp
    transactionHash: event.transactionHash,
  }));
}

/**
 * Fetch trade events for a specific market
 */
export async function fetchTradeEvents(
  marketId: bigint,
  fromBlock?: bigint,
  toBlock?: bigint
): Promise<any[]> {
  const events = await fetchEvents(EVENT_SIGNATURES.TradeExecuted, {
    fromBlock,
    toBlock,
    args: { marketId },
  });

  return events.map((event: any) => ({
    marketId: event.args.marketId?.toString(),
    optionId: event.args.optionId?.toString(),
    buyer: event.args.buyer,
    seller: event.args.seller,
    price: event.args.price?.toString(),
    quantity: event.args.quantity?.toString(),
    timestamp: event.args.timestamp?.toString(),
    blockNumber: event.blockNumber?.toString(),
    transactionHash: event.transactionHash,
  }));
}

/**
 * Fetch market resolution events
 */
export async function fetchMarketResolvedEvents(
  marketId?: bigint,
  fromBlock?: bigint,
  toBlock?: bigint
): Promise<any[]> {
  const events = await fetchEvents(EVENT_SIGNATURES.MarketResolved, {
    fromBlock,
    toBlock,
    args: marketId ? { marketId } : undefined,
  });

  return events.map((event: any) => ({
    marketId: event.args.marketId?.toString(),
    winningOptionId: event.args.winningOptionId?.toString(),
    resolver: event.args.resolver,
    blockNumber: event.blockNumber?.toString(),
    transactionHash: event.transactionHash,
  }));
}

/**
 * Fetch market invalidation events
 */
export async function fetchMarketInvalidatedEvents(
  marketId?: bigint,
  fromBlock?: bigint,
  toBlock?: bigint
): Promise<any[]> {
  const events = await fetchEvents(EVENT_SIGNATURES.MarketInvalidated, {
    fromBlock,
    toBlock,
    args: marketId ? { marketId } : undefined,
  });

  return events.map((event: any) => ({
    marketId: event.args.marketId?.toString(),
    validator: event.args.validator,
    refundedAmount: event.args.refundedAmount?.toString(),
    blockNumber: event.blockNumber?.toString(),
    transactionHash: event.transactionHash,
  }));
}

/**
 * Batch fetch multiple event types for a market
 */
export async function fetchMarketEvents(marketId: bigint) {
  const [trades, resolved, invalidated] = await Promise.all([
    fetchTradeEvents(marketId),
    fetchMarketResolvedEvents(marketId),
    fetchMarketInvalidatedEvents(marketId),
  ]);

  return {
    trades,
    resolved: resolved[0] || null,
    invalidated: invalidated[0] || null,
  };
}

/**
 * Get block timestamp (cached)
 */
const blockTimestampCache = new Map<string, number>();

export async function getBlockTimestamp(blockNumber: bigint): Promise<number> {
  const key = blockNumber.toString();
  
  if (blockTimestampCache.has(key)) {
    return blockTimestampCache.get(key)!;
  }

  try {
    const block = await publicClient.getBlock({ blockNumber });
    const timestamp = Number(block.timestamp);
    blockTimestampCache.set(key, timestamp);
    return timestamp;
  } catch (error) {
    console.error('Error fetching block timestamp:', error);
    return Date.now() / 1000; // Fallback to current time
  }
}

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export function paginateArray<T>(
  array: T[],
  options: PaginationOptions = {}
): { data: T[]; total: number; page: number; pageSize: number } {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: array.slice(start, end),
    total: array.length,
    page,
    pageSize,
  };
}
