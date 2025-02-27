import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { TokenDayPricesQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
  query TokenDayPrices($token: ID!) {
    tokenDayDatas(first: 2, orderBy: date, orderDirection: desc, where: {token_: {id: $token}}) {
      id
      priceUSD

      date
    }
  }
`;
export default function useTokenDayPrices(
  token: string | undefined,
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: TokenDayPricesQuery } {
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
