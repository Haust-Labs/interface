import { AreaData, AreaSeriesPartialOptions, BarPrice, CandlestickData, IPriceLine, ISeriesApi, LineStyle, LineType, PriceLineOptions, UTCTimestamp } from "lightweight-charts"
import { Chart, ChartHoverData, ChartModel, ChartModelParams } from "../ChartModel"
import { PriceChartType } from "../utils"
import { RoundedCandleSeries, RoundedCandleSeriesOptions } from "./RoundedCandlestickSeries/rounded-candles-series"
import { getCandlestickPriceBounds } from "./utils"
import { formatNumber, formatPrice, NumberType } from "conedison/format"
import { calculateDelta, DeltaArrow, DeltaText } from "components/Tokens/Delta"
import { Text } from "components/Text/Text"
import { formatDelta } from "components/Tokens/TokenDetails/PriceChart"
import styled from "styled-components"
import { Flex } from "components/layout/Flex"
import { useMemo } from "react"
import { ChartHeader } from "../ChartHeader"

export type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

interface PriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType
}

const LOW_PRICE_RANGE_THRESHOLD = 0.2
const LOW_PRICE_RANGE_SCALE_FACTOR = 1000000000

export class PriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area'> | ISeriesApi<'Custom'>
  private originalData: PriceChartData[]
  private lowPriceRangeScaleFactor = 1
  private type: PriceChartType
  private minPriceLine: IPriceLine | undefined
  private maxPriceLine: IPriceLine | undefined
  private priceLineOptions: Partial<PriceLineOptions> | undefined
  private min: number
  private max: number

  constructor(chartDiv: HTMLDivElement, params: PriceChartModelParams) {
    super(chartDiv, params)
    this.originalData = this.data

    const { adjustedData, lowPriceRangeScaleFactor, min, max } = PriceChartModel.getAdjustedPrices(params.data)
    this.data = adjustedData
    this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
    this.min = min
    this.max = max

    this.type = params.type
    this.series =
      this.type === PriceChartType.LINE ? this.api.addAreaSeries() : this.api.addCustomSeries(new RoundedCandleSeries())
    this.series.setData(this.data)
    this.updateOptions(params)
    this.fitContent()
  }

  private static applyPriceScaleFactor(data: PriceChartData, scaleFactor: number): PriceChartData {
    return {
      time: data.time,
      value: (data.value || data.close) * scaleFactor,
      open: data.open * scaleFactor,
      close: data.close * scaleFactor,
      high: data.high * scaleFactor,
      low: data.low * scaleFactor,
    }
  }

  private static getAdjustedPrices(data: PriceChartData[]) {
    let lowPriceRangeScaleFactor = 1
    let adjustedData = data
    let { min, max } = getCandlestickPriceBounds(data)

    // Lightweight-charts shows few price-axis points for low-value/volatility tokens,
    // so we workaround by "scaling" the prices, causing more price-axis points to be shown
    if (max - min < LOW_PRICE_RANGE_THRESHOLD) {
      lowPriceRangeScaleFactor = LOW_PRICE_RANGE_SCALE_FACTOR
      adjustedData = data.map((point) => this.applyPriceScaleFactor(point, lowPriceRangeScaleFactor))
      min = min * lowPriceRangeScaleFactor
      max = max * lowPriceRangeScaleFactor
    }

    return { adjustedData, lowPriceRangeScaleFactor, min, max }
  }

  updateOptions(params: PriceChartModelParams) {
    const { data, theme, type, locale, format } = params
    super.updateOptions(params, {
      localization: {
        locale,
        priceFormatter: (price: BarPrice) => {
          return format.formatFiatPrice({
            // Transform price back to original value if it was scaled
            price: Number(price) / this.lowPriceRangeScaleFactor,
          })
        },
      },
      grid: {
        vertLines: { style: LineStyle.SparseDotted, color: theme.neutralBorder },
        horzLines: { visible: false },
      },
    })

    // Handles changing between line/candlestick view
    if (this.type !== type) {
      this.type = params.type
      this.api.removeSeries(this.series)
      if (this.type === PriceChartType.CANDLESTICK) {
        this.series = this.api.addCustomSeries(new RoundedCandleSeries())
      } else {
        this.series = this.api.addAreaSeries()
      }
      this.series.setData(this.data)
    }
    // Handles changes in data, e.g. time period selection
    if (this.originalData !== data) {
      this.originalData = data
      const { adjustedData, lowPriceRangeScaleFactor, min, max } = PriceChartModel.getAdjustedPrices(data)
      this.data = adjustedData
      this.lowPriceRangeScaleFactor = lowPriceRangeScaleFactor
      this.min = min
      this.max = max

      this.series.setData(this.data)
      this.fitContent()
    }

    this.series.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,

      // Line-specific options:
      lineType: data.length < 20 ? LineType.WithSteps : LineType.Curved, // Stepped line is visually preferred for smaller datasets
      lineWidth: 2,
      lineColor: theme.accentWarning,
      topColor: theme.accentAction + '40',
      bottomColor: theme.accentAction + '00',
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: theme.accentWarning,
      crosshairMarkerBorderWidth: 3,

      // Candlestick-specific options:
      upColor: theme.accentSuccess,
      wickUpColor: theme.accentSuccess,
      downColor: theme.accentCritical,
      wickDownColor: theme.accentCritical,
      borderVisible: false,
    } as Partial<RoundedCandleSeriesOptions> & AreaSeriesPartialOptions)

    this.priceLineOptions = {
      color: theme.neutralBorder,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelColor: theme.neutralBorder,
      axisLabelTextColor: theme.textPrimary,
    }
    this.minPriceLine?.applyOptions({ price: this.min, ...this.priceLineOptions })
    this.maxPriceLine?.applyOptions({ price: this.max, ...this.priceLineOptions })
  }

  override onSeriesHover(hoverData?: ChartHoverData<CandlestickData>) {
    if (hoverData) {
      // Use original data point for hover functionality rather than data that has been scaled by lowPriceRangeScaleFactor
      const originalItem = this.originalData[hoverData.logicalIndex]
      
      // For candlestick charts, use the candle's X and Y coordinates instead of mouse coordinates
      // This makes the tooltip "snap" to the candle position, similar to Uniswap
      if (this.type === PriceChartType.CANDLESTICK) {
        const candleX = this.api.timeScale().timeToCoordinate(originalItem.time)
        // Use close price for Y coordinate to position tooltip at the candle's close price
        const candleY = this.series.priceToCoordinate(originalItem.close * this.lowPriceRangeScaleFactor)
        if (candleX !== null && candleY !== null) {
          // Update hoverData with candle's coordinates instead of mouse coordinates
          // Note: ChartModel.onSeriesHover will add priceScale width to X, so we pass raw coordinate
          // Set isCandlestick flag so ChartModel knows to position tooltip to the side
          const updatedHoverData = { 
            ...hoverData, 
            item: originalItem,
            x: candleX,
            y: candleY,
            isCandlestick: true
          }
          super.onSeriesHover(updatedHoverData)
        } else {
          super.onSeriesHover({ ...hoverData, item: originalItem })
        }
      } else {
        const updatedHoverData = { ...hoverData, item: originalItem }
        super.onSeriesHover(updatedHoverData)
      }
    } else {
      super.onSeriesHover(undefined)
    }

    // Hide/display price lines based on hover
    if (hoverData === undefined) {
      if (this.minPriceLine && this.maxPriceLine) {
        this.series.removePriceLine(this.minPriceLine)
        this.series.removePriceLine(this.maxPriceLine)
        this.minPriceLine = undefined
        this.maxPriceLine = undefined
      }
    } else if (!this.minPriceLine && !this.maxPriceLine && this.min && this.max) {
      this.minPriceLine = this.series.createPriceLine({ price: this.min, ...this.priceLineOptions })
      this.maxPriceLine = this.series.createPriceLine({ price: this.max, ...this.priceLineOptions })
    }
  }
}

