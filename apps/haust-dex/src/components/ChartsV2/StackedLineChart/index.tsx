import { ChartHeader } from 'components/ChartsV2/ChartHeader'
import { Chart, ChartModel, ChartModelParams } from 'components/ChartsV2/ChartModel'
import { StackedAreaSeriesOptions } from 'components/ChartsV2/StackedLineChart/stacked-area-series/options'
import { StackedAreaSeries } from 'components/ChartsV2/StackedLineChart/stacked-area-series/stacked-area-series'
import {
  CustomStyleOptions,
  DeepPartial,
  ISeriesApi,
  LineStyle,
  Logical,
  UTCTimestamp,
  WhitespaceData,
} from 'lightweight-charts'
import { useMemo } from 'react'
import { useTheme } from 'styled-components/macro'

export interface StackedLineData extends WhitespaceData<UTCTimestamp> {
  values: number[]
}

interface TVLChartParams extends ChartModelParams<StackedLineData> {
  colors: string[]
  gradients?: { start: string; end: string }[]
  isMainChart: boolean
}

export class TVLChartModel extends ChartModel<StackedLineData> {
  protected series: ISeriesApi<'Custom'>
  private hoveredLogicalIndex: Logical | null | undefined
  private seriesOptions: DeepPartial<StackedAreaSeriesOptions>

  constructor(chartDiv: HTMLDivElement, params: TVLChartParams) {
    super(chartDiv, params)

    // Initialize default options
    this.seriesOptions = {
      priceLineVisible: false,
      lastValueVisible: false,
      lineWidth: 2.5,
      colors: params.colors,
      gradients: params.gradients,
    }

    this.series = this.api.addCustomSeries(new StackedAreaSeries(), this.seriesOptions)

    const style = document.createElement('style')
    style.textContent = `
      .tv-lightweight-charts a[href*="tradingview.com"] {
        display: none !important;
      }
    `
    document.head.appendChild(style)
  
    this.series.setData(this.data)
    this.updateOptions(params)
    this.fitContent()

    this.api.subscribeCrosshairMove((param) => {
      if (!param?.point) {
        // Mouse left the chart area - reset everything
        this.hoveredLogicalIndex = undefined
        
        // Reset crosshair position
        chartDiv.style.setProperty('--crosshair-x', '0px')
        chartDiv.style.setProperty('--legend-y', '10px')

        // Save current margins
        const currentScaleMargins = this.api.priceScale('right').options().scaleMargins

        // Update price scale options directly
        this.api.priceScale('right').applyOptions({
          scaleMargins: currentScaleMargins
        })

        // Remove and recreate series
        this.api.removeSeries(this.series)
        this.series = this.api.addCustomSeries(new StackedAreaSeries(), {
          ...this.seriesOptions,
          priceScaleId: 'right'
        })
        this.series.setData(this.data)
        this.api.timeScale().fitContent()
        return
      }

      if (param?.point && param?.time) {
        const topOffset = 32
        let y = topOffset

        const legendElement = chartDiv.querySelector('.protocol-legend')
        const chartRect = chartDiv.getBoundingClientRect()
        const headerHeight = document.querySelector('#chart-header-value')?.getBoundingClientRect().height ?? 0
        
        const headerWidth = chartRect.width * 0.3
        const transitionZone = 100
        
        if (param.point.x < headerWidth + transitionZone) {
          const shift = Math.min(1, (headerWidth + transitionZone - param.point.x) / transitionZone)
          y = topOffset + (headerHeight * shift) + (shift * 10)
        }

        requestAnimationFrame(() => {
          const legendWidth = legendElement?.getBoundingClientRect().width ?? 0
          const halfLegendWidth = legendWidth / 2
          
          const x = Math.max(
            halfLegendWidth, 
            Math.min(chartRect.width - halfLegendWidth, param?.point?.x ?? 0)
          )
          
          chartDiv.style.setProperty('--crosshair-x', `${x}px`)
          chartDiv.style.setProperty('--legend-y', `${y}px`)
        })

        if (param.logical !== this.hoveredLogicalIndex) {
          this.hoveredLogicalIndex = param?.logical
          this.series.applyOptions({
            hoveredLogicalIndex: this.hoveredLogicalIndex,
            hoverStyle: {
              showPoint: true,
            }
          } as DeepPartial<StackedAreaSeriesOptions>)
        }
      }
    })
  }

  updateOptions(params: TVLChartParams) {
    const isSingleLineChart = !params.isMainChart

    const gridSettings = isSingleLineChart
      ? {
          grid: {
            vertLines: { style: LineStyle.SparseDotted, color: params.theme.accentActiveSoft },
            horzLines: { style: LineStyle.Dotted, color: params.theme.accentFailure },
          },
        }
      : {}

    super.updateOptions(params, {
      handleScale: false,
      handleScroll: false,
      rightPriceScale: {
        visible: isSingleLineChart, // Hide pricescale on multi-line charts
        borderVisible: false,
        scaleMargins: {
          top: 0.25,
          bottom: 0,
        },
        autoScale: true,
      },
      ...gridSettings,
    })
    const { data, colors, gradients } = params

    // Handles changes in data, e.g. time period selection
    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    // Update stored options
    this.seriesOptions = {
      priceLineVisible: false,
      lastValueVisible: false,
      colors,
      gradients,
      lineWidth: 2.5,
    }
    
    this.series.applyOptions(this.seriesOptions)
  }
}

interface LineChartProps {
  height: number
  sources?: any[]
  data: StackedLineData[]
  stale: boolean
}

export function LineChart({ height, data, sources, stale }: LineChartProps) {
  const theme = useTheme()

  const params = useMemo(() => {
    const colors = [theme.accentAction]
    return { data, colors, stale, isMainChart: false }
  }, [data, theme, stale])

  const lastEntry = data[data.length - 1]
  return (
    <Chart Model={TVLChartModel} params={params} height={height}>
      {(crosshairData: StackedLineData | undefined) => (
        <ChartHeader
          value={(crosshairData ?? lastEntry)?.values.reduce((v, sum) => (sum += v), 0)}
          time={crosshairData?.time}
          protocolData={sources?.map((source, index) => ({ protocol: source, value: crosshairData?.values[index] }))}
        />
      )}
    </Chart>
  )
}
