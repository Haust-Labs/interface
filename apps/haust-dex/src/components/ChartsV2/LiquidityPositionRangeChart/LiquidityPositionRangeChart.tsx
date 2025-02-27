// eslint-disable-next-line no-restricted-imports

import { Flex, FlexProps } from "components/layout/Flex";
import { assertWebElement, Chart, ChartModel, ChartModelParams, DEFAULT_BOTTOM_PRICE_SCALE_MARGIN, DEFAULT_TOP_PRICE_SCALE_MARGIN } from "../ChartModel";
import { PriceChartData } from "../PriceChart";
import { formatTickMarks, PriceChartType } from "../utils";
import { PositionStatus } from "pages/Pool/PositionHeader";
import { Currency, CurrencyAmount, Price } from "@uniswap/sdk-core";
import { CrosshairMode, ISeriesApi, LineStyle, LineType, UTCTimestamp } from "lightweight-charts";
import { BandsIndicator } from "../BandsIndicator/bands-indicator";
import { opacify } from "theme/utils";
import { cloneReadonly } from "../BandsIndicator/helpers/simple-clone";
import { SupportedChainId } from "constants/chains";
import { HistoryDuration } from "../VolumeChart";
import { getChainInfo } from "constants/chainInfo";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "styled-components";
import usePoolPriceChartDataQuery from "graphql/thegraph/PoolPriceChartData";

const CHART_HEIGHT = 52
export const CHART_WIDTH = 224

const pulseKeyframe = `
  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.4;
    }
    100% {
      transform: translate(-50%, -50%) scale(4);
      opacity: 0;
    }
  }
`

function getCrosshairProps(
  color: any,
  { yCoordinate, xCoordinate }: { yCoordinate: number; xCoordinate: number },
): any {
  return {
    position: 'absolute',
    left: xCoordinate - 3,
    top: yCoordinate - 3, // Center the crosshair vertically on the price line.
    width: '6px',
    height: '6px',
    borderRadius: '$roundedFull',
    backgroundColor: color,
  }
}

function isEffectivelyInfinity(value: number): boolean {
  return Math.abs(value) >= 1e20 || Math.abs(value) <= 1e-20
}

interface LPPriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType.LINE
  // Optional, used to calculate the color of the price line.
  positionStatus?: PositionStatus
  // If defined these will be used to draw a range band on the chart.
  positionPriceLower?: Price<Currency, Currency> | number
  positionPriceUpper?: Price<Currency, Currency> | number
  // These callbacks provide information to the parent component.
  setCrosshairCoordinates?: ({ x, y }: { x: number; y: number }) => void
  setBoundaryPrices?: (price: [number, number]) => void
  // Color of the price data line,
  color?: string
  // Color of the current price dotted line.
  currentPriceLineColor?: string
  // Total height of the chart, including the time axis pane if showXAxis is true.
  height: number
  showXAxis?: boolean
  // Controls the vertical margins of the price scale. Defaults are define in ChartModel.
  priceScaleMargins?: {
    top: number
    bottom: number
  }
  minVisiblePrice?: number
  maxVisiblePrice?: number
  disableExtendedTimeScale?: boolean
}

