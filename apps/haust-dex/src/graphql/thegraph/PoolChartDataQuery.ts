import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'

import { apolloClient } from './apollo'

const query = gql`
query PoolChartData($id: ID!) {
  pool(id: $id) {
    totalValueLockedToken0
    totalValueLockedToken1
    poolDayData(orderBy: date, orderDirection: desc) {
      tvlUSD
      close
      date
      high
      low
      open
      tick
      token0Price
      token1Price
      volumeUSD
      pool {
        totalValueLockedToken0
        totalValueLockedToken1
      }
    }
  }
}`;

interface FormattedChartData {
  price: Array<{
    time: UTCTimestamp
    value: number
    open: number
    close: number
    high: number
    low: number
  }>
  volume: Array<{
    time: UTCTimestamp
    value: number
  }>
  liquidity: {
    barData: Array<{
      tick: number
      liquidity: number
      price0: string
      price1: string
      time: UTCTimestamp
      amount0Locked: number
      amount1Locked: number
    }>
    activeRangeData: {
      tick: number
      price0: string
      price1: string
      liquidity: number
      time: UTCTimestamp
      amount0Locked: number
      amount1Locked: number
    }
    activeRangePercentage: number
  }
}

export default function usePoolChart(
  poolId: string,
  interval: number
): { 
  error: ApolloError | undefined
  isLoading: boolean
  chartData: FormattedChartData | undefined 
} {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      id: poolId.toLowerCase(),
    },
    pollInterval: interval,
    client: apolloClient,
  })

  const chartData = useMemo(() => {
    if (!data?.pool?.poolDayData) return undefined

    const validDayData = data.pool.poolDayData
      .filter((day: any) => day.close !== "0" && day.token0Price !== "0")
      .reverse()

    if (validDayData.length === 0) return undefined

    return {
      price: validDayData.map((day: any) => ({
        time: day.date as UTCTimestamp,
        value: parseFloat(day.token0Price),
        open: parseFloat(day.open),
        close: parseFloat(day.close),
        high: parseFloat(day.high),
        low: parseFloat(day.low),
      })),

      volume: validDayData.map((day: any) => ({
        time: day.date as UTCTimestamp,
        value: parseFloat(day.volumeUSD),
      })),

      liquidity: {
        barData: validDayData.map((day: any) => ({
          tick: parseInt(day.tick),
          liquidity: parseFloat(day.tvlUSD),
          price0: day.token0Price,
          price1: day.token1Price,
          time: day.date as UTCTimestamp,
          amount0Locked: parseFloat(day.pool.totalValueLockedToken0),
          amount1Locked: parseFloat(day.pool.totalValueLockedToken1),
        })),
        activeRangeData: {
          tick: parseInt(validDayData[0].tick),
          price0: validDayData[0].token0Price,
          price1: validDayData[0].token1Price,
          liquidity: parseFloat(validDayData[0].tvlUSD),
          time: validDayData[0].date as UTCTimestamp,
          amount0Locked: parseFloat(validDayData[0].pool.totalValueLockedToken0),
          amount1Locked: parseFloat(validDayData[0].pool.totalValueLockedToken1),
        },
        activeRangePercentage: 50, // This might need to be calculated based on your requirements
      }
    }
  }, [data])

  return useMemo(
    () => ({
      error,
      isLoading,
      chartData,
    }),
    [chartData, error, isLoading]
  )
}
