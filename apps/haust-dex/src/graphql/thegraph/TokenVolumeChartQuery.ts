import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { TokenVolumeChartQuery } from './__generated__/types-and-hooks'
import { apolloClient } from './apollo'

const query = gql`
query TokenVolumeChart($token: String!) {
  tokenDayDatas(where: {token: $token}
   orderBy: date
    orderDirection: asc
    ) {
    date
    volumeUSD
  }
}`;

export default function useTokenVolumeChart(
  token: string | undefined,
  interval: number
): { error: ApolloError | undefined; isLoading: boolean; data: TokenVolumeChartQuery } {
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