export class LPPriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area'>
  private rangeBandSeries?: ISeriesApi<'Line'>
  private extendedData?: PriceChartData[]
  private positionRangeMin: number
  private positionRangeMax: number

  constructor(chartDiv: HTMLDivElement, params: LPPriceChartModelParams) {
    super(chartDiv, params)
    this.positionRangeMin =
      typeof params.positionPriceLower === 'number'
        ? params.positionPriceLower
        : Number(
            params.positionPriceLower
              ?.quote(
                CurrencyAmount.fromRawAmount(
                  params.positionPriceLower.baseCurrency,
                  Math.pow(10, params.positionPriceLower.baseCurrency.decimals),
                ),
              )
              ?.toSignificant(params.positionPriceLower.baseCurrency.decimals || 6) ?? 0,
          )
    this.positionRangeMax =
      typeof params.positionPriceUpper === 'number'
        ? params.positionPriceUpper
        : Number(
            params.positionPriceUpper
              ?.quote(
                CurrencyAmount.fromRawAmount(
                  params.positionPriceUpper.baseCurrency,
                  Math.pow(10, params.positionPriceUpper.baseCurrency.decimals),
                ),
              )
              ?.toSignificant(params.positionPriceUpper.baseCurrency.decimals || 6) ?? 0,
          )

    if (isEffectivelyInfinity(this.positionRangeMin)) {
      this.positionRangeMin = 0
    }
    if (isEffectivelyInfinity(this.positionRangeMax)) {
      this.positionRangeMax = Number.MAX_SAFE_INTEGER
    }

    // Price history (primary series)
    this.series = this.api.addAreaSeries()
    this.series.setData(this.data)

    this.extendedData = LPPriceChartModel.generateExtendedData(this.data, params.disableExtendedTimeScale)
    this.rangeBandSeries = this.api.addLineSeries()
    // The price values in the data are ignored by this Series,
    // it only uses the time values to make the BandsIndicator work.
    this.rangeBandSeries.setData(this.extendedData)
    this.rangeBandSeries.applyOptions({
      priceLineVisible: false,
      color: 'transparent',
    })

    if (params.positionPriceLower !== undefined && params.positionPriceUpper !== undefined) {
      const bandIndicator = new BandsIndicator({
        lineColor: opacify(60, params.theme.neutralBorder),
        fillColor: opacify(40, params.theme.neutralBorder),
        lineWidth: 1,
        upperValue: this.positionRangeMax,
        lowerValue: this.positionRangeMin,
      })
      this.rangeBandSeries.attachPrimitive(bandIndicator)
    }

    this.updateOptions(params)
    this.fitContent()
    this.overrideCrosshair(params)
  }

  updateOptions(params: LPPriceChartModelParams): void {
    // Handle changes in data
    if (this.data !== params.data) {
      this.data = params.data
      this.series.setData(this.data)
      this.extendedData = LPPriceChartModel.generateExtendedData(this.data, params.disableExtendedTimeScale)
      this.rangeBandSeries?.setData(this.extendedData)
      this.fitContent()
      this.overrideCrosshair(params)
    }

    super.updateOptions(params, {
      rightPriceScale: {
        visible: false,
        autoScale: true,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: params.showXAxis ?? false,
        borderVisible: false,
        tickMarkFormatter: formatTickMarks,
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        mode: CrosshairMode.Hidden,
        vertLine: {
          color: 'transparent',
        },
        horzLine: {
          color: 'transparent',
        },
      },
    })

    const autoscaleInfoProvider = (original: () => any) => {
      const res = original()
      if (params.minVisiblePrice && params.maxVisiblePrice) {
        return {
          ...res,
          priceRange: {
            minValue: params.minVisiblePrice,
            maxValue: params.maxVisiblePrice,
          },
        }
      }
      return res
    }

    // Re-set options that depend on data.
    const priceLineColor = LPPriceChartModel.getPriceLineColor(params)
    this.series.applyOptions({
      priceLineVisible: true,
      priceLineStyle: LineStyle.SparseDotted,
      priceLineColor: params.currentPriceLineColor ?? priceLineColor,
      lineType: this.data.length < 20 ? LineType.WithSteps : LineType.Curved,
      lineWidth: 2,
      lineColor: priceLineColor,
      topColor: 'transparent',
      bottomColor: 'transparent',
      autoscaleInfoProvider,
    })

    this.series.priceScale().applyOptions({
      scaleMargins: params.priceScaleMargins ?? {
        top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
        bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
      },
    })
    this.rangeBandSeries?.applyOptions({
      autoscaleInfoProvider,
    })

    // Report the min/max price ticks of this chart to the parent
    requestAnimationFrame(() => {
      if (params.setBoundaryPrices) {
        const maxPrice = this.series.coordinateToPrice(0)
        const minPrice = this.series.coordinateToPrice(params.height)
        params.setBoundaryPrices([minPrice as number, maxPrice as number])
      }
    })
  }

  public static getPriceLineColor(params: Pick<LPPriceChartModelParams, 'color' | 'positionStatus' | 'theme'>): string {
    if (params.color) {
      return params.color
    }
    switch (params.positionStatus) {
      case PositionStatus.OUT_OF_RANGE:
        return params.theme.accentCritical
      case PositionStatus.IN_RANGE:
        return params.theme.accentSuccess
      case PositionStatus.CLOSED:
      default:
        return params.theme.accentAction
    }
  }

  private overrideCrosshair(params: LPPriceChartModelParams): void {
    const lastDataPoint = this.data[this.data.length - 1]
    if (!lastDataPoint) {
      console.log('No last data point found')
      return
    }

    requestAnimationFrame(() => {
      const xCoordinate = this.api.timeScale().timeToCoordinate(lastDataPoint.time)
      const yCoordinate = this.series.priceToCoordinate(lastDataPoint.value)
      
      // Make sure we're getting valid coordinates
      if (xCoordinate === null || yCoordinate === null) return

      // Adjust coordinates based on chart dimensions
      const adjustedY = Math.max(0, Math.min(yCoordinate, params.height))
      
      console.log('Chart coordinates debug:', {
        lastDataPoint,
        raw: { x: xCoordinate, y: yCoordinate },
        adjusted: { x: xCoordinate, y: adjustedY },
      })
      params.setCrosshairCoordinates?.({ x: Number(xCoordinate), y: Number(adjustedY) })
    })
  }

  private static generateExtendedData(
    data: PriceChartData[],
    disableExtendedTimeScale = false,
  ): PriceChartData[] {
    if (disableExtendedTimeScale) {
      return data
    }
    const lastTime = data[data.length - 1]?.time
    if (!lastTime) {
      return data
    }
    const timeDelta = lastTime - data[0]?.time
    const timeIncrement = timeDelta / data.length

    if (timeIncrement === 0) {
      return data
    }

    const newData = cloneReadonly(data)
    const lastData = newData[newData.length - 1]

    for (let i = 1; i <= Math.floor(data.length / 10); i++) {
      const time = lastTime + timeIncrement * i
      newData.push({
        ...lastData,
        time: time as UTCTimestamp,
      })
    }
    
    return newData
  }
}

