// eslint-disable-next-line no-restricted-imports

import { Currency, CurrencyAmount } from "@uniswap/sdk-core"
import { FeeAmount } from "@uniswap/v3-sdk"
import { ChartHeader } from "components/ChartsV2/ChartHeader"
import { Chart, refitChartContentAtom } from "components/ChartsV2/ChartModel"
import { LiquidityBarChartModel, useLiquidityBarData } from "components/ChartsV2/LiquidityChart"
import { LiquidityBarData } from "components/ChartsV2/LiquidityChart/renderer"
import { ChartSkeleton } from "components/ChartsV2/LoadingState"
import { PriceChartData, PriceChartDelta, PriceChartModel } from "components/ChartsV2/PriceChart"
import { ChartType, PriceChartType } from "components/ChartsV2/utils"
import { VolumeChart } from "components/ChartsV2/VolumeChart"
import { SingleHistogramData } from "components/ChartsV2/VolumeChart/renderer"
import { ChartActionsContainer, DEFAULT_PILL_TIME_SELECTOR_OPTIONS, getTimePeriodFromDisplay, TimePeriodDisplay } from "components/Tokens/TokenDetails/ChartSection"
import { ChartTypeDropdown } from "components/Tokens/TokenDetails/ChartSection/ChartTypeSelector"
import { ChartQueryResult, DataQuality } from "components/Tokens/TokenDetails/ChartSection/util"
import { LoadingChart } from "components/Tokens/TokenDetails/Skeleton"
import { DISPLAYS } from "components/Tokens/TokenTable/TimeSelector"
import { formatCurrencyAmount, formatNumber, formatPrice, NumberType } from "conedison/format"
import { TimePeriod as GraphQLTimePeriod, toHistoryDuration } from "graphql/data/util"
import { useCurrency } from "hooks/Tokens"
import { useUSDPrice } from "hooks/useUSDPrice"
import { useAtomValue } from "jotai/utils"
import { useMemo, useState, useEffect, useRef } from "react"
import styled, { useTheme } from "styled-components/macro"
import { BREAKPOINTS, EllipsisStyle, ThemedText } from "theme"
import { SegmentedControl, SegmentedControlOption } from "theme/components/SegmentedControl"
import { textFadeIn } from "theme/styles"
import { UTCTimestamp } from 'lightweight-charts'
import { TimePeriod as ChartTimePeriod } from 'components/ChartsV2/VolumeChart'
import React from 'react'
import usePoolChart from "graphql/thegraph/PoolChartDataQuery"


const PDP_CHART_HEIGHT_PX = 356
const PDP_CHART_SELECTOR_OPTIONS = [ChartType.VOLUME, ChartType.PRICE, ChartType.LIQUIDITY] as const
export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]

const TimePeriodSelectorContainer = styled.div`
  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    width: 100%;
  }
`
const ChartTypeSelectorContainer = styled.div`
  display: flex;
  gap: 8px;

  @media only screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    width: 100%;
  }
`

const PDPChartTypeSelector = ({
  chartType,
  onChartTypeChange,
  disabledOption,
}: {
  chartType: PoolsDetailsChartType
  onChartTypeChange: (c: PoolsDetailsChartType) => void
  disabledOption?: PoolsDetailsChartType
}) => (
  <ChartTypeSelectorContainer>
    <ChartTypeDropdown
      options={PDP_CHART_SELECTOR_OPTIONS}
      currentChartType={chartType}
      onSelectOption={onChartTypeChange}
      disabledOption={disabledOption}
    />
  </ChartTypeSelectorContainer>
)

interface ChartSectionProps {
  poolData?: any
  loading: boolean
  isReversed: boolean
}

/** Represents a variety of query result shapes, discriminated via additional `chartType` field. */
type ActiveQuery =
  | ChartQueryResult<PriceChartData, ChartType.PRICE>
  | ChartQueryResult<SingleHistogramData, ChartType.VOLUME>
  | ChartQueryResult<undefined, ChartType.LIQUIDITY>

type TDPChartState = {
  timePeriod: GraphQLTimePeriod
  setTimePeriod: (timePeriod: GraphQLTimePeriod) => void
  setChartType: (chartType: PoolsDetailsChartType) => void
  activeQuery: ActiveQuery
  dataQuality?: DataQuality
}

