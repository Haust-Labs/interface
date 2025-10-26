import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { apolloClient } from "./apollo";

const TRACKED_TOKENS = [
  "0x6c25c1cb4b8677982791328471be1bfb187687c1", // WHAUST
  "0x1e4a5963abfd975d8c9021ce480b42188849d41d", // USDT
  "0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035", // USDC
  "0x5a77f1443d16ee5761d310e38b62f77f726bc71c", // WETH
  "0xea034fb02eb1808c2cc3adbc15f447b93cbe08e1", // WBTC
].map((address) => address.toLowerCase());

const query = gql`
  query TokensData {
    bundle(id: "1") {
      ethPriceUSD
    }
    tokens(where: { id_in: ${JSON.stringify(TRACKED_TOKENS)} }) {
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
