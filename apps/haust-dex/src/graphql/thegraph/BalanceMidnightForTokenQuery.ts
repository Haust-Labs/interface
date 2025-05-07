import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { BalanceMidnightForTokenQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
query BalanceMidnightForToken($tokenId: ID!) {
    token(id: $tokenId) {
      tokenDayData(first: 1, orderBy: date, orderDirection: desc) {
        priceUSD
        date
      }
    }
}`

export default function useBalanceMidnightForToken(
  tokenId: string,
  interval: number  
): { error: ApolloError | undefined; isLoading: boolean; data: BalanceMidnightForTokenQuery } {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      tokenId: tokenId.toLowerCase(),
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
