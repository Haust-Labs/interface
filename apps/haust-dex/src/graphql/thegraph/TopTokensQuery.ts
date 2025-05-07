import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { getCorrectName } from "hooks/useCorrectNaming";
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
  query TokenHourData($tokenId: String!) {
    tokenHourDatas(
      first: 120
      orderBy: periodStartUnix
      orderDirection: desc
      where: { token: $tokenId }
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
  const allowedTokenIds = useMemo(
    () => [
      "0x6c25c1cb4b8677982791328471be1bfb187687c1".toLowerCase(),
      "0x87054392461F52a513d83EF2e06af50f4e2F6614".toLowerCase(),
      "0x1AfB500AFfBBc8a7FC8aB0f5C4D06c59AC87B111".toLowerCase(),
      "0x48C3C36CE1DF7d5852FB4cda746015a9971A882E".toLowerCase(),
      "0x595BC82909f2311Cf19E865bc82e7930b103540C".toLowerCase(),
      "0x6c25c1cb4b8677982791328471be1bfb187687c1_haust".toLowerCase(),
    ],
    []
  );

  const {
    data: rawData,
    loading: isLoading,
    error,
  } = useQuery(query, {
    pollInterval: interval,
    client: apolloClient,
  });

  // Create separate queries for hour data
  const token1Query = useQuery(tokenHourDataQuery, {
    variables: { tokenId: allowedTokenIds[0] },
    client: apolloClient,
    skip: !rawData?.tokens,
  });

  const token2Query = useQuery(tokenHourDataQuery, {
    variables: { tokenId: allowedTokenIds[1] },
    client: apolloClient,
    skip: !rawData?.tokens,
  });

  const token3Query = useQuery(tokenHourDataQuery, {
    variables: { tokenId: allowedTokenIds[2] },
    client: apolloClient,
    skip: !rawData?.tokens,
  });

  const token4Query = useQuery(tokenHourDataQuery, {
    variables: { tokenId: allowedTokenIds[3] },
    client: apolloClient,
    skip: !rawData?.tokens,
  });

  const token5Query = useQuery(tokenHourDataQuery, {
    variables: { tokenId: allowedTokenIds[4] },
    client: apolloClient,
    skip: !rawData?.tokens,
  });

  const hourDataLoading =
    token1Query.loading ||
    token2Query.loading ||
    token3Query.loading ||
    token4Query.loading ||
    token5Query.loading;

  const hourData = useMemo(() => {
    const allHourData = {
      tokenHourDatas: [
        ...(token1Query.data?.tokenHourDatas || []),
        ...(token2Query.data?.tokenHourDatas || []),
        ...(token3Query.data?.tokenHourDatas || []),
        ...(token4Query.data?.tokenHourDatas || []),
        ...(token5Query.data?.tokenHourDatas || []),
      ],
    };
    return allHourData;
  }, [
    token1Query.data,
    token2Query.data,
    token3Query.data,
    token4Query.data,
    token5Query.data,
  ]);

  return useMemo(
    () => ({
      error,
      isLoading: isLoading || hourDataLoading,
      data: {
        ...rawData,
        tokens: [
          ...(rawData?.tokens
            .filter((token: TopTokensQuery["tokens"][number]) =>
              allowedTokenIds.includes(token.id)
            )
            .map((token: TopTokensQuery["tokens"][number]) => {
              const correctName = getCorrectName(token.name);

              // Calculate day price changes
              const currentDayPrice = Number(token.tokenDayData[0]?.priceUSD);
              const previousDayPrice = Number(token.tokenDayData[1]?.priceUSD);
              const dayDelta = previousDayPrice
                ? ((currentDayPrice - previousDayPrice) / previousDayPrice) *
                  100
                : 0;

              // Calculate hour price changes
              const tokenHourData = hourData?.tokenHourDatas?.filter(
                (t: any) => t.token.id.toLowerCase() === token.id.toLowerCase()
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
                name: correctName,
                priceUsd: token.tokenDayData[0]?.priceUSD || "0",
                symbol: token.symbol.toUpperCase(),
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
              const currentDayPrice = Number(
                whaustToken.tokenDayData[0]?.priceUSD
              );
              const previousDayPrice = Number(
                whaustToken.tokenDayData[1]?.priceUSD
              );
              const dayDelta = previousDayPrice
                ? ((currentDayPrice - previousDayPrice) / previousDayPrice) *
                  100
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
              (t: any) => t.token.id.toLowerCase() === token.id.toLowerCase()
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
    [rawData, hourData, error, isLoading, hourDataLoading, allowedTokenIds]
  );
}
