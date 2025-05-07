import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { UniswapVolumeQueryQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";

const query = gql`
  query UniswapVolumeQuery {
    uniswapDayDatas(orderBy: date, orderDirection: asc) {
      date
      volumeUSD
    }
  }
`;

export default function useUniswapVolume(interval: number): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: UniswapVolumeQueryQuery;
} {
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
