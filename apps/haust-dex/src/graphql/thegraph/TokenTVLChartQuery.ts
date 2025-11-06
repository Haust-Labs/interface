import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { TokenTvlChartQuery } from "./__generated__/types-and-hooks";
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
    case "D":
      return now - oneDay; // Last 24 hours (for hourly data)
    case "W":
      // For daily data, we need start of day 7 days ago
      // Get today's start, then subtract 7 days
      const todayStart = getStartOfDay(now);
      return todayStart - 6 * oneDay; // 7 days total (today + 6 days back)
    case "M":
      // Get today's start, then subtract 30 days
      const todayStartMonth = getStartOfDay(now);
      return todayStartMonth - 29 * oneDay; // 30 days total (today + 29 days back)
    case "Y":
      // Get today's start, then subtract 365 days
      const todayStartYear = getStartOfDay(now);
      return todayStartYear - 364 * oneDay; // 365 days total (today + 364 days back)
    default:
      return now - oneDay;
  }
}

// Helper function to get number of records to fetch for time period
function getFirstForTimePeriod(timePeriod: string): number {
  switch (timePeriod) {
    case "D":
      return 24; // 24 hours
    case "W":
      return 7; // 7 days
    case "M":
      return 30; // 30 days
    case "Y":
      return 365; // 365 days
    default:
      return 7;
  }
}

// Query for hourly data (for DAY period)
const hourQuery = gql`
  query TokenTVLChartHour(
    $token: String!
    $first: Int!
    $periodStartUnixGte: Int!
  ) {
    tokenHourDatas(
      where: { token: $token, periodStartUnix_gte: $periodStartUnixGte }
      orderBy: periodStartUnix
      orderDirection: desc
      first: $first
    ) {
      periodStartUnix
      totalValueLockedUSD
    }
  }
`;

// Query for daily data (for WEEK, MONTH, YEAR periods)
const dayQuery = gql`
  query TokenTVLChartDay($token: String!, $dateGte: Int!, $first: Int!) {
    tokenDayDatas(
      where: { token: $token, date_gte: $dateGte }
      orderBy: date
      orderDirection: desc
      first: $first
    ) {
      date
      totalValueLockedUSD
    }
  }
`;

export default function useTokenTVLChart(
  token: string | undefined,
  interval: number,
  timePeriod: string = "D"
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: TokenTvlChartQuery;
} {
  const isDayPeriod = timePeriod === "D";
  const minDate = getMinDateForTimePeriod(timePeriod);
  const first = getFirstForTimePeriod(timePeriod);

  // For DAY period, use hourly data (24 hours)
  const hourQueryResult = useQuery(hourQuery, {
    variables: {
      token: token?.toLowerCase(),
      first: 24, // 24 hours for 1 day
      periodStartUnixGte: minDate,
    },
    pollInterval: interval,
    client: apolloClient,
    skip: !isDayPeriod || !token,
  });

  // For other periods, use daily data with date filter
  const dayQueryResult = useQuery(dayQuery, {
    variables: {
      token: token?.toLowerCase(),
      dateGte: minDate,
      first: first,
    },
    pollInterval: interval,
    client: apolloClient,
    skip: isDayPeriod || !token,
  });

  const activeQuery = isDayPeriod ? hourQueryResult : dayQueryResult;

  // Transform hourly data to match daily data format
  const transformedData = useMemo(() => {
    if (isDayPeriod && hourQueryResult.data?.tokenHourDatas) {
      // Filter to ensure we only have data from the last 24 hours
      const filteredHours = hourQueryResult.data.tokenHourDatas.filter(
        (hour: any) => hour.periodStartUnix >= minDate
      );
      return {
        tokenDayDatas: filteredHours.map((hour: any) => ({
          date: hour.periodStartUnix,
          totalValueLockedUSD: hour.totalValueLockedUSD,
        })),
      };
    }
    if (dayQueryResult.data?.tokenDayDatas) {
      // Filter to ensure we only have data from the selected period
      // This prevents showing old data (e.g., from September when it's November)
      const filteredDays = dayQueryResult.data.tokenDayDatas.filter(
        (day: any) => day.date >= minDate
      );
      return {
        tokenDayDatas: filteredDays,
      };
    }
    return dayQueryResult.data;
  }, [isDayPeriod, hourQueryResult.data, dayQueryResult.data, minDate]);

  return useMemo(
    () => ({
      error: activeQuery.error,
      isLoading: activeQuery.loading,
      data: transformedData as TokenTvlChartQuery,
    }),
    [activeQuery.error, activeQuery.loading, transformedData, timePeriod]
  );
}
