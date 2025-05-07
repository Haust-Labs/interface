import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { TokenTvlChartQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
query TokenTVLChart($token: String!) {
  tokenDayDatas(where: {token: $token}
   orderBy: date
    orderDirection: asc
    ) {
    date
    totalValueLockedUSD
  }
}`;

export default function useTokenTVLChart(
  token: string | undefined,
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: TokenTvlChartQuery } {
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
