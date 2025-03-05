import { ReactNode, useMemo, useState } from 'react'

import { ChartHeader } from 'components/ChartsV2/ChartHeader'
import { Chart } from 'components/ChartsV2/ChartModel'
import { ChartSkeleton } from 'components/ChartsV2/LoadingState'
import { TVLChartModel } from 'components/ChartsV2/StackedLineChart'
import { ChartType } from 'components/ChartsV2/utils'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'

import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useTheme } from 'styled-components/macro'
import { formatNumber, NumberType } from 'conedison/format'
import styled from 'styled-components'
import { Flex } from 'components/layout/Flex'
import { Text } from 'components/Text/Text'
import { UTCTimestamp } from 'lightweight-charts'
import { SegmentedControl } from 'theme/components/SegmentedControl'
import { getCumulativeSum, getCumulativeVolume, getVolumeProtocolInfo } from 'components/ChartsV2/VolumeChart/utils'
import { CustomVolumeChartModel } from 'components/ChartsV2/VolumeChart/CustomVolumeChartModel'
import { StackedHistogramData } from 'components/ChartsV2/VolumeChart/renderer'
import { formatHistoryDuration } from 'components/ChartsV2/VolumeChart'
import useUniswapTvl from 'graphql/thegraph/UniswapTvlQuery'
import ms from 'ms.macro'
import useUniswapVolume from 'graphql/thegraph/UniswapVolumeQuery'

const EXPLORE_CHART_HEIGHT_PX = 368
const PRICE_SOURCES = ['V2', 'V3']

export enum TimePeriod {
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
  YEAR = 'Y',
}

export enum HistoryDuration {
  Day = 'DAY',
  FiveMinute = 'FIVE_MINUTE',
  Hour = 'HOUR',
  Max = 'MAX',
  Month = 'MONTH',
  Week = 'WEEK',
  Year = 'YEAR'
}

const TIME_SELECTOR_OPTIONS = [{ value: TimePeriod.DAY }, { value: TimePeriod.WEEK }, { value: TimePeriod.MONTH }]

const ChartsContainer = styled(Flex)({
  flexDirection: 'row',
  gap: '56px',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
  width: '100%',
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingBottom: '56px',
})

const SectionContainer = styled(Flex)`
  position: relative;
  width: 100%;
  gap: 4px;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    background-color: ${({ theme }) => theme.backgroundModule};
    border-radius: 20px;
    height: 120px;
    padding: 20px;
  }
`

const SectionTitle = styled(Text)`
  font-weight: 500;
  font-size: 16px;
  white-space: nowrap;
  color: ${({ theme }) => theme.textSecondary} !important;
`

function VolumeChartSection() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const theme = useTheme()
  const isSmallScreen = !useScreenSize()['md']
  const { data, isLoading } = useUniswapVolume(ms`30s`)
  // const refitChartContent = useAtomValue(refitChartContentAtom)

  function timeGranularityToHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
    // note: timePeriod on the Explore Page represents the GRANULARITY, not the timespan of data shown.
    // i.e. timePeriod == D shows 1month data, timePeriod == W shows 1year data, timePeriod == M shows past 3Y data
    switch (timePeriod) {
      case TimePeriod.DAY:
      default:
        return HistoryDuration.Month
      case TimePeriod.WEEK:
        return HistoryDuration.Year
      case TimePeriod.MONTH:
        return HistoryDuration.Max
    }
  }

  // Add mock data generation
  const mockEntries = useMemo(() => {
    if (!data?.uniswapDayDatas) return []
    return data?.uniswapDayDatas?.filter(dayData => !dayData.volumeUSD || dayData.volumeUSD !== '0').map((dayData) => {
      return {
        time: (dayData.date) as UTCTimestamp,
        values: {
          V3: Number(dayData.volumeUSD),
        },
      }
    })
  }, [data])

  // Replace real data with mock data
  const entries = mockEntries
  // const dataQuality = DataQuality.VALID

  const params = useMemo(
    () => ({
      data: entries,
      colors: [theme.accentActionSoft],
      headerHeight: 80,
      stale: false,
      useThinCrosshair: true,
      isMultichainExploreEnabled: true,
      background: theme.background,
    }),
    [entries, theme.accentAction, theme.accentActionSoft, theme.background]
  )

  const cumulativeVolume = useMemo(() => getCumulativeVolume(entries), [entries])
  console.log(cumulativeVolume, 'cumulativeVolume');
  
  if (isSmallScreen) {
    return (
      <MinimalStatDisplay
        title="Uniswap Volume"
        value={cumulativeVolume}
        time="Past Month"
      />
    )
  }

  return (
    <SectionContainer>
      <Flex row justifyContent="space-between" alignItems="center" style={{ marginBottom: '10px' }}>
        <SectionTitle style={{ marginBottom: '10px' }}>
          Uniswap Volume
        </SectionTitle>
        <SegmentedControl
          options={TIME_SELECTOR_OPTIONS}
          selectedOption={timePeriod}
          onSelectOption={(option) => {
            if (option === timePeriod) {
              // refitChartContent?.()
            } else {
              setTimePeriod(option)
            }
          }}
          size="small"
        />
      </Flex>
      {(() => {
        if (isLoading) {
          return <ChartSkeleton hideYAxis type={ChartType.VOLUME} height={EXPLORE_CHART_HEIGHT_PX} />
        }
        return (
          <Chart
            // TODO(WEB-4820): Remove key when Chart automatically updates to theme changes
            // Setting a key based on theme forces the chart to re-render when the theme changes
            key={`protocol-volume-chart-${theme.darkMode ? 'dark' : 'light'}`}
            Model={CustomVolumeChartModel<StackedHistogramData>}
            params={params}
            height={EXPLORE_CHART_HEIGHT_PX}
          >
            {(crosshairData: StackedHistogramData | undefined) => (
              <ChartHeader
                value={crosshairData ? getCumulativeSum(crosshairData) : getCumulativeVolume(entries)}
                time={crosshairData?.time}
                timePlaceholder={formatHistoryDuration(timeGranularityToHistoryDuration(timePeriod))}
                protocolData={getVolumeProtocolInfo(crosshairData, PRICE_SOURCES)}
              />
            )}
          </Chart>
        )
      })()}
    </SectionContainer>
  )
}

