import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";
import { apolloClient } from "./apollo";

const query = gql`
  query PoolChartData($id: ID!) {
    pool(id: $id) {
      tick
      liquidity
      token0Price
      token1Price
      totalValueLockedToken0
      totalValueLockedToken1
      ticks(orderBy: createdAtTimestamp, orderDirection: asc) {
        tickIdx
        liquidityGross
        liquidityNet
        price0
        price1
        createdAtTimestamp
      }
      poolDayData(orderBy: date, orderDirection: desc) {
        tvlUSD
        close
        date
        high
        low
        open
        tick
        token0Price
        token1Price
        volumeUSD
      }
    }
  }
`;

interface PoolData {
  tick: number;
  liquidity: number;
  token0Price: string;
  token1Price: string;
  totalValueLockedToken0: number;
  totalValueLockedToken1: number;
  ticks: Array<{
    tickIdx: number;
    liquidityGross: number;
    liquidityNet: number;
    price0: string;
    price1: string;
    createdAtTimestamp: UTCTimestamp;
  }>;
}

interface ProcessedLiquidityData {
  barData: Array<{
    tick: number;
    liquidity: number;
    price0: string;
    price1: string;
    time: UTCTimestamp;
    amount0Locked: number;
    amount1Locked: number;
  }>;
  activeRangeData: {
    tick: number;
    price0: string;
    price1: string;
    liquidity: number;
    time: UTCTimestamp;
    amount0Locked: number;
    amount1Locked: number;
  };
  activeRangePercentage: number;
}

function processLiquidityData(poolData: PoolData): ProcessedLiquidityData {
  let totalLiquidity = 0;

  // Sort ticks by tick index only, we don't need timestamp sorting for liquidity chart
  const sortedTicks = poolData.ticks.sort((a, b) => a.tickIdx - b.tickIdx);

  const formatTimestamp = (tickIdx: number): UTCTimestamp => {
    // Use tick index as time to ensure proper bar spacing
    return tickIdx as UTCTimestamp;
  };

  // Calculate total liquidity first
  totalLiquidity = sortedTicks.reduce(
    (sum, tick) => sum + tick.liquidityGross,
    0
  );

  const barData = sortedTicks.map((tick) => {
    // Calculate proportional locked amounts
    const amount0Locked =
      parseFloat(poolData.totalValueLockedToken0.toString()) *
      (tick.liquidityGross / totalLiquidity);
    const amount1Locked =
      parseFloat(poolData.totalValueLockedToken1.toString()) *
      (tick.liquidityGross / totalLiquidity);

    return {
      tick: tick.tickIdx,
      liquidity: tick.liquidityGross,
      price0: tick.price0,
      price1: tick.price1,
      time: formatTimestamp(tick.tickIdx), // Use tick index as time
      amount0Locked,
      amount1Locked,
    };
  });

  // Find the closest tick to current pool tick for active range
  const currentTick = poolData.tick;
  const closestTick = sortedTicks.reduce((prev, curr) => {
    return Math.abs(curr.tickIdx - currentTick) <
      Math.abs(prev.tickIdx - currentTick)
      ? curr
      : prev;
  });

  const activeRangeData = {
    tick: currentTick,
    price0: poolData.token0Price,
    price1: poolData.token1Price,
    liquidity: poolData.liquidity,
    time: formatTimestamp(closestTick.tickIdx),
    amount0Locked: parseFloat(poolData.totalValueLockedToken0.toString()),
    amount1Locked: parseFloat(poolData.totalValueLockedToken1.toString()),
  };

  // Calculate active range percentage based on current liquidity vs total liquidity
  const activeRangePercentage =
    totalLiquidity > 0 ? (poolData.liquidity / totalLiquidity) * 100 : 0;

  return {
    barData,
    activeRangeData,
    activeRangePercentage,
  };
}

interface FormattedChartData {
  price: Array<{
    time: UTCTimestamp;
    value: number;
    open: number;
    close: number;
    high: number;
    low: number;
  }>;
  volume: Array<{
    time: UTCTimestamp;
    value: number;
  }>;
  liquidity: ProcessedLiquidityData;
}

export default function usePoolChart(
  poolId: string,
  interval: number
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  chartData: FormattedChartData | undefined;
} {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      id: poolId.toLowerCase(),
    },
    pollInterval: interval,
    client: apolloClient,
  });

  const chartData = useMemo(() => {
    if (!data?.pool?.poolDayData) return undefined;

    const validDayData = data.pool.poolDayData
      .filter((day: any) => day.close !== "0" && day.token0Price !== "0")
      .reverse();

    if (validDayData.length === 0) return undefined;

    const poolData: PoolData = {
      tick: parseInt(data.pool.tick),
      liquidity: parseInt(data.pool.liquidity),
      token0Price: data.pool.token0Price,
      token1Price: data.pool.token1Price,
      totalValueLockedToken0: parseInt(data.pool.totalValueLockedToken0),
      totalValueLockedToken1: parseInt(data.pool.totalValueLockedToken1),
      ticks: data.pool.ticks.map((tick: any) => ({
        tickIdx: parseInt(tick.tickIdx),
        liquidityGross: parseInt(tick.liquidityGross),
        liquidityNet: parseInt(tick.liquidityNet),
        price0: tick.price0,
        price1: tick.price1,
        createdAtTimestamp: tick.createdAtTimestamp,
      })),
    };

    const liquidityData = processLiquidityData(poolData);

    return {
      price: validDayData.map((day: any) => ({
        time: day.date as UTCTimestamp,
        value: parseFloat(day.token0Price),
        open: parseFloat(day.open),
        close: parseFloat(day.close),
        high: parseFloat(day.high),
        low: parseFloat(day.low),
      })),

      volume: validDayData.map((day: any) => ({
        time: day.date as UTCTimestamp,
        value: parseFloat(day.volumeUSD),
      })),

      liquidity: liquidityData,
    };
  }, [data]);
  return useMemo(
    () => ({
      error,
      isLoading,
      chartData,
    }),
    [chartData, error, isLoading]
  );
}
