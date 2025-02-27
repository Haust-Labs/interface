import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { PollsDataQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
query PollsData {
  pools {
    id
    feeTier
    totalValueLockedUSD
    poolDayData(first: 30, orderBy: date, orderDirection: desc) {
      date
      volumeUSD
      feesUSD
    }
    token0 {
      id
      name
      symbol
    }
    token1 {
      id
      name
      symbol
    }
  }
}`

export default function usePollsData(
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: PollsDataQuery } {
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