function TVLChartSection() {
  const theme = useTheme()
  const { data, isLoading } = useUniswapTvl(ms`30s`)
  
  const mockEntries = useMemo(() => {
    if (!data?.uniswapDayDatas) return []
    return data?.uniswapDayDatas.filter(dayData => !dayData.tvlUSD || dayData.tvlUSD !== '0').map((dayData) => {
      return {
        time: (dayData.date as UTCTimestamp),
        values: [
          Number(dayData.tvlUSD),
        ],
      }
    })
  }, [data]);

  const entries = mockEntries

  const lastEntry = entries[entries.length - 1]
  const params = useMemo(
    () => ({
      data: entries,
      colors: [theme.accentAction] as string[],
      gradients: [
        { 
          start: `${theme.accentAction}30`,
          end: `${theme.accentAction}05`
        }
      ],
      isMainChart: true,
    }),
    [entries, theme],
  )

  const isSmallScreen = !useScreenSize()['md']
  if (isSmallScreen) {
    const currentTVL = lastEntry?.values.reduce((acc, curr) => acc + curr, 0)
    return <MinimalStatDisplay title="Haust TVL" value={currentTVL} />
  }

  return (
    <SectionContainer>
      <SectionTitle style={{ marginBottom: '20px' }}>
        Haust TVL
      </SectionTitle>
      {(() => {
        if (isLoading) {
          return <ChartSkeleton hideYAxis type={ChartType.TVL} height={EXPLORE_CHART_HEIGHT_PX} />
        }
        
        return (
          <Chart Model={TVLChartModel} params={params} height={EXPLORE_CHART_HEIGHT_PX}>
            {(crosshairData) => (
              <ChartHeader
                value={(crosshairData ?? lastEntry)?.values.reduce((v, sum) => (sum += v), 0)}
                time={crosshairData?.time}
                protocolData={PRICE_SOURCES.map((source, index) => ({
                  protocol: source,
                  value: crosshairData?.values[index],
                }))}
              />
            )}
          </Chart>
        )
      })()}
    </SectionContainer>
  )
}

function MinimalStatDisplay({ title, value, time }: { title: ReactNode; value: number; time?: ReactNode }) {
  const theme = useTheme()

  return (
    <SectionContainer>
      <SectionTitle>{title}</SectionTitle>
      <Text color={theme.textPrimary} variant="heading2Bolder">{formatNumber(value, NumberType.ChartFiatValue)}</Text>
      {time && (
        <Text variant="body3" color={theme.textSecondary}>
          {time}
        </Text>
      )}
    </SectionContainer>
  )
}

export function ExploreChartsSection() {
  return (
    <ChartsContainer>
      <TVLChartSection />
      <VolumeChartSection />
    </ChartsContainer>
  )
}
