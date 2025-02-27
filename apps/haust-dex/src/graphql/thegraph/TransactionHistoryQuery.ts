import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { TransactionHistoryQueryQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";

const query = gql`
query TransactionHistoryQuery {
  transactions(first: 100, orderBy: timestamp, orderDirection: desc) {
    burns(first: 10) {
      amount0
      amount1
      amountUSD
      origin
      token1 {
        id
      }
      token0 {
        id
      }
    }
    id
    timestamp
    swaps {
      amount0
      amount1
      amountUSD
      token0 {
        name
        id
        symbol
      }
      token1 {
        name
        id
        symbol
      }
      timestamp
      id
      recipient
    }
    mints {
      amount0
      amount1
      amountUSD
      origin
      token0 {
        id
        name
      }
      token1 {
        id
        name
      }
    }
  }
}
`;

export default function useTransactionHistory(
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: TransactionHistoryQueryQuery } {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
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
