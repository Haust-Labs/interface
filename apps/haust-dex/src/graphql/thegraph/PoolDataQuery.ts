import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { apolloClient } from "./apollo";

const query = gql`
  query PoolData($poolAddress: ID!) {
    pool(id: $poolAddress) {
      feeTier
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      token0Price
      token1Price
      totalValueLockedToken0
      totalValueLockedToken1
      poolDayData(first: 2, orderBy: date, orderDirection: desc) {
        volumeUSD
        tvlUSD
        feesUSD
      }
    }
  }
`;

export interface ProcessedPoolData {
  token0: {
    id: string;
    name: string;
    symbol: string;
  };
  token1: {
    id: string;
    name: string;
    symbol: string;
  };
  feeTier: number;
  token0Price: number;
  token1Price: number;
  tvlToken0: number;
  tvlToken1: number;
  tvlUSD: number;
  tvlUSDChange: number;
  volumeUSD24H: number;
  volumeUSD24HChange: number;
}

export default function usePoolData(
  poolAddress: string,
  interval: number
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: ProcessedPoolData | undefined;
} {
  const {
    data: queryData,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: { poolAddress: poolAddress.toLowerCase() },
    pollInterval: interval,
    client: apolloClient,
  });

  return useMemo(() => {
    if (!queryData?.pool) {
      return {
        error,
        isLoading,
        data: undefined,
      };
    }

    const pool = queryData.pool;
    const poolDayData = pool.poolDayData;
    
    const currentTvlUSD = poolDayData[0]?.tvlUSD ?? 0;
    const previousTvlUSD = poolDayData[1]?.tvlUSD ?? currentTvlUSD;
    const currentVolumeUSD = poolDayData[0]?.volumeUSD ?? 0;
    const previousVolumeUSD = poolDayData[1]?.volumeUSD ?? currentVolumeUSD;

    const processedData: ProcessedPoolData = {
      token0: pool.token0,
      token1: pool.token1,
      feeTier: Number(pool.feeTier),
      token0Price: Number(pool.token0Price),
      token1Price: Number(pool.token1Price),
      tvlToken0: Number(pool.totalValueLockedToken0),
      tvlToken1: Number(pool.totalValueLockedToken1),
      tvlUSD: currentTvlUSD,
      tvlUSDChange: previousTvlUSD ? ((currentTvlUSD - previousTvlUSD) / previousTvlUSD) * 100 : 0,
      volumeUSD24H: currentVolumeUSD,
      volumeUSD24HChange: previousVolumeUSD ? ((currentVolumeUSD - previousVolumeUSD) / previousVolumeUSD) * 100 : 0,
    };

    return {
      error,
      isLoading,
      data: processedData,
    };
  }, [queryData, error, isLoading]);
}
