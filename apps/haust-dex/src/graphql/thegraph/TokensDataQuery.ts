import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import { apolloClient } from "./apollo";

const TRACKED_TOKENS = [
  "0x2c990daddaf3b760443b512da9f001f721951438", // WHAUST
  "0xb9882bc4f209d6bb26e971874779aa7447f82aa7", // USDT
  "0xad73118d8a179c17a2653e7342977e82e54cc4a7", // USDC
  "0xe6a3136f060cc22a866abee3e3725311a600f3ee", // WETH
  "0x75b69949d11013856e60b7386c28163daed1de81", // WBTC
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
