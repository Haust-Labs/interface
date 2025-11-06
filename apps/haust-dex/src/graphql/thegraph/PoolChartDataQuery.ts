import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { UTCTimestamp } from "lightweight-charts";
import { useMemo, useEffect } from "react";
import { apolloClient } from "./apollo";

// Helper function to get start of day (00:00:00) as Unix timestamp
function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

// Helper function to get minimum date (Unix timestamp in seconds) for time period
function getMinDateForTimePeriod(timePeriod: string): number {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const oneDay = 24 * 60 * 60; // 1 day in seconds

  switch (timePeriod) {
    case "DAY":
      // For DAY period, show last 24 hours
      return now - oneDay;
    case "WEEK":
      // For WEEK period, show last 7 days
      const todayStart = getStartOfDay(now);
      return todayStart - 6 * oneDay; // 7 days total (today + 6 days back)
    case "MONTH":
      // For MONTH period, show last 30 days
      const monthStart = getStartOfDay(now);
      return monthStart - 29 * oneDay; // 30 days total (today + 29 days back)
    case "YEAR":
      // For YEAR period, show last 365 days
      const yearStart = getStartOfDay(now);
      return yearStart - 364 * oneDay; // 365 days total (today + 364 days back)
    default:
      return now - oneDay;
  }
}

// Helper function to get number of records to fetch for time period
function getFirstForTimePeriod(timePeriod: string): number {
  switch (timePeriod) {
    case "DAY":
      return 24; // 24 hours
    case "WEEK":
      return 7; // 7 days
    case "MONTH":
      return 30; // 30 days
    case "YEAR":
      return 365; // 365 days
    default:
      return 7;
  }
}

// Query for hourly data (for DAY period)
const hourQuery = gql`
  query PoolChartDataHour($id: ID!, $first: Int!, $periodStartUnixGte: Int!) {
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
      poolHourData(
        where: { periodStartUnix_gte: $periodStartUnixGte }
        orderBy: periodStartUnix
        orderDirection: desc
        first: $first
      ) {
        periodStartUnix
        tvlUSD
        close
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

// Query for daily data (for WEEK, MONTH, YEAR periods)
const dayQuery = gql`
  query PoolChartDataDay($id: ID!, $dateGte: Int!, $first: Int!) {
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
      poolDayData(
        where: { date_gte: $dateGte }
        orderBy: date
        orderDirection: desc
        first: $first
      ) {
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
  interval: number,
  timePeriod: string = "DAY",
  disablePolling?: boolean
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  chartData: FormattedChartData | undefined;
} {
  const isDayPeriod = timePeriod === "DAY";
  const minDate = getMinDateForTimePeriod(timePeriod);
  const first = getFirstForTimePeriod(timePeriod);

  // For DAY period, use hourly data (24 hours)
  const hourQueryResult = useQuery(hourQuery, {
    variables: {
      id: poolId.toLowerCase(),
      first: 24, // 24 hours for 1 day
      periodStartUnixGte: minDate,
    },
    pollInterval: disablePolling || interval <= 0 ? undefined : interval, // Disable polling if disabled or interval is 0
    client: apolloClient,
    skip: !isDayPeriod || !poolId,
  });

  // For other periods, use daily data with date filter
  const dayQueryResult = useQuery(dayQuery, {
    variables: {
      id: poolId.toLowerCase(),
      dateGte: minDate,
      first: first,
    },
    pollInterval: disablePolling || interval <= 0 ? undefined : interval, // Disable polling if disabled or interval is 0
    client: apolloClient,
    skip: isDayPeriod || !poolId,
  });

  const activeQuery = isDayPeriod ? hourQueryResult : dayQueryResult;
  const { data, loading: isLoading, error, stopPolling } = activeQuery;

  // Explicitly stop polling when disablePolling is true
  useEffect(() => {
    if (disablePolling) {
      stopPolling();
    }
  }, [disablePolling, stopPolling]);

  const chartData = useMemo(() => {
    let dayData: any[] = [];

    if (isDayPeriod && data?.pool?.poolHourData) {
      // Transform hourly data to match daily data format
      const filteredHours = data.pool.poolHourData.filter(
        (hour: any) => hour.periodStartUnix >= minDate
      );
      dayData = filteredHours.map((hour: any) => ({
        date: hour.periodStartUnix,
        close: hour.close,
        high: hour.high,
        low: hour.low,
        open: hour.open,
        tick: hour.tick,
        token0Price: hour.token0Price,
        token1Price: hour.token1Price,
        volumeUSD: hour.volumeUSD,
        tvlUSD: hour.tvlUSD,
      }));
    } else if (data?.pool?.poolDayData) {
      // Filter daily data to ensure we only have data from the selected period
      const filteredDays = data.pool.poolDayData.filter(
        (day: any) => day.date >= minDate
      );
      dayData = filteredDays;
    }

    if (!dayData || dayData.length === 0) return undefined;

    const validDayData = dayData
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
  }, [data, minDate, isDayPeriod]);
  return useMemo(
    () => ({
      error,
      isLoading,
      chartData,
    }),
    [chartData, error, isLoading]
  );
}
