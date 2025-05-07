import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { CurrentTokensPriceQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
query CurrentTokensPrice {
  bundle(id: "1") {
    ethPriceUSD
  }
  tokens(first: 100) {
    derivedETH
    name
    id
  }
}`

export default function useCurrentTokensPrice(
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: CurrentTokensPriceQuery } {
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
