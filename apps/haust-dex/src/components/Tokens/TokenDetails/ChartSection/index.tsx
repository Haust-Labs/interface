import { ChartType, PriceChartType } from "components/ChartsV2/utils"
import { Flex } from "components/layout/Flex"
import styled from "styled-components/macro"
import { SegmentedControl, SegmentedControlOption } from "theme/components/SegmentedControl"
import { ChartQueryResult, DataQuality } from "./util"
import { PriceChart, PriceChartData } from "components/ChartsV2/PriceChart"
import { SingleHistogramData } from "components/ChartsV2/VolumeChart/renderer"
import { LineChart, StackedLineData } from "components/ChartsV2/StackedLineChart"
import { useMemo, useState } from "react"
import { ChartSkeleton } from "components/ChartsV2/LoadingState"
import { VolumeChart } from "components/ChartsV2/VolumeChart"
import { AdvancedPriceChartToggle } from "./AdvancedPriceChartToggle"
import { ChartTypeDropdown } from "./ChartTypeSelector"
import { UTCTimestamp } from "lightweight-charts"
import useTokenPriceChart from "graphql/thegraph/TokenPriceChartQuery"
import useTokenVolumeChart from "graphql/thegraph/TokenVolumeChartQuery"
import useTokenTVLChart from "graphql/thegraph/TokenTVLChartQuery"

export const TDP_CHART_HEIGHT_PX = 356
const TDP_CHART_SELECTOR_OPTIONS = [ChartType.PRICE, ChartType.VOLUME, ChartType.TVL] as const
type TokenDetailsChartType = (typeof TDP_CHART_SELECTOR_OPTIONS)[number]

export enum TimePeriod {
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
  YEAR = 'Y',
}

export enum TimePeriodDisplay {
  HOUR = '1H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y',
}

export const DISPLAYS: Record<TimePeriod, TimePeriodDisplay> = {
  [TimePeriod.HOUR]: TimePeriodDisplay.HOUR,
  [TimePeriod.DAY]: TimePeriodDisplay.DAY,
  [TimePeriod.WEEK]: TimePeriodDisplay.WEEK,
  [TimePeriod.MONTH]: TimePeriodDisplay.MONTH,
  [TimePeriod.YEAR]: TimePeriodDisplay.YEAR,
}

export const ORDERED_TIMES: TimePeriod[] = [
  TimePeriod.HOUR,
  TimePeriod.DAY,
  TimePeriod.WEEK,
  TimePeriod.MONTH,
  TimePeriod.YEAR,
]

export const DEFAULT_PILL_TIME_SELECTOR_OPTIONS = ORDERED_TIMES.map((time: TimePeriod) => ({
  value: DISPLAYS[time],
})) as SegmentedControlOption[]

export const ChartActionsContainer = styled(Flex)`
  flex-direction: row-reverse;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  $md: {
    flex-direction: column;
    gap: 16px;
  },
})
`

/** Represents a variety of query result shapes, discriminated via additional `chartType` field. */
type ActiveQuery =
  | ChartQueryResult<PriceChartData, ChartType.PRICE>
  | ChartQueryResult<SingleHistogramData, ChartType.VOLUME>
  | ChartQueryResult<StackedLineData, ChartType.TVL>

export type TDPChartState = {
  /** Time controls for TDP Charts */
  timePeriod: TimePeriod
  setTimePeriod: (timePeriod: TimePeriod) => void
  /** Selectors for TDP Charts */
  setChartType: (chartType: TokenDetailsChartType) => void
  priceChartType: PriceChartType
  setPriceChartType: (priceChartType: PriceChartType) => void
  activeQuery: ActiveQuery
  /** Special-case: flag to disable candlestick toggle on tokens with invalid OHLC data  */
  disableCandlestickUI: boolean
}

const InvalidChartMessage = () => <div>invalid chart</div>

