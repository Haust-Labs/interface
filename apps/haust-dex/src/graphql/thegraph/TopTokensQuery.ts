import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { getCorrectName } from "hooks/useCorrectNaming";
import { useMemo } from "react";
import { TimePeriod } from "graphql/data/util";

import { TopTokensQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";

export enum Duration {
  hour = "hour",
  day = "day",
  week = "week",
  month = "month",
  year = "year",
}

// Helper function to get number of days for time period
function getDaysForTimePeriod(timePeriod: TimePeriod): number {
  switch (timePeriod) {
    case TimePeriod.DAY:
      return 1;
    case TimePeriod.WEEK:
      return 7;
    case TimePeriod.MONTH:
      return 30;
    case TimePeriod.YEAR:
      return 365;
    default:
      return 1;
  }
}

const query = gql`
  query TopTokens($orderDirection: OrderDirection = asc, $days: Int!) {
    tokens(orderBy: totalValueLockedUSD, orderDirection: $orderDirection) {
      id
      name
      symbol
      volumeUSD
      totalSupply
      decimals
      tokenDayData(first: $days, orderBy: date, orderDirection: desc) {
        date
        priceUSD
        volumeUSD
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

export default function useTopTokensQuery(
  interval: number,
  timePeriod: TimePeriod = TimePeriod.DAY
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: TopTokensData;
} {
  const allowedTokenIds = useMemo(
    () => [
      "0x6c25c1cb4b8677982791328471be1bfb187687c1".toLowerCase(),
      "0x1e4a5963abfd975d8c9021ce480b42188849d41d".toLowerCase(),
      "0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035".toLowerCase(),
      "0x5a77f1443d16ee5761d310e38b62f77f726bc71c".toLowerCase(),
      "0xea034fb02eb1808c2cc3adbc15f447b93cbe08e1".toLowerCase(),
      "0x6c25c1cb4b8677982791328471be1bfb187687c1_haust".toLowerCase(),
    ],
    []
  );

  const days = getDaysForTimePeriod(timePeriod);

  const {
    data: rawData,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: { days },
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

              // Calculate volume for the selected time period
              // Sum up volumeUSD from tokenDayData for the selected period
              const periodVolume = (
                token.tokenDayData as Array<{
                  date: number;
                  priceUSD: any;
                  volumeUSD?: any;
                }>
              ).reduce(
                (sum, dayData) => sum + Number(dayData.volumeUSD || 0),
                0
              );

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
                  volume: periodVolume.toString(),
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

              // Calculate volume for the selected time period
              const periodVolume = (
                whaustToken.tokenDayData as Array<{
                  date: number;
                  priceUSD: any;
                  volumeUSD?: any;
                }>
              ).reduce(
                (sum, dayData) => sum + Number(dayData.volumeUSD || 0),
                0
              );

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
                  volume: periodVolume.toString(),
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
    [
      rawData,
      hourData,
      error,
      isLoading,
      hourDataLoading,
      allowedTokenIds,
      timePeriod,
    ]
  );
}
