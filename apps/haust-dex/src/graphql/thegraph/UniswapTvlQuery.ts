import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { UniswapTvlQueryQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";

const query = gql`
  query UniswapTvlQuery {
    uniswapDayDatas(orderBy: date, orderDirection: asc) {
    tvlUSD
    date
  }
  }
`;

export default function useUniswapTvl(interval: number): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: UniswapTvlQueryQuery;
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
