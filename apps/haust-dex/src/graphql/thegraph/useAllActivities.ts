import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { AllActivitiesQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";

const query = gql`
  query AllActivities($address: Bytes!) {
    swaps(
      orderDirection: desc
      where: { recipient: $address }
      orderBy: timestamp
    ) {
      amount0
      amount1
      amountUSD
      timestamp
      token0 {
        id
        name
        symbol
        decimals
      }
      token1 {
        id
        name
        symbol
        decimals
      }
      transaction {
      id
    }
    }
    mints(
      where: { origin: $address }
      orderBy: timestamp
      orderDirection: desc
    ) {
      origin
      timestamp
      amount0
      amount1
      amountUSD
      token0 {
        id
        name
        symbol
        decimals
      }
      token1 {
        id
        name
        symbol
        decimals
      }
      transaction {
        id
      }
    }
    burns(
      orderBy: timestamp
      orderDirection: desc
      where: { origin: $address }
    ) {
      amount0
      amount1
      amountUSD
      timestamp
      token0 {
        id
        name
        symbol
        decimals
      }
      token1 {
        id
        name
        symbol
        decimals
      }
      transaction {
        id
      }
    }
  }
`;

export default function useAllActivities(
  address: string | undefined,
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: AllActivitiesQuery } {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      address: address?.toLowerCase(),
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
