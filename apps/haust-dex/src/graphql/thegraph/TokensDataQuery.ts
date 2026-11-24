import { ApolloError, useQuery } from "@apollo/client";
import { TRACKED_TOKEN_ADDRESSES } from "constants/network";
import gql from "graphql-tag";
import { useMemo } from "react";

import { apolloClient } from "./apollo";

const query = gql`
  query TokensData {
    bundle(id: "1") {
      ethPriceUSD
    }
    tokens(where: { id_in: ${JSON.stringify(TRACKED_TOKEN_ADDRESSES)} }) {
      id
      name
      symbol
      decimals
      derivedETH
      tokenDayData(first: 1, orderBy: date, orderDirection: desc) {
        priceUSD
        date
      }
    }
  }
`;

export interface TokenDayData {
  priceUSD: string;
  date: number;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: string;
  derivedETH: string;
  tokenDayData: TokenDayData[];
}

export interface TokensDataResponse {
  bundle: {
    ethPriceUSD: string;
  };
  tokens: Token[];
}

export default function useTokensData(interval: number): {
  error: ApolloError | undefined;
  isLoading: boolean;
  data: TokensDataResponse | undefined;
} {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery<TokensDataResponse>(query, {
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
