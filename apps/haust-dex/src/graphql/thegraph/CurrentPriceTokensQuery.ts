import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { CurrentTokenPriceQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
query CurrentTokenPrice($token: ID!) {
  bundle(id: "1") {
    ethPriceUSD
  }
  token(id: $token) {
    derivedETH
    id
    name
  }
}`

export default function useCurrentTokenPrice(
  token: string | undefined,
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: CurrentTokenPriceQuery } {
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
