import { ChartHeader } from 'components/ChartsV2/ChartHeader'
import { Chart, ChartModelParams } from 'components/ChartsV2/ChartModel'
import {
  CustomVolumeChartModel,
  CustomVolumeChartModelParams,
} from 'components/ChartsV2/VolumeChart/CustomVolumeChartModel'
import { SingleHistogramData } from 'components/ChartsV2/VolumeChart/renderer'
import { getCumulativeVolume } from 'components/ChartsV2/VolumeChart/utils'
import { useHeaderDateFormatter } from 'components/ChartsV2/hooks'
import { formatNumber, NumberType } from 'conedison/format'
import { useMemo } from 'react'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

export const BIPS_BASE = 10_000

export enum HistoryDuration {
  Day = 'DAY',
  FiveMinute = 'FIVE_MINUTE',
  Hour = 'HOUR',
  Max = 'MAX',
  Month = 'MONTH',
  Week = 'WEEK',
  Year = 'YEAR'
}

export enum TimePeriod {
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
  YEAR = 'Y',
}

interface VolumeChartModelParams extends ChartModelParams<SingleHistogramData>, CustomVolumeChartModelParams {
  TooltipBody?: React.FunctionComponent<{ data: SingleHistogramData }>
}

class VolumeChartModel extends CustomVolumeChartModel<SingleHistogramData> {
  constructor(chartDiv: HTMLDivElement, params: VolumeChartModelParams) {
    super(chartDiv, params)
  }

  
  updateOptions(params: VolumeChartModelParams) {
    const volumeChartOptions = {
      autoSize: true,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      handleScale: {
        axisPressedMouseMove: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    }

    super.updateOptions(params, volumeChartOptions)
  }
}

export function toHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return HistoryDuration.Hour
    case TimePeriod.DAY:
      return HistoryDuration.Day
    case TimePeriod.WEEK:
      return HistoryDuration.Week
    case TimePeriod.MONTH:
      return HistoryDuration.Month
    case TimePeriod.YEAR:
      return HistoryDuration.Year
    default:
      return HistoryDuration.Day
  }
}

export function formatHistoryDuration(duration: HistoryDuration): string {
  switch (duration) {
    case HistoryDuration.FiveMinute:
      return 'Past 5 Minutes  '
    case HistoryDuration.Hour:
      return 'Past Hour'
    case HistoryDuration.Day:
      return 'Past Day'
    case HistoryDuration.Week:
      return 'Past Week'
    case HistoryDuration.Month:
      return 'Past Month'
    case HistoryDuration.Year:
      return 'Past Year'
    case HistoryDuration.Max:
      return 'All Time'
    default:
      return 'Unknown Duration'
  }
}

function VolumeChartHeader({
  crosshairData,
  volumes,
  timePeriod,
}: {
  crosshairData?: SingleHistogramData
  volumes: SingleHistogramData[]
  timePeriod: TimePeriod
}) {
  const headerDateFormatter = useHeaderDateFormatter()

  const display = useMemo(() => {
    const displayValues = {
      volume: '-',
      time: '-',
    }
    const priceFormatter = (price?: number) =>
      formatNumber(
        price,
        NumberType.ChartFiatValue,
      )
    if (crosshairData === undefined) {
      const cumulativeVolume = getCumulativeVolume(volumes)
      displayValues.volume = priceFormatter(cumulativeVolume) ?? '-'
      displayValues.time = formatHistoryDuration(toHistoryDuration(timePeriod))
    } else {
      displayValues.volume = priceFormatter(crosshairData.value) ?? '-'
      displayValues.time = headerDateFormatter(crosshairData.time) ?? '-'
    }
    return displayValues
  }, [crosshairData, headerDateFormatter, timePeriod, volumes])

  return (
    <ChartHeader
      value={<ThemedText.HeadlineLarge color="inherit">{display.volume}</ThemedText.HeadlineLarge>}
      time={crosshairData?.time}
      timePlaceholder={formatHistoryDuration(toHistoryDuration(timePeriod))}
    />
  )
}

function FeesTooltipDisplay({ data, feeTier }: { data: SingleHistogramData; feeTier?: number }) {
  const fees = data.value * ((feeTier ?? 0) / BIPS_BASE / 100)

  return (
    <>
      <ThemedText.BodySmall>
        {formatNumber(fees,
          NumberType.ChartFiatValue,
        )}
      </ThemedText.BodySmall>
    </>
  )
}

interface VolumeChartProps {
  height: number
  data: SingleHistogramData[]
  feeTier?: number
  timePeriod: TimePeriod
  TooltipBody?: React.FunctionComponent<{ data: SingleHistogramData }>
  stale: boolean
}

export function VolumeChart({ height, data, feeTier, timePeriod, stale }: VolumeChartProps) {
  const theme = useTheme()

  const params = useMemo(
    () => ({ data, colors: [theme.accentAction], headerHeight: 75, stale }),
    [data, stale, theme.accentAction],
  )

  return (
    <Chart
      Model={VolumeChartModel}
      params={params}
      height={height}
      TooltipBody={
        feeTier === undefined // i.e. if is token volume chart
          ? undefined
          : ({ data }: { data: SingleHistogramData }) => <FeesTooltipDisplay data={data} feeTier={feeTier} />
      }
    >
      {(crosshairData) => <VolumeChartHeader crosshairData={crosshairData} volumes={data} timePeriod={timePeriod} />}
    </Chart>
  )
}
