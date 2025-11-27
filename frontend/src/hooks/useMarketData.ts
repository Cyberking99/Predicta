import { useQuery } from "@tanstack/react-query";
import {
    getMarketById,
    getTradesByMarket,
    getUserPortfolio,
    Market,
    Trade,
    UserPortfolio,
} from "@/lib/rpc-market-data";
import { rpcAnalytics } from "@/lib/rpc-analytics";

export function useMarketData(marketId: string | number) {
    const id = typeof marketId === "number" ? marketId.toString() : marketId;

    const {
        data: market,
        isLoading: isLoadingMarket,
        error: marketError,
    } = useQuery({
        queryKey: ["market", id],
        queryFn: () => getMarketById(id),
        enabled: !!id,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const { data: trades, isLoading: isLoadingTrades } = useQuery({
        queryKey: ["trades", id],
        queryFn: () => getTradesByMarket(id, 100, 0, "timestamp", "desc"),
        enabled: !!id,
        refetchInterval: 15000,
    });

    return {
        market,
        trades,
        isLoading: isLoadingMarket || isLoadingTrades,
        error: marketError,
    };
}

export function usePriceHistory(marketId: string | number, optionId: number) {
    const id = typeof marketId === "number" ? marketId.toString() : marketId;

    const { data: analytics, isLoading } = useQuery({
        queryKey: ["marketAnalytics", id],
        queryFn: () => rpcAnalytics.getMarketAnalytics(id),
        enabled: !!id,
        refetchInterval: 30000,
    });

    // Adapt analytics to PriceHistory[] format
    // Note: RPC analytics returns aggregated data, so we map it to match the expected interface
    const priceHistory = analytics?.priceHistory?.map(p => ({
        id: `${id}-${p.timestamp}`,
        market: { id },
        optionId: optionId.toString(),
        // For binary markets, option 0 is A, option 1 is B
        price: (optionId === 0 ? (p.optionA ?? 0.5) : (p.optionB ?? 0.5)).toString(),
        timestamp: (p.timestamp / 1000).toString(), // Convert ms to seconds to match subgraph format
        volume: p.volume.toString()
    })) || [];

    return {
        priceHistory,
        isLoading,
    };
}

export function useUserPortfolio(userAddress: string) {
    const {
        data: portfolio,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["userPortfolio", userAddress],
        queryFn: () => getUserPortfolio(userAddress),
        enabled: !!userAddress,
        refetchInterval: 30000,
    });

    return {
        portfolio,
        isLoading,
        refetch,
    };
}
