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
    case "M":
      // For MONTH period, show last 30 days
      const monthStart = getStartOfDay(now);
      return monthStart - 29 * oneDay; // 30 days total (today + 29 days back)
    case "Y":
      // For YEAR period, show last 365 days
      const yearStart = getStartOfDay(now);
      return yearStart - 364 * oneDay; // 365 days total
    case "ALL":
      // For ALL period, get all available data
      return 0; // Start from beginning
    default:
      const defaultStart = getStartOfDay(now);
      return defaultStart - 29 * oneDay;
  }
}

// Helper function to get number of records to fetch for time period
function getFirstForTimePeriod(timePeriod: string): number {
  switch (timePeriod) {
    case "M":
      return 30; // 30 days
    case "Y":
      return 365; // 365 days
    case "ALL":
      return 1000; // Large number to get all available data
    default:
      return 30;
  }
}

const query = gql`
  query UniswapVolumeQuery($dateGte: Int, $first: Int!) {
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

const queryAll = gql`
  query UniswapVolumeQueryAll($first: Int!) {
    uniswapDayDatas(orderBy: date, orderDirection: desc, first: $first) {
      date
      volumeUSD
    }
  }
`;

export default function useUniswapVolume(
  interval: number,
  timePeriod: string = "M"
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: UniswapVolumeQueryQuery | any; // Use any for queryAll as it has same structure
} {
  const isAllPeriod = timePeriod === "ALL";
  const minDate = isAllPeriod ? undefined : getMinDateForTimePeriod(timePeriod);
  const first = getFirstForTimePeriod(timePeriod);

  const queryToUse = isAllPeriod ? queryAll : query;
  const variables = isAllPeriod
    ? { first: first }
    : { dateGte: minDate, first: first };

  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(queryToUse, {
    variables: variables,
    pollInterval: interval,
    client: apolloClient,
  });

  return useMemo(
    () => ({
      error,
      isLoading,
      data: data as UniswapVolumeQueryQuery, // Cast to same type as both queries return same structure
    }),
    [data, error, isLoading]
  );
}