// Define time period options with JSX Elements for display
const TIME_PERIOD_OPTIONS: SegmentedControlOption<string>[] = [
  { value: '1D' },
  { value: '1W' },
  { value: '1M' },
  { value: '1Y' },
]

// Helper function to convert string to GraphQLTimePeriod
function stringToTimePeriod(value: string): GraphQLTimePeriod {
  switch (value) {
    case '1D':
      return GraphQLTimePeriod.DAY
    case '1W':
      return GraphQLTimePeriod.WEEK
    case '1M':
      return GraphQLTimePeriod.MONTH
    case '1Y':
      return GraphQLTimePeriod.YEAR
    default:
      return GraphQLTimePeriod.DAY
  }
}

export default function ChartSection({
  currency0,
  currency1,
  poolId,
}: {
  currency0?: Currency
  currency1?: Currency
  poolId: string
}) {
  const [timePeriod, setTimePeriod] = useState<GraphQLTimePeriod>(GraphQLTimePeriod.DAY)
  const [chartType, setChartType] = useState<PoolsDetailsChartType>(ChartType.VOLUME)
  const refitChartContent = useAtomValue(refitChartContentAtom)

  // Convert GraphQLTimePeriod enum to string for usePoolChart
  const timePeriodString = useMemo(() => {
    switch (timePeriod) {
      case GraphQLTimePeriod.DAY:
        return "DAY";
      case GraphQLTimePeriod.WEEK:
        return "WEEK";
      case GraphQLTimePeriod.MONTH:
        return "MONTH";
      case GraphQLTimePeriod.YEAR:
        return "YEAR";
      default:
        return "DAY";
    }
  }, [timePeriod]);

  // Track previous chartData to determine if we should disable polling
  const prevChartDataRef = useRef<any>(null);
  const [disablePolling, setDisablePolling] = useState(false);
  
  const { chartData, isLoading, error } = usePoolChart(
    poolId, 
    300000, // 5 minutes
    timePeriodString,
    disablePolling // Disable polling if no data
  )
  
  // Convert GraphQL TimePeriod to Chart TimePeriod
  const chartTimePeriod = useMemo(() => {
    switch (timePeriod) {
      case GraphQLTimePeriod.DAY:
        return ChartTimePeriod.DAY
      case GraphQLTimePeriod.WEEK:
        return ChartTimePeriod.WEEK
      case GraphQLTimePeriod.MONTH:
        return ChartTimePeriod.MONTH
      case GraphQLTimePeriod.YEAR:
        return ChartTimePeriod.YEAR
      default:
        return ChartTimePeriod.DAY
    }
  }, [timePeriod])

  const filteredTimeOptions = useMemo(() => {
    const options = chartType === ChartType.PRICE
      ? TIME_PERIOD_OPTIONS.filter(option => option.value !== 'HOUR')
      : TIME_PERIOD_OPTIONS

    const selected = options.find(option => 
      stringToTimePeriod(option.value) === timePeriod
    )?.value ?? 'DAY'

    return { options, selected }
  }, [chartType, timePeriod])

  // Check if there's no data for the selected chart type and time period
  const hasNoData = useMemo(() => {
    if (!chartData) return true;
    
    switch (chartType) {
      case ChartType.PRICE:
        return !chartData.price || chartData.price.length === 0;
      case ChartType.VOLUME:
        return !chartData.volume || chartData.volume.length === 0;
      case ChartType.LIQUIDITY:
        return !chartData.liquidity || !chartData.liquidity.barData || chartData.liquidity.barData.length === 0;
      default:
        return false;
    }
  }, [chartData, chartType]);

  // Reset polling state when time period or chart type changes
  useEffect(() => {
    setDisablePolling(false);
    prevChartDataRef.current = null;
  }, [timePeriod, chartType]);

  // Disable polling immediately when we detect no data (after first load)
  useEffect(() => {
    // Only update after first load is complete
    if (!isLoading && chartData !== prevChartDataRef.current) {
      prevChartDataRef.current = chartData;
      
      // Only update state if it needs to change to avoid unnecessary re-renders
      if (hasNoData && !disablePolling) {
        setDisablePolling(true); // Disable polling immediately when no data
      } else if (!hasNoData && disablePolling) {
        setDisablePolling(false); // Enable polling when data exists
      }
    }
  }, [hasNoData, isLoading, chartData, disablePolling]);

  const ChartBody = (() => {
    // If loading but we already know there's no data, show error state
    if (isLoading && chartData && hasNoData) {
      return (
        <ChartSkeleton 
          height={PDP_CHART_HEIGHT_PX} 
          type={chartType}
          errorText={true}
        />
      )
    }

    // Normal loading state - use dim to avoid bright colors
    if (isLoading) {
      return <ChartSkeleton height={PDP_CHART_HEIGHT_PX} type={chartType} dim={true} />
    }

    if (error || !chartData || hasNoData) {
      return (
        <ChartSkeleton 
          height={PDP_CHART_HEIGHT_PX} 
          type={chartType}
          errorText={hasNoData ? true : undefined}
        />
      )
    }

    const commonProps = {
      height: PDP_CHART_HEIGHT_PX,
      timePeriod: chartTimePeriod,
      tokenA: currency0?.wrapped,
      tokenB: currency1?.wrapped,
      isReversed: false,
      feeTier: FeeAmount.MEDIUM,
      stale: false,
    }

    switch (chartType) {
      case ChartType.PRICE:
        return (
          <PriceChart 
            tokenA={currency0?.wrapped}
            tokenB={currency1?.wrapped}
            isReversed={false}
            data={chartData.price}
            stale={false}
          />
        )
      case ChartType.VOLUME:
        return <VolumeChart {...commonProps} data={chartData.volume} />
      case ChartType.LIQUIDITY:
          return <LiquidityChart {...commonProps} data={chartData.liquidity} />
      default:
        return null
    }
  })()

  return (
    <div data-testid="pdp-chart-container">
      {ChartBody}
      <ChartActionsContainer>
        <ChartTypeSelectorContainer>
          <ChartTypeDropdown
            options={PDP_CHART_SELECTOR_OPTIONS}
            currentChartType={chartType}
            onSelectOption={setChartType}
          />
        </ChartTypeSelectorContainer>
        {chartType !== ChartType.LIQUIDITY && (
          <TimePeriodSelectorContainer>
            <SegmentedControl
              options={filteredTimeOptions.options}
              selectedOption={filteredTimeOptions.selected}
              onSelectOption={(option: string) => {
                const matchingOption = TIME_PERIOD_OPTIONS.find(opt => 
                  opt.value === option
                )
                if (matchingOption) {
                  const newTimePeriod = stringToTimePeriod(matchingOption.value)
                  if (newTimePeriod === timePeriod) {
                    refitChartContent?.()
                  } else {
                    setTimePeriod(newTimePeriod)
                  }
                }
              }}
            />
          </TimePeriodSelectorContainer>
        )}
      </ChartActionsContainer>
    </div>
  )
}

const PriceDisplayContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: 4px;
`

const ChartPriceText = styled(ThemedText.HeadlineMedium)`
  ${EllipsisStyle}
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    font-size: 24px !important;
    line-height: 32px !important;
  }
`
function PriceChart({
  tokenA,
  tokenB,
  isReversed,
  data,
  stale,
}: {
  tokenA: any
  tokenB: any
  isReversed: boolean
  data: PriceChartData[]
  stale: boolean
}) {
  const [primaryToken, referenceToken] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]

  const params = useMemo(() => ({ data, stale, type: PriceChartType.LINE }), [data, stale])

  // const { data: price, isLoading } = useUSDPrice(referenceToken)

  const lastPrice = data[data.length - 1]
  return (
    <Chart height={PDP_CHART_HEIGHT_PX} Model={PriceChartModel} params={params}>
      {(crosshairData) => {
        const displayValue = crosshairData ?? lastPrice
        const currencyBAmountRaw = Math.floor(
          (displayValue.value ?? displayValue.close) * 10 ** referenceToken.decimals,
        )
        const priceDisplay = (
          <PriceDisplayContainer>
            <ChartPriceText>
              {`1 ${referenceToken.symbol} = ${formatCurrencyAmount(CurrencyAmount.fromRawAmount(referenceToken, currencyBAmountRaw))} 
            ${primaryToken.symbol}`}
            </ChartPriceText>
            {/* <ChartPriceText color="neutral2">{price ? '(' + formatNumber(price) + ')' : ''}</ChartPriceText> */}
          </PriceDisplayContainer>
        )
        return (
          <ChartHeader
            value={priceDisplay}
            additionalFields={<PriceChartDelta startingPrice={data[0]} endingPrice={displayValue} />}
            valueFormatterType={NumberType.FiatTokenPrice}
            time={crosshairData?.time}
          />
        )
      }}
    </Chart>
  )
}

const FadeInHeading = styled(ThemedText.MediumHeader)`
  ${textFadeIn};
  line-height: 32px;
