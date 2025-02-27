import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { BalancesMidnightQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
query BalancesMidnight {
  tokens {
    tokenDayData(first: 1, orderBy: date, orderDirection: desc) {
      priceUSD
    }
    name
    id
    symbol
  }
}`

export default function useBalancesMidnight(
  interval: number  
): { error: ApolloError | undefined; isLoading: boolean; data: BalancesMidnightQuery } {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
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
