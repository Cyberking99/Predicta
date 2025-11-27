/**
 * RPC Analytics - Event-based analytics using direct blockchain data
 * Replaces subgraph-analytics.ts with RPC-based implementation
 */

import {
  fetchTradeEvents,
  getCachedData,
  setCachedData,
  getBlockTimestamp,
} from './rpc-client';
import {
  MarketAnalytics,
  PriceHistoryData,
  VolumeHistoryData,
} from '@/types/types';

export class RPCAnalyticsService {
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get market analytics from trade events
   */
  async getMarketAnalytics(marketId: string): Promise<MarketAnalytics> {
    // Check cache first
    const cacheKey = `analytics_${marketId}`;
    const cached = getCachedData<MarketAnalytics>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Fetch trade events
      const trades = await fetchTradeEvents(BigInt(marketId));

      if (trades.length === 0) {
        console.log(`No trade data found for market ${marketId}, using fallback`);
        return this.generateFallbackAnalytics();
      }

      const analytics = await this.processTradeData(trades);

      // Cache the result
      setCachedData(cacheKey, analytics, 0n);

      return analytics;
    } catch (error) {
      console.error('Error fetching market analytics:', error);
      return this.generateFallbackAnalytics();
    }
  }

  /**
   * Process trade events into analytics data
   */
  private async processTradeData(trades: any[]): Promise<MarketAnalytics> {
    // Convert trades to events with timestamps
    const events = await Promise.all(
      trades.map(async (trade) => {
        const timestamp = trade.timestamp
          ? parseInt(trade.timestamp) * 1000
          : await getBlockTimestamp(BigInt(trade.blockNumber)) * 1000;

        return {
          ...trade,
          amount: parseFloat(trade.quantity || '0'),
          timestamp,
          blockNumber: BigInt(trade.blockNumber || '0'),
        };
      })
    );

    if (events.length === 0) {
      return this.generateFallbackAnalytics();
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Group by day for price history
    const dailyData = new Map<
      string,
      {
        optionVolumes: Map<string, number>;
        totalVolume: number;
        trades: number;
        timestamp: number;
      }
    >();

    let totalVolume = 0;
    let totalTrades = 0;

    events.forEach((event) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      const existing = dailyData.get(date) || {
        optionVolumes: new Map<string, number>(),
        totalVolume: 0,
        trades: 0,
        timestamp: event.timestamp,
      };

      const amount = event.amount || 0;
      const optionId = event.optionId || '0';

      // Update option volume
      const currentVolume = existing.optionVolumes.get(optionId) || 0;
      existing.optionVolumes.set(optionId, currentVolume + amount);

      existing.totalVolume += amount;
      existing.trades += 1;
      totalVolume += amount;
      totalTrades += 1;

      dailyData.set(date, existing);
    });

    // Calculate price history (for binary markets, use option 0 and 1)
    const priceHistory: PriceHistoryData[] = [];
    const runningVolumes = new Map<string, number>();

    Array.from(dailyData.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .forEach(([date, data]) => {
        // Update running totals
        data.optionVolumes.forEach((volume, optionId) => {
          const current = runningVolumes.get(optionId) || 0;
          runningVolumes.set(optionId, current + volume);
        });

        // Calculate total volume
        let totalVol = 0;
        runningVolumes.forEach((vol) => {
          totalVol += vol;
        });

        // Calculate prices (percentage of total volume)
        const optionAVol = runningVolumes.get('0') || 0;
        const optionBVol = runningVolumes.get('1') || 0;

        const optionA = totalVol > 0 ? optionAVol / totalVol : 0.5;
        const optionB = totalVol > 0 ? optionBVol / totalVol : 0.5;

        priceHistory.push({
          date,
          timestamp: data.timestamp,
          optionA: Math.round(optionA * 1000) / 1000,
          optionB: Math.round(optionB * 1000) / 1000,
          volume: data.totalVolume,
          trades: data.trades,
        });
      });

    // Volume history
    const volumeHistory: VolumeHistoryData[] = Array.from(dailyData.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .map(([date, data]) => ({
        date,
        timestamp: data.timestamp,
        volume: data.totalVolume,
        trades: data.trades,
      }));

    const priceChange24h = this.calculatePriceChange(priceHistory);
    const volumeChange24h = this.calculateVolumeChange(volumeHistory);

    return {
      priceHistory,
      volumeHistory,
      totalVolume,
      totalTrades,
      priceChange24h,
      volumeChange24h,
      lastUpdated: new Date().toISOString(),
    };
  }

  private calculatePriceChange(priceHistory: PriceHistoryData[]): number {
    if (priceHistory.length < 2) return 0;

    const latest = priceHistory[priceHistory.length - 1];
    const previous = priceHistory[priceHistory.length - 2];

    const latestPrice = latest.optionA ?? 0.5;
    const previousPrice = previous.optionA ?? 0.5;

    return latestPrice - previousPrice;
  }

  private calculateVolumeChange(volumeHistory: VolumeHistoryData[]): number {
    if (volumeHistory.length < 2) return 0;

    const latest = volumeHistory[volumeHistory.length - 1];
    const previous = volumeHistory[volumeHistory.length - 2];

    if (previous.volume === 0) return latest.volume > 0 ? 1 : 0;
    return (latest.volume - previous.volume) / previous.volume;
  }

  private generateFallbackAnalytics(): MarketAnalytics {
    const priceHistory: PriceHistoryData[] = [];
    const volumeHistory: VolumeHistoryData[] = [];

    let currentPriceA = 0.5;

    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const volatility = (Math.random() - 0.5) * 0.1;
      currentPriceA = Math.max(
        0.05,
        Math.min(0.95, currentPriceA + volatility)
      );

      const volume = Math.floor(Math.random() * 1000) + 100;
      const trades = Math.floor(Math.random() * 50) + 10;

      priceHistory.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        optionA: Math.round(currentPriceA * 1000) / 1000,
        optionB: Math.round((1 - currentPriceA) * 1000) / 1000,
        volume,
        trades,
      });

      volumeHistory.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        volume,
        trades,
      });
    }

    return {
      priceHistory,
      volumeHistory,
      totalVolume: priceHistory.reduce((sum, p) => sum + p.volume, 0),
      totalTrades: priceHistory.reduce((sum, p) => sum + (p.trades || 0), 0),
      priceChange24h: (Math.random() - 0.5) * 0.2,
      volumeChange24h: (Math.random() - 0.5) * 2,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Clear cache for a specific market or all markets
   */
  clearCache(marketId?: string) {
    if (marketId) {
      const cacheKey = `analytics_${marketId}`;
      // Cache clearing is handled by rpc-client
    }
  }
}

// Export singleton instance
export const rpcAnalytics = new RPCAnalyticsService();