`
const FadeInSubheader = styled(ThemedText.SubHeader)`
  ${textFadeIn}
`

function formatPriceDisplay(price: number): string {
  if (price > 1000000) {
    return '>1000000'
  } else if (price < 0.000001) {
    return '<0.01'
  }
  return price.toFixed(2)
}

function LiquidityTooltipDisplay({
  data,
  tokenADescriptor,
  tokenBDescriptor,
  currentTick,
}: {
  data: LiquidityBarData
  tokenADescriptor: string
  tokenBDescriptor: string
  currentTick?: number
}) {
  if (!currentTick) {
    return null
  }

  const displayValue0 =
    data.tick >= currentTick
      ? formatNumber(data.amount0Locked,
          NumberType.ChartFiatValue,
        )
      : 0
  const displayValue1 =
    data.tick <= currentTick
        ? formatNumber( data.amount1Locked,
        NumberType.ChartFiatValue,
        )
      : 0

  return (
    <>
      <ThemedText.BodySmall>
      {`${tokenADescriptor} liquidity: ${displayValue0}`}
      </ThemedText.BodySmall>
      <ThemedText.BodySmall>
        {`${tokenBDescriptor} liquidity: ${displayValue1}`}
      </ThemedText.BodySmall>
    </>
  )
}

function LiquidityChart({
  tokenA,
  tokenB,
  feeTier,
  isReversed,
  data,
}: {
  tokenA: any
  tokenB: any
  feeTier: FeeAmount
  isReversed: boolean
  data: any
}) {
  const tokenADescriptor = tokenA.symbol ?? 'Token A'
  const tokenBDescriptor = tokenB.symbol ?? 'Token B'
  const theme = useTheme()

  const tickData = useMemo(() => ({
    barData: data.barData,
    activeRangeData: data.activeRangeData,
    activeRangePercentage: data.activeRangePercentage
  }), [data.barData, data.activeRangeData, data.activeRangePercentage])
  
  const activeTick = data.activeRangeData?.tick ?? 0

  const params = useMemo(() => ({
    data: tickData.barData,
    tokenAColor: isReversed ? theme.accentAction : theme.accentActionSoft,
    tokenBColor: isReversed ? theme.accentActionSoft : theme.accentAction,
    highlightColor: theme.accentAction,
    activeTick,
    activeTickProgress: tickData.activeRangePercentage,
  }), [isReversed, theme, tickData, activeTick])

  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={LiquidityBarChartModel}
      params={params}
      TooltipBody={
        feeTier !== FeeAmount.LOWEST
          ? ({ data }: { data: LiquidityBarData }) => (
              <LiquidityTooltipDisplay
                data={data}
                tokenADescriptor={tokenADescriptor}
                tokenBDescriptor={tokenBDescriptor}
                currentTick={tickData.activeRangeData?.tick}
              />
            )
          : undefined
      }
    >
      {(crosshair) => {
        const displayPoint = crosshair ?? tickData.activeRangeData
        const display = (
          <div>
            <FadeInHeading>{`1 ${tokenADescriptor} = ${formatPriceDisplay(Number(displayPoint?.price0))} ${tokenBDescriptor}`}</FadeInHeading>
            <FadeInHeading>{`1 ${tokenBDescriptor} = ${formatPriceDisplay(Number(displayPoint?.price1))} ${tokenADescriptor}`}</FadeInHeading>
            {displayPoint && displayPoint.tick === activeTick && (
              <FadeInSubheader color="neutral2" paddingTop="4px">
                Active range
              </FadeInSubheader>
            )}
          </div>
        )
        return <ChartHeader value={display} />
      }}
    </Chart>
  )
}
