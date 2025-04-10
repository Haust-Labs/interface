import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { apolloClient } from "./apollo";

const TRACKED_TOKENS = [
  "0x6c25c1cb4b8677982791328471be1bfb187687c1", // WHAUST
  "0x87054392461F52a513d83EF2e06af50f4e2F6614", // USDT
  "0x1AfB500AFfBBc8a7FC8aB0f5C4D06c59AC87B111", // USDC
  "0x48C3C36CE1DF7d5852FB4cda746015a9971A882E", // WETH
  "0x595BC82909f2311Cf19E865bc82e7930b103540C", // WBTC
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
