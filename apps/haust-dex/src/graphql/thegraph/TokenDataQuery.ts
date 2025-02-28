import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { UniswapTvlQueryQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";
import { SupportedChainId } from "constants/chains";
import { Nullish } from "types/common";

interface MarketData {
  volume24H: string;
  priceHigh52W: string;
  priceLow52W: string;
  pricePercentChange: string;
}

export interface TokenApi {
  address: string;
  name: string;
  priceUsd: string;
  symbol: string;
  totalValueLockedUsd: Nullish<string>;
  decimals: number;
  chain: SupportedChainId;
  marketData: MarketData;
}

const query = gql`
  query TokenDataQuery($tokenId: ID!) {
    token(id: $tokenId) {
      id
      name
      symbol
      totalSupply
      tokenDayData(orderBy: date, orderDirection: asc) {
        priceUSD
        close
        open
        date
        volumeUSD
      }
      totalValueLockedUSD
      decimals
    }
  }
`;

export default function useTokenData(
  tokenId: string,
  interval: number
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: TokenApi | null;
} {
  const {
    data: queryData,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: { tokenId: tokenId.toLowerCase() },
    pollInterval: interval,
    client: apolloClient,
  });

  return useMemo(() => {
    if (!queryData?.token) {
      return {
        error,
        isLoading,
        data: null,
      };
    }

    const tokenData = queryData.token;
    const dayData = tokenData.tokenDayData || [];
    const latestDayData =
      dayData.length > 0 ? dayData[dayData.length - 1] : null;

    // Calculate 52-week high and low
    const priceLow52W = (latestDayData?.priceUSD * tokenData.totalSupply).toString() || "0";

    const priceHigh52W = latestDayData?.volumeUSD;

    // Calculate price percent change (from previous day if available)
    let pricePercentChange = "0";
    if (dayData.length >= 2) {
      const currentPrice = parseFloat(latestDayData?.priceUSD || "0");
      const previousPrice = parseFloat(
        dayData[dayData.length - 2].priceUSD || "0"
      );

      if (previousPrice > 0) {
        const change = ((currentPrice - previousPrice) / previousPrice) * 100;
        pricePercentChange = change.toString();
      }
    }

    // Get the latest day's volume
    const volume24H = (latestDayData?.priceUSD * tokenData.totalSupply).toString() || "0";

    const formattedData: TokenApi = {
      address: tokenData.id,
      name: tokenData.name,
      symbol: tokenData.symbol,
      priceUsd: latestDayData?.priceUSD || "0",
      totalValueLockedUsd: tokenData.totalValueLockedUSD,
      decimals: parseInt(tokenData.decimals),
      chain: SupportedChainId.HAUST_TESTNET,
      marketData: {
        volume24H,
        priceHigh52W,
        priceLow52W,
        pricePercentChange,
      },
    };

    return {
      error,
      isLoading,
      data: formattedData,
    };
  }, [queryData, error, isLoading]);
}
