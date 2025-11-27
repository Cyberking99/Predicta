import { NextResponse } from "next/server";
// Ensure this route runs on the Node.js runtime so server env vars are available
export const runtime = "nodejs";
// This data changes over time and depends on live chain + Neynar; avoid static optimization
export const dynamic = "force-dynamic";

import NodeCache from "node-cache";
import {
  publicClient,
  contractAddress,
  contractAbi,
  tokenAddress as defaultTokenAddress,
  tokenAbi as defaultTokenAbi,
  V2contractAddress,
  V2contractAbi,
} from "@/constants/contract";
import { Address } from "viem";

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 }); // 1-hour TTL
const CACHE_KEY_PREFIX = "leaderboard_v12_"; // Updated version - Pure winnings leaderboard

const PAGE_SIZE = 100; // Users per V1 contract call
const V2_BATCH_SIZE = 50; // Addresses per V2 multicall batch

interface LeaderboardEntry {
  rank: number;
  username: string;
  fid: string;
  pfp_url: string | null;
  winnings: number;
  voteCount: number;
  trend: "up" | "down" | "none";
  address: string;
}

type TimeFrame = "all" | "monthly" | "weekly";
type LeaderboardType = "accuracy" | "volume";

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 2000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      let delay = baseDelay * Math.pow(2, i);
      if (error?.status === 429) {
        delay = Math.max(delay, 10000);
        console.warn(`Rate limit hit, waiting ${delay}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries reached");
}

function getCacheKey(type: LeaderboardType, timeframe: TimeFrame) {
  return `${CACHE_KEY_PREFIX}${type}_${timeframe}`;
}

function calculateTrend(
  currentRank: number,
  previousRank: number
): "up" | "down" | "none" {
  if (previousRank === 0) return "none";
  if (currentRank < previousRank) return "up";
  if (currentRank > previousRank) return "down";
  return "none";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type: LeaderboardType =
    (searchParams.get("type") as LeaderboardType) || "accuracy";
  const timeframe: TimeFrame =
    (searchParams.get("timeframe") as TimeFrame) || "all";
  const forceRefresh = searchParams.get("refresh") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const userAddress = searchParams.get("userAddress")?.toLowerCase(); // Optional: get user's rank

  const cacheKey = getCacheKey(type, timeframe);
  const cachedLeaderboard = cache.get<LeaderboardEntry[]>(cacheKey);

  if (cachedLeaderboard && !forceRefresh) {
    console.log("✅ Serving from cache");

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = cachedLeaderboard.slice(startIndex, endIndex);

    // Get user's rank if address provided
    let userRank = null;
    if (userAddress) {
      const userEntry = cachedLeaderboard.find(
        (entry) => entry.address.toLowerCase() === userAddress
      );
      if (userEntry) {
        userRank = userEntry.rank;
      }
    }

    // Neynar integration removed

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        total: cachedLeaderboard.length,
        totalPages: Math.ceil(cachedLeaderboard.length / pageSize),
      },
      userRank,
    });
  }

  if (forceRefresh) {
    console.log("🔄 Force refresh requested, clearing cache");
    cache.flushAll();
  }

  try {
    console.log("🚀 Starting leaderboard fetch...");

    // Check for required environment variables

    const alchemyRpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;

    if (!alchemyRpcUrl) {
      console.error("❌ NEXT_PUBLIC_ALCHEMY_RPC_URL is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing RPC URL" },
        { status: 500 }
      );
    }

    const [tokenDecimals] = await withRetry(() =>
      publicClient.multicall({
        contracts: [
          {
            address: defaultTokenAddress,
            abi: defaultTokenAbi,
            functionName: "decimals",
          },
        ],
      })
    ).then((results) => [Number(results[0].result)]);
    console.log(`💸 Token Decimals: ${tokenDecimals}`);

    console.log("📊 Fetching leaderboard from V1 and V2 contracts...");

    // ==================== V1 LEADERBOARD ====================
    const totalParticipantsV1 = (await withRetry(() =>
      publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "getAllParticipantsCount",
      })
    )) as bigint;

    console.log(`📊 V1 Total Participants: ${totalParticipantsV1}`);

    const entriesV1: {
      user: Address;
      totalWinnings: bigint;
      voteCount: number;
      totalInvested?: bigint;
    }[] = [];

    for (
      let start = 0;
      start < Number(totalParticipantsV1);
      start += PAGE_SIZE
    ) {
      const batch = (await withRetry(() =>
        publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "getLeaderboard",
          args: [BigInt(start), BigInt(PAGE_SIZE)],
        })
      )) as unknown as {
        user: Address;
        totalWinnings: bigint;
        voteCount: number;
      }[];
      entriesV1.push(...batch);
    }

    // Fetch V2 leaderboard using allParticipants array and userPortfolios mapping
    console.log("📊 Fetching V2 participants and portfolios...");
    const entriesV2: {
      user: Address;
      totalWinnings: bigint;
      voteCount: number;
      totalInvested: bigint;
    }[] = [];

    try {
      const MAX_PARTICIPANTS = 500; // Safety limit
      const addresses: Address[] = [];

      // Step 1: Fetch participant addresses using multicall batches
      let currentIndex = 0;
      let hasMoreParticipants = true;

      while (hasMoreParticipants && currentIndex < MAX_PARTICIPANTS) {
        const batchContracts = Array.from(
          { length: Math.min(V2_BATCH_SIZE, MAX_PARTICIPANTS - currentIndex) },
          (_, i) => ({
            address: V2contractAddress as Address,
            abi: V2contractAbi,
            functionName: "allParticipants" as const,
            args: [BigInt(currentIndex + i)],
          })
        );

        const batchResults = await withRetry(() =>
          publicClient.multicall({
            contracts: batchContracts,
            allowFailure: true,
          })
        );

        const validAddresses = batchResults
          .filter((r) => r.status === "success" && r.result)
          .map((r) => r.result as Address);

        if (validAddresses.length === 0) {
          hasMoreParticipants = false;
          break;
        }

        addresses.push(...validAddresses);
        currentIndex += V2_BATCH_SIZE;

        // If we got fewer results than batch size, we've reached the end
        if (validAddresses.length < V2_BATCH_SIZE) {
          hasMoreParticipants = false;
        }
      }

      console.log(`✅ Found ${addresses.length} V2 participant addresses`);

      // Step 2: Fetch portfolios using multicall batches
      for (let i = 0; i < addresses.length; i += V2_BATCH_SIZE) {
        const batchAddresses = addresses.slice(i, i + V2_BATCH_SIZE);

        const portfolioContracts = batchAddresses.map((addr) => ({
          address: V2contractAddress as Address,
          abi: V2contractAbi,
          functionName: "userPortfolios" as const,
          args: [addr],
        }));

        const portfolioResults = await withRetry(() =>
          publicClient.multicall({
            contracts: portfolioContracts,
            allowFailure: true,
          })
        );

        portfolioResults.forEach((result, idx) => {
          if (result.status === "success" && result.result) {
            const portfolio = result.result as [
              bigint,
              bigint,
              bigint,
              bigint,
              bigint
            ];
            const totalInvested = portfolio[0]; // index 0 = totalInvested
            const totalWinnings = portfolio[1]; // index 1 = totalWinnings
            const tradeCount = Number(portfolio[4]); // index 4 = tradeCount

            if (totalWinnings > 0n) {
              entriesV2.push({
                user: batchAddresses[idx],
                totalWinnings,
                voteCount: tradeCount,
                totalInvested,
              });
            }
          }
        });
      }

      console.log(`✅ Fetched ${entriesV2.length} V2 leaderboard entries`);
    } catch (v2Error) {
      console.error("❌ V2 fetch error (continuing with V1 only):", v2Error);
      // Continue with V1 data only
    }

    // ==================== COMBINE V1 + V2 ====================
    const combinedEntries = new Map<
      string,
      {
        user: Address;
        totalWinnings: bigint;
        voteCount: number;
        totalInvested: bigint;
      }
    >();

    // Add V1 entries
    entriesV1.forEach((entry) => {
      combinedEntries.set(entry.user.toLowerCase(), {
        user: entry.user,
        totalWinnings: entry.totalWinnings,
        voteCount: entry.voteCount,
        totalInvested: 0n, // V1 doesn't track totalInvested
      });
    });

    // Merge V2 entries (add to existing V1 data or create new)
    entriesV2.forEach((entry) => {
      const addr = entry.user.toLowerCase();
      const existing = combinedEntries.get(addr);
      if (existing) {
        // User exists in both V1 and V2 - ADD the values
        combinedEntries.set(addr, {
          user: entry.user,
          totalWinnings:
            BigInt(existing.totalWinnings) + BigInt(entry.totalWinnings),
          voteCount: Number(existing.voteCount) + Number(entry.voteCount),
          totalInvested:
            BigInt(existing.totalInvested) + BigInt(entry.totalInvested),
        });
      } else {
        // User only exists in V2
        combinedEntries.set(addr, {
          user: entry.user,
          totalWinnings: entry.totalWinnings,
          voteCount: entry.voteCount,
          totalInvested: entry.totalInvested,
        });
      }
    });

    // First: Calculate all metrics (just winnings, no accuracy)
    const winnersWithMetrics = Array.from(combinedEntries.values())
      .filter((entry) => entry.totalWinnings > 0n)
      .map((entry) => {
        // Convert BigInt values to numbers before calculations
        const normalizedWinnings =
          Number(entry.totalWinnings) / Math.pow(10, tokenDecimals);
        const voteCount = Number(entry.voteCount);

        return {
          address: entry.user.toLowerCase(),
          winnings: normalizedWinnings,
          voteCount: voteCount,
        };
      });

    // Second: Sort by winnings (total volume)
    const sortedWinners = winnersWithMetrics
      .sort((a, b) => {
        // Sort by winnings - highest to lowest
        return b.winnings - a.winnings;
      })
      .slice(0, 100); // Get top 100 users

    // Third: Assign ranks AFTER sorting
    const winners = sortedWinners.map((winner, index) => ({
      ...winner,
      rank: index + 1,
      trend: calculateTrend(index + 1, 0), // For proper trend implementation, you'd need to store previous ranks
    }));

    console.log(`📊 Combined ${winners.length} total unique winners`);

    // Neynar integration removed
    const addressToUsersMap: Record<string, any> = {}; // Initialize as empty since Neynar integration is removed

    // ==================== BUILD FINAL LEADERBOARD ====================
    console.log("🧠 Building leaderboard...");
    const leaderboard: LeaderboardEntry[] = winners.map((winner) => {
      const usersForAddress = addressToUsersMap[winner.address];
      const user =
        usersForAddress && usersForAddress.length > 0
          ? usersForAddress[0]
          : undefined;

      return {
        rank: winner.rank,
        username:
          user?.username ||
          `${winner.address.slice(0, 6)}...${winner.address.slice(-4)}`,
        fid: user?.fid || "nil",
        pfp_url: user?.pfp_url || null,
        winnings: winner.winnings,
        voteCount: winner.voteCount,
        trend: winner.trend,
        address: winner.address,
      };
    });

    console.log("🏆 Final Leaderboard:", leaderboard);

    // Ensure no BigInt values before caching and returning
    const safeLeaderboard = JSON.parse(
      JSON.stringify(leaderboard, (key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    );

    cache.set(cacheKey, safeLeaderboard);
    console.log("✅ Cached leaderboard");

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = safeLeaderboard.slice(startIndex, endIndex);

    // Get user's rank if address provided
    let userRank = null;
    if (userAddress) {
      const userEntry = safeLeaderboard.find(
        (entry: LeaderboardEntry) => entry.address.toLowerCase() === userAddress
      );
      if (userEntry) {
        userRank = userEntry.rank;
      }
    }

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        total: safeLeaderboard.length,
        totalPages: Math.ceil(safeLeaderboard.length / pageSize),
      },
      userRank,
    });
  } catch (error) {
    console.error("❌ Leaderboard fetch error:", error);

    const cachedLeaderboard = cache.get<LeaderboardEntry[]>(cacheKey);
    if (cachedLeaderboard) {
      console.log("✅ Serving stale cache due to error");
      const safeLeaderboard = JSON.parse(
        JSON.stringify(cachedLeaderboard, (key, value) =>
          typeof value === "bigint" ? Number(value) : value
        )
      );

      // Calculate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = safeLeaderboard.slice(startIndex, endIndex);

      // Get user's rank if address provided
      let userRank = null;
      if (userAddress) {
        const userEntry = safeLeaderboard.find(
          (entry: LeaderboardEntry) =>
            entry.address.toLowerCase() === userAddress
        );
        if (userEntry) {
          userRank = userEntry.rank;
        }
      }

      return NextResponse.json({
        data: paginatedData,
        pagination: {
          page,
          pageSize,
          total: safeLeaderboard.length,
          totalPages: Math.ceil(safeLeaderboard.length / pageSize),
        },
        userRank,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard",
        details: "Please try again later.",
      },
      { status: 500 }
    );
  }
}
