import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";

import { PoolPriceChartDataQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";

const query = gql`
  query PoolPriceChartData($id: ID!) {
    pool(id: $id) {
      poolDayData(orderBy: date, orderDirection: asc) {
        date
        close
        high
        low
        open
        token0Price
        token1Price
      }
    }
  }
`;

export default function usePoolPriceChartDataQuery(
  tokenId: string,
  interval: number
): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: PoolPriceChartDataQuery;
} {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      id: tokenId.toLowerCase(),
    },
    pollInterval: interval,
    client: apolloClient,
  });

  return useMemo(
    () => ({
      error,
      isLoading,
      data: {
        ...data,
        pool: {
          ...data?.pool,
          poolDayData:
            data?.pool?.poolDayData?.map((day: any) => ({
              ...day,
              time: day.date as number as UTCTimestamp,
              value: parseFloat(day.close),
            })) || [],
        },
      },
    }),
    [data, error, isLoading]
  );
}
