import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { TopTokensQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";
export enum Duration {
  hour = "hour",
  day = "day",
  week = "week",
  month = "month",
  year = "year",
}

const query = gql`
  query TopTokens($orderDirection: OrderDirection = asc) {
    tokens(orderBy: totalValueLockedUSD, orderDirection: $orderDirection) {
      id
      name
      symbol
      volumeUSD
      totalSupply
      decimals
      tokenDayData(first: 2, orderBy: date, orderDirection: desc) {
        date
        priceUSD
      }
    }
  }
`;

const tokenHourDataQuery = gql`
  query TokenHourData($tokenIds: [String!]!) {
    tokenHourDatas(
      first: 120
      orderBy: periodStartUnix
      orderDirection: desc
      where: { token_in: $tokenIds }
    ) {
      periodStartUnix
      priceUSD
      token {
        id
      }
    }
  }
`;

export type PricePoint = { timestamp: number; value: number };
export type SparklineMap = { [key: string]: PricePoint[] | undefined };

export interface MarketData {
  duration: Duration;
  pricePercentChange: string;
  hourlyPriceChange?: string;
  volume: string;
}

export interface TokenData {
  id: string;
  address: string;
  name: string;
  symbol: string;
  priceUsd: string;
  totalValueLockedUsd: string;
  totalSupply: string;
  decimals: number;
  chain: string;
  isNative?: boolean;
  marketData: MarketData;
}

export interface TopTokensData {
  tokens: TokenData[];
  sparklines: SparklineMap;
}

export default function useTopTokensQuery(interval: number): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: TopTokensData;
} {
  const {
    data: rawData,
    loading: isLoading,
    error,
  } = useQuery(query, {
    pollInterval: interval,
    client: apolloClient,
  });

  const tokenIds = rawData?.tokens.map((token: any) => token.id) || [];

  const { data: hourData, loading: hourDataLoading } = useQuery(
    tokenHourDataQuery,
    {
      variables: { tokenIds },
      client: apolloClient,
      skip: tokenIds.length === 0,
    }
  );

  return useMemo(
    () => ({
      error,
      isLoading: isLoading || hourDataLoading,
      data: {
        ...rawData,
        tokens: [
          ...(rawData?.tokens.map((token: TopTokensQuery["tokens"][number]) => {
            // Calculate day price changes
            const currentDayPrice = Number(token.tokenDayData[0]?.priceUSD);
            const previousDayPrice = Number(token.tokenDayData[1]?.priceUSD);
            const dayDelta = previousDayPrice
              ? ((currentDayPrice - previousDayPrice) / previousDayPrice) * 100
              : 0;

            // Calculate hour price changes
            const tokenHourData = hourData?.tokenHourDatas?.filter(
              (t: any) => t.token.id === token.id
            );
            const currentHourPrice = Number(tokenHourData?.[0]?.priceUSD);
            const previousHourPrice = Number(tokenHourData?.[1]?.priceUSD);
            const hourDelta = previousHourPrice
              ? ((currentHourPrice - previousHourPrice) / previousHourPrice) *
                100
              : 0;

            return {
              ...token,
              address: token.id,
              name: token.name,
              priceUsd: token.tokenDayData[0]?.priceUSD || "0",
              symbol: token.symbol,
              totalValueLockedUsd:
                token.totalSupply * token.tokenDayData[0]?.priceUSD || "0",
              decimals: token.decimals,
              chain: "HAUST_TESTNET",
              marketData: {
                duration: Duration.day,
                pricePercentChange: dayDelta.toString(),
                hourlyPriceChange: hourDelta.toString(),
                volume: token.volumeUSD,
              },
            };
          }) || []),
          // Add HAUST token if WHAUST exists
          ...(rawData?.tokens
            .filter(
              (token: TopTokensQuery["tokens"][number]) =>
                token.id.toLowerCase() ===
                "0x6c25c1cb4b8677982791328471be1bfb187687c1".toLowerCase()
            )
            .map((whaustToken: TopTokensQuery["tokens"][number]) => {
              // Calculate hour price changes for HAUST
              const currentDayPrice = Number(whaustToken.tokenDayData[0]?.priceUSD);
              const previousDayPrice = Number(whaustToken.tokenDayData[1]?.priceUSD);
              const dayDelta = previousDayPrice
                ? ((currentDayPrice - previousDayPrice) / previousDayPrice) * 100
                : 0;
              const tokenHourData = hourData?.tokenHourDatas?.filter(
                (t: any) => t.token.id === whaustToken.id
              );
              const currentHourPrice = Number(tokenHourData?.[0]?.priceUSD);
              const previousHourPrice = Number(tokenHourData?.[1]?.priceUSD);
              
              const hourDelta = previousHourPrice
                ? ((currentHourPrice - previousHourPrice) / previousHourPrice) *
                  100
                : 0;

              return {
                ...whaustToken,
                id: whaustToken.id + "_haust",
                address: whaustToken.id + "_haust",
                name: "Haust",
                symbol: "HAUST",
                isNative: true,
                priceUsd: whaustToken.tokenDayData[0]?.priceUSD || "0",
                totalValueLockedUsd: whaustToken.volumeUSD,
                decimals: whaustToken.decimals,
                chain: "HAUST_TESTNET",
                marketData: {
                  duration: Duration.day,
                  pricePercentChange: dayDelta.toString(),
                  hourlyPriceChange: hourDelta.toString(),
                  volume: whaustToken.volumeUSD,
                },
              };
            }) || []),
        ],
        sparklines: rawData?.tokens.reduce(
          (
            acc: Record<string, PricePoint[]>,
            token: {
              id: string;
              tokenDayData: Array<{ date: number; priceUSD: string }>;
            }
          ) => {
            const tokenHourData = hourData?.tokenHourDatas?.filter(
              (t: any) => t.token.id === token.id
            );
            const sparklineData = tokenHourData
              ? tokenHourData
                  .slice()
                  .reverse()
                  .map((hourData: any) => ({
                    value: Number(hourData.priceUSD),
                    timestamp: hourData.periodStartUnix * 1000,
                  }))
              : token.tokenDayData
                  .slice()
                  .reverse()
                  .map((dayData) => ({
                    value: Number(dayData.priceUSD),
                    timestamp: dayData.date * 1000,
                  }));

            acc[token.id] = sparklineData;
            if (
              token.id.toLowerCase() ===
              "0x6c25c1cb4b8677982791328471be1bfb187687c1".toLowerCase()
            ) {
              acc[token.id + "_haust"] = sparklineData;
            }
            return acc;
          },
          {}
        ),
      },
    }),
    [rawData, hourData, error, isLoading, hourDataLoading]
  );
}