const MOCK_PRICE_DATA: any = {
  entries: Array.from({ length: 24 }, (_, i) => {
    const timestamp = Math.floor((Date.now() - i * 3600000) / 1000) as UTCTimestamp
    const basePrice = 1000
    const open = basePrice + Math.random() * 100
    const close = basePrice + Math.random() * 100
    const high = Math.max(open, close) + Math.random() * 50
    const low = Math.min(open, close) - Math.random() * 50
    
    return {
      time: timestamp,
      value: close,
      open,
      close,
      high,
      low
    }
  }).reverse()
}

const MOCK_VOLUME_DATA: any = {
  entries: Array.from({ length: 24 }, (_, i) => {
    const time = Math.floor((Date.now() - i * 3600000) / 1000) as UTCTimestamp
    return {
      time,
      value: 100000 + Math.random() * 900000, // More realistic volume range: 100k-1M
    }
  }).reverse()
}

const MOCK_TVL_DATA: any = {
  entries: Array.from({ length: 24 }, (_, i) => ({
    time: Math.floor(Date.now() / 1000) - i * 3600, // Unix timestamp в секундах
    values: [5000000 + Math.random() * 1000000], // TVL значения
  })).reverse(),
  categories: ['TVL'],
}

export function getTimePeriodFromDisplay(display: TimePeriodDisplay): TimePeriod {
  switch (display) {
    case TimePeriodDisplay.HOUR:
      return TimePeriod.HOUR
    case TimePeriodDisplay.DAY:
      return TimePeriod.DAY
    case TimePeriodDisplay.WEEK:
      return TimePeriod.WEEK
    case TimePeriodDisplay.MONTH:
      return TimePeriod.MONTH
    case TimePeriodDisplay.YEAR:
      return TimePeriod.YEAR
  }
}