interface LiquidityPositionRangeChartProps {
  poolAddressOrId: string
  chainId: SupportedChainId
  currency0: Currency
  currency1: Currency
  positionStatus?: PositionStatus
  priceOrdering: {
    base?: Currency
    priceLower?: Price<Currency, Currency>
    priceUpper?: Price<Currency, Currency>
  }
  width?: number | string
  grow?: boolean
}
  
function usePoolPriceChartData(tokenId: string) {
  const { data, isLoading } = usePoolPriceChartDataQuery(
    tokenId.toLowerCase(),
    1000
  )
  return {
    entries: data,
    loading: isLoading,
    dataQuality: 'HIGH' as const,
  }
}

export function LiquidityPositionRangeChart({
  currency0,
  currency1,
  poolAddressOrId,
  chainId,
  positionStatus,
  priceOrdering,
  width = CHART_WIDTH,
  grow = false,
}: LiquidityPositionRangeChartProps) {
  const theme = useTheme()
  const sortedCurrencies = [currency0, currency1]
  const priceData = usePoolPriceChartData(poolAddressOrId)

  const [crosshairCoordinates, setCrosshairCoordinates] = useState<{ x: number; y: number }>()

  const chartParams = useMemo(() => {
    const invertPrices = priceOrdering.base?.equals(sortedCurrencies[0])
    return {
      data: priceData.entries?.pool?.poolDayData as any ?? [],
      type: PriceChartType.LINE,
      color: LPPriceChartModel.getPriceLineColor({ positionStatus, theme }),
      positionPriceLower: invertPrices ? priceOrdering.priceLower?.invert() : priceOrdering.priceLower,
      positionPriceUpper: invertPrices ? priceOrdering.priceUpper?.invert() : priceOrdering.priceUpper,
      height: CHART_HEIGHT,
      showXAxis: false,
      setCrosshairCoordinates,
    } as const
  }, [
    priceOrdering.base,
    priceOrdering.priceLower,
    priceOrdering.priceUpper,
    sortedCurrencies,
    priceData.entries,
    priceData.dataQuality,
    theme,
    positionStatus,
  ])

  const dataUnavailable = priceData.entries.pool?.poolDayData.length === 0 && !priceData.loading

  const frameRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState<number | undefined>(undefined)
  const hasChartWidth = (grow && !!chartWidth) || !grow
  const shouldRenderChart = !dataUnavailable && hasChartWidth
  const shouldRenderCrosshair =
    shouldRenderChart &&
    !priceData.loading &&
    crosshairCoordinates?.y &&
    crosshairCoordinates.y > 5 &&
    crosshairCoordinates.x

  useLayoutEffect(() => {
    if (frameRef.current) {
      assertWebElement(frameRef.current)
      setChartWidth(frameRef.current.clientWidth)
    }
  }, [])

  return (
    <Flex
      grow={grow}
      ref={frameRef}
      style={{ position: 'relative' }}
    >
      <style>
        {`
          ${pulseKeyframe}
          #tv-attr-logo {
            display: none !important;
          }
        `}
      </style>
      {shouldRenderChart && (
        <Flex>
          <Chart 
            Model={LPPriceChartModel as any}
            params={chartParams}
            height={CHART_HEIGHT}
          />
        </Flex>
      )}
      {shouldRenderCrosshair && (
        <>
          <div style={{
            position: 'absolute',
            left: `${crosshairCoordinates.x}px`,
            top: `${crosshairCoordinates.y}px`,
            width: '6px',
            height: '6px',
            backgroundColor: LPPriceChartModel.getPriceLineColor({ positionStatus, theme }),
            borderRadius: '50%',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)',
          }} />
          <div style={{
            position: 'absolute',
            left: `${crosshairCoordinates.x}px`,
            top: `${crosshairCoordinates.y}px`,
            width: '12px',
            height: '12px',
            backgroundColor: LPPriceChartModel.getPriceLineColor({ positionStatus, theme }),
            borderRadius: '50%',
            zIndex: 999,
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 2s ease-out infinite',
            opacity: 0.4
          }} />
        </>
      )}
    </Flex>
  )
}
