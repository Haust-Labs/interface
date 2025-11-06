import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { UniswapVolumeQueryQuery } from "./__generated__/types-and-hooks";
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
      // For DAY period, show last 30 days
      const todayStart = getStartOfDay(now);
      return todayStart - 29 * oneDay; // 30 days total (today + 29 days back)
    case "W":
      // For WEEK period, show last 90 days
      const weekStart = getStartOfDay(now);
      return weekStart - 89 * oneDay; // 90 days total
    case "M":
      // For MONTH period, show last 365 days
      const monthStart = getStartOfDay(now);
      return monthStart - 364 * oneDay; // 365 days total
    default:
      const defaultStart = getStartOfDay(now);
      return defaultStart - 29 * oneDay;
  }
}

// Helper function to get number of records to fetch for time period
function getFirstForTimePeriod(timePeriod: string): number {
  switch (timePeriod) {
    case "D":
      return 30; // 30 days
    case "W":
      return 90; // 90 days
    case "M":
      return 365; // 365 days
    default:
      return 30;
  }
}

const query = gql`
  query UniswapVolumeQuery($dateGte: Int!, $first: Int!) {
    uniswapDayDatas(
      where: { date_gte: $dateGte }
      orderBy: date
      orderDirection: desc
      first: $first
    ) {
      date
      volumeUSD
    }
  }
`;

export default function useUniswapVolume(
  interval: number,
  timePeriod: string = "D"
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: UniswapVolumeQueryQuery;
} {
  const minDate = getMinDateForTimePeriod(timePeriod);
  const first = getFirstForTimePeriod(timePeriod);

  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      dateGte: minDate,
      first: first,
    },
    pollInterval: interval,
    client: apolloClient,
  });

  return useMemo(
    () => ({
      error,
      isLoading,
      data,
    }),
    [data, error, isLoading]
  );
}