export default function ChartSection({
  activeQuery = undefined,
  priceChartType: initialPriceChartType = PriceChartType.LINE,
  token,
}: {
  activeQuery?: ActiveQuery
  priceChartType?: PriceChartType
  token: string
}) {
  const [timePeriod, setTimePeriod] = useState(TimePeriod.DAY);
  const [chartType, setChartType] = useState(ChartType.PRICE);
  const [priceChartType, setPriceChartType] = useState(initialPriceChartType);
  const isMediumScreen = window.innerWidth < 768; // простая замена useScreenSize
  const { data: priceChartData } = useTokenPriceChart(token, 1000)
  const { data: volumeChartData } = useTokenVolumeChart(token, 1000)
  const { data: tvlChartData } = useTokenTVLChart(token, 1000)
  // Transform GraphQL price data into required format
  const transformedPriceData = useMemo(() => {
    if (!priceChartData?.tokenDayDatas?.length) return MOCK_PRICE_DATA;

    return {
      entries: priceChartData.tokenDayDatas.map((entry: any) => {
        const timestamp = Math.floor(entry.date) as UTCTimestamp
        return {
          time: timestamp,
          value: Number(Number(entry.close).toFixed(3)),
          open: Number(Number(entry.open).toFixed(3)),
          close: Number(Number(entry.close).toFixed(3)),
          high: Number(Number(entry.high).toFixed(3)),
          low: Number(Number(entry.low).toFixed(3))
        }
      })
    }
  }, [priceChartData])

  const transformedVolumeData = useMemo(() => {
    if (!volumeChartData?.tokenDayDatas?.length) return MOCK_VOLUME_DATA;

    return {
      entries: volumeChartData.tokenDayDatas.map((entry: any) => ({
        time: Math.floor(entry.date),
        value: Number(Number(entry.volumeUSD).toFixed(3))
      }))
    }
  }, [volumeChartData])

  const transformedTVLData = useMemo(() => {
    if (!tvlChartData?.tokenDayDatas?.length) return MOCK_TVL_DATA;

    return {
      entries: tvlChartData.tokenDayDatas.map((entry: any) => ({
        time: Math.floor(entry.date),
        values: [Number(Number(entry.totalValueLockedUSD).toFixed(3))]
      })),
      categories: ['TVL']
    }
  }, [tvlChartData])
  // Use mock data if no activeQuery is provided
  const mockQuery: ActiveQuery = useMemo(() => {
    if (activeQuery) return activeQuery;

    // Default to PRICE chart type if none specified
    const currentChartType = chartType ?? ChartType.PRICE;

    switch (currentChartType) {
      case ChartType.PRICE:
        return {
          chartType: ChartType.PRICE,
          entries: transformedPriceData.entries,
          loading: false,
          dataQuality: DataQuality.VALID,
          theme: {
            accentAction: '#4C82FB'
          }
        } as ChartQueryResult<PriceChartData, ChartType.PRICE>;
      
      case ChartType.VOLUME:
        return {
          chartType: ChartType.VOLUME,
          entries: transformedVolumeData.entries,
          loading: false,
          dataQuality: DataQuality.VALID,
        } as ChartQueryResult<SingleHistogramData, ChartType.VOLUME>;
      
      case ChartType.TVL:
        return {
          chartType: ChartType.TVL,
          entries: transformedTVLData.entries,
          loading: false,
          dataQuality: DataQuality.VALID,
        } as ChartQueryResult<StackedLineData, ChartType.TVL>;
      
      default:
        // Ensure we always return a valid ActiveQuery
        return {
          chartType: ChartType.PRICE,
          entries: transformedPriceData.entries,
          loading: false,
          dataQuality: DataQuality.VALID,
        } as ChartQueryResult<PriceChartData, ChartType.PRICE>;
    }
  }, [activeQuery, chartType, transformedPriceData]);

  const finalQuery: ActiveQuery = activeQuery ?? mockQuery;

  // eslint-disable-next-line consistent-return
  const getSection = () => {
    if (finalQuery.dataQuality === DataQuality.INVALID) {
      return (
        <ChartSkeleton
          type={finalQuery.chartType}
          height={TDP_CHART_HEIGHT_PX}
          errorText={finalQuery.loading ? undefined : <InvalidChartMessage />}
        />
      );
    }

    const stale = finalQuery.dataQuality === DataQuality.STALE;
    switch (finalQuery.chartType) {
      case ChartType.PRICE:
        return (
          <PriceChart data={finalQuery.entries} height={TDP_CHART_HEIGHT_PX} type={priceChartType} stale={stale} />
        );
      case ChartType.VOLUME:
        return (
          <VolumeChart 
            data={finalQuery.entries}
            height={TDP_CHART_HEIGHT_PX} 
            timePeriod={timePeriod} 
            stale={stale} 
          />
        );
      case ChartType.TVL:
        return <LineChart data={finalQuery.entries} height={TDP_CHART_HEIGHT_PX} stale={stale} />;
    }
  };

  return (
    <div data-cy={`tdp-${finalQuery.chartType}-chart-container`}>
      {getSection()}
      <ChartActionsContainer>
        <Flex
          row
          gap="8px"
        >
          {finalQuery.chartType === ChartType.PRICE && (
            <div>
              <AdvancedPriceChartToggle
                currentChartType={priceChartType}
                onChartTypeChange={setPriceChartType}
                disableCandlestickUI={false}
              />
            </div>
          )}
          <ChartTypeDropdown
            options={TDP_CHART_SELECTOR_OPTIONS}
            currentChartType={finalQuery.chartType}
            onSelectOption={(c) => {
              setChartType(c)
              if (c === ChartType.PRICE) {
                setPriceChartType(PriceChartType.LINE)
              }
            }}
          />
        </Flex>
        <Flex>
          <SegmentedControl
            fullWidth={isMediumScreen}
            options={DEFAULT_PILL_TIME_SELECTOR_OPTIONS}
            selectedOption={DISPLAYS[timePeriod]}
            onSelectOption={(option) => {
              const time = getTimePeriodFromDisplay(option as TimePeriodDisplay)
              setTimePeriod(time)
            }}
          />
        </Flex>
      </ChartActionsContainer>
    </div>
  );
}
