import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { TokenHourPricesQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
  query TokenHourPrices($token: ID!) {
    tokenHourDatas(first: 2, orderBy: periodStartUnix, orderDirection: desc, where: {token_: {id: $token}}) {
    id
    priceUSD
    periodStartUnix
  }
  }
`;
export default function useTokenHourPrices(
  token: string | undefined,
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: TokenHourPricesQuery } {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      token: token?.toLowerCase(),
    },
    pollInterval: interval,
    client: apolloClient,
  })

  return useMemo(
    () => ({
      error,
      isLoading,
      data,
    }),
    [data, error, isLoading]
  )
}