interface PriceChartDeltaProps {
  startingPrice: PriceChartData
  endingPrice: PriceChartData
  noColor?: boolean
}

export function PriceChartDelta({ startingPrice, endingPrice, noColor }: PriceChartDeltaProps) {
  const delta = calculateDelta(startingPrice.close ?? startingPrice.value, endingPrice.close ?? endingPrice.value)

  return (
    <Text variant="body2">
      <DeltaArrow delta={delta} noColor={noColor} />
      <DeltaText delta={delta}>{formatDelta(delta)}</DeltaText>
    </Text>
  )
}

interface PriceChartProps {
  type: PriceChartType
  height: number
  data: PriceChartData[]
  stale: boolean
}

const TooltipContainer = styled.div<{ isCandlestick?: boolean }>`
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 12px;
  width: fit-content;
  z-index: 10000;
  position: absolute;
  top: 0;
  left: 0;
  transform: ${({ isCandlestick }) => 
    isCandlestick 
      ? 'translate(-50%, -100%)' // For candlestick: center on crosshair line, position above
      : 'translate(-50%, -100%)' // For line: center horizontally, position above
  };
  margin-top: -8px;
  pointer-events: none;
  transition: transform 0.1s ease-out;
  will-change: transform;
`

const TooltipContent = styled(Flex)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: rgba(255, 255, 255, 0.9);
  width: fit-content;
`

const TooltipRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  flex-shrink: 0;
`

const TooltipLabel = styled.span`
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
`

const TooltipValue = styled.span`
  font-feature-settings: 'tnum' on, 'lnum' on;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
`

function CandlestickTooltip({ data }: { data: PriceChartData }) {
  return (
    <TooltipContainer isCandlestick={true}>
      <TooltipContent>
        <TooltipRow>
          <TooltipLabel>Open</TooltipLabel>
          <TooltipValue>$ {formatNumber(data.open)}</TooltipValue>
        </TooltipRow>
        <TooltipRow>
          <TooltipLabel>High</TooltipLabel>
          <TooltipValue>$ {formatNumber(data.high)}</TooltipValue>
        </TooltipRow>
        <TooltipRow>
          <TooltipLabel>Low</TooltipLabel>
          <TooltipValue>$ {formatNumber(data.low)}</TooltipValue>
        </TooltipRow>
        <TooltipRow>
          <TooltipLabel>Close</TooltipLabel>
          <TooltipValue>$ {formatNumber(data.close)}</TooltipValue>
        </TooltipRow>
      </TooltipContent>
    </TooltipContainer>
  )
}

export function PriceChart({ data, height, type, stale }: PriceChartProps) {
  const lastPrice = data[data.length - 1]
  return (
    <Chart
      Model={PriceChartModel}
      params={useMemo(() => ({ data, type, stale }), [data, stale, type])}
      height={height}
      TooltipBody={type === PriceChartType.CANDLESTICK ? CandlestickTooltip : undefined}
      
    >
      {(crosshairData) => (
        <ChartHeader
          value={(crosshairData ?? lastPrice)?.value ?? (crosshairData ?? lastPrice)?.close}
          additionalFields={<PriceChartDelta startingPrice={data?.[0]} endingPrice={crosshairData ?? lastPrice} />}
          valueFormatterType={NumberType.FiatTokenPrice}
          time={crosshairData?.time}
        />
      )}
    </Chart>
  )
}
