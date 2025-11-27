# RPC Implementation Guide

## Overview
This directory contains the RPC-based data fetching implementation that replaces The Graph subgraph queries with direct blockchain calls using viem.

## Files

### rpc-client.ts
Core RPC client with event fetching utilities.

**Features:**
- Event log fetching with pagination
- Block timestamp caching
- In-memory caching with TTL
- LocalStorage for last synced block
- Helper functions for common queries

**Key Functions:**
- `fetchEvents()` - Generic event fetcher
- `fetchMarketCreatedEvents()` - Get market creation events
- `fetchTradeEvents()` - Get trade events for a market
- `fetchMarketResolvedEvents()` - Get resolution events
- `getCachedData()` / `setCachedData()` - Cache management

### rpc-analytics.ts
Analytics service using event data.

**Features:**
- Market analytics from trade events
- Price history calculation
- Volume history tracking
- 24h price/volume changes
- Fallback analytics for markets with no data

**Key Class:**
- `RPCAnalyticsService` - Main analytics service
- `rpcAnalytics` - Singleton instance

### rpc-market-data.ts
Market data fetching using contract calls.

**Features:**
- Fetch markets with pagination
- Get market by ID
- Fetch trades for a market
- Get user portfolio
- Get user shares

**Key Functions:**
- `getMarkets()` - List markets with pagination
- `getMarketById()` - Get single market details
- `getTradesByMarket()` - Get market trades
- `getUserPortfolio()` - Get user portfolio data
- `getUserShares()` - Get user shares for an option

## Migration from Subgraph

### Before (Subgraph)
```typescript
import { subgraphClient, GET_MARKETS } from '@/lib/subgraph';

const data = await subgraphClient.request(GET_MARKETS, {
  first: 20,
  skip: 0,
  orderBy: 'createdAt',
  orderDirection: 'desc'
});
```

### After (RPC)
```typescript
import { getMarkets } from '@/lib/rpc-market-data';

const markets = await getMarkets(20, 0, 'createdAt', 'desc');
```

## Caching Strategy

### In-Memory Cache
- 5-minute TTL for all cached data
- Automatic cache invalidation
- Per-query caching with unique keys

### LocalStorage
- Stores last synced block number
- Enables incremental event fetching
- Persists across page reloads

### Cache Keys
- Markets: `markets_{first}_{skip}_{orderBy}_{orderDirection}`
- Market: `market_{marketId}`
- Trades: `trades_{marketId}_{first}_{skip}`
- Portfolio: `portfolio_{userAddress}`
- Analytics: `analytics_{marketId}`

## Performance Optimization

### Batch Requests
```typescript
// Fetch multiple market details in parallel
const markets = await Promise.all(
  marketIds.map(id => getMarketById(id))
);
```

### Incremental Sync
```typescript
// Only fetch new events since last sync
const lastBlock = getLastSyncedBlock();
const events = await fetchEvents(signature, {
  fromBlock: lastBlock,
  toBlock: 'latest'
});
setLastSyncedBlock(currentBlock);
```

### Event Pagination
```typescript
// Fetch events in chunks to avoid RPC limits
const CHUNK_SIZE = 10000n;
for (let from = startBlock; from < endBlock; from += CHUNK_SIZE) {
  const to = from + CHUNK_SIZE;
  const events = await fetchEvents(signature, { fromBlock: from, toBlock: to });
  // Process events...
}
```

## Error Handling

All functions include try-catch blocks and return sensible defaults:

```typescript
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Error:', error);
  return fallbackData; // or []
}
```

## React Query Integration

Use with React Query for automatic caching and refetching:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getMarkets } from '@/lib/rpc-market-data';

function useMarkets() {
  return useQuery({
    queryKey: ['markets', 20, 0],
    queryFn: () => getMarkets(20, 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // Refetch every 30s
  });
}
```

## Advantages Over Subgraph

### ✅ Pros
- No external dependency (The Graph)
- No indexing delays
- Direct control over data fetching
- No GraphQL query limits
- Free (only RPC costs)
- Works immediately after contract deployment

### ⚠️ Considerations
- More RPC calls (mitigated by caching)
- Need to handle pagination manually
- Event fetching can be slow for large ranges
- No complex filtering (must filter client-side)

## Best Practices

### 1. Always Use Caching
```typescript
// Check cache first
const cached = getCachedData(key);
if (cached) return cached;

// Fetch and cache
const data = await fetchData();
setCachedData(key, data, blockNumber);
```

### 2. Batch Contract Calls
```typescript
// Use multicall for multiple reads
import { multicall } from '@wagmi/core';

const results = await multicall({
  contracts: [
    { address, abi, functionName: 'getMarket', args: [0] },
    { address, abi, functionName: 'getMarket', args: [1] },
    // ...
  ]
});
```

### 3. Handle Loading States
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['market', id],
  queryFn: () => getMarketById(id),
});

if (isLoading) return <Skeleton />;
if (error) return <Error />;
return <MarketDisplay data={data} />;
```

### 4. Implement Retry Logic
```typescript
const { data } = useQuery({
  queryKey: ['markets'],
  queryFn: getMarkets,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

## Troubleshooting

### Issue: RPC Rate Limiting
**Solution:** Implement exponential backoff and use caching aggressively

### Issue: Slow Event Fetching
**Solution:** Use incremental sync with `getLastSyncedBlock()`

### Issue: Missing Data
**Solution:** Check if events are being emitted correctly from contract

### Issue: Stale Cache
**Solution:** Reduce `CACHE_DURATION` or implement manual cache invalidation

## Testing

```typescript
// Test event fetching
const events = await fetchMarketCreatedEvents();
console.log('Markets:', events.length);

// Test market data
const market = await getMarketById('0');
console.log('Market:', market);

// Test analytics
const analytics = await rpcAnalytics.getMarketAnalytics('0');
console.log('Analytics:', analytics);

// Clear cache
clearCache();
```

## Future Improvements

1. **Implement Multicall** - Batch multiple contract reads
2. **Add Websocket Support** - Real-time event listening
3. **Optimize Block Fetching** - Cache block timestamps more efficiently
4. **Add Retry Logic** - Automatic retry on RPC failures
5. **Implement Rate Limiting** - Prevent hitting RPC limits
6. **Add Metrics** - Track RPC call counts and performance

## Resources

- [Viem Documentation](https://viem.sh/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Ethereum JSON-RPC Specification](https://ethereum.org/en/developers/docs/apis/json-rpc/)
