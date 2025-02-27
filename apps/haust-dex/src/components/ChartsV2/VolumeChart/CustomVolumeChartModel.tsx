import { ChartModel, ChartModelParams } from 'components/ChartsV2/ChartModel'
import { CrosshairHighlightPrimitive } from 'components/ChartsV2/VolumeChart/CrosshairHighlightPrimitive'
import { CustomHistogramSeries } from 'components/ChartsV2/VolumeChart/custom-histogram-series'
import { CustomHistogramData, CustomHistogramSeriesOptions } from 'components/ChartsV2/VolumeChart/renderer'
import { BarPrice, DeepPartial, ISeriesApi } from 'lightweight-charts'

export type CustomVolumeChartModelParams = {
  colors: string[]
  headerHeight: number
  useThinCrosshair?: boolean
  isMultichainExploreEnabled?: boolean
  background?: string
}

// Custom volume chart model, uses stacked volume chart as base model
// Extensible to other volume charts (i.e. see VolumeChartModel for single-histogram volume chart implementation)
export class CustomVolumeChartModel<TDataType extends CustomHistogramData> extends ChartModel<TDataType> {
  protected series: ISeriesApi<'Custom'>
  private highlightBarPrimitive: CrosshairHighlightPrimitive
  private hoveredXPos: number | undefined

  constructor(chartDiv: HTMLDivElement, params: ChartModelParams<TDataType> & CustomVolumeChartModelParams) {
    super(chartDiv, params)

    this.series = this.api.addCustomSeries(
      new CustomHistogramSeries({
        colors: params.colors,
        isMultichainExploreEnabled: params.isMultichainExploreEnabled,
        background: params.background,
      }),
    )

    this.series.setData(this.data)

    // Add crosshair highlight bar
    this.highlightBarPrimitive = new CrosshairHighlightPrimitive({
      color: 'transparent',
      crosshairYPosition: params.headerHeight,
      useThinCrosshair: params.useThinCrosshair,
    })
    this.series.attachPrimitive(this.highlightBarPrimitive)

    this.updateOptions(params)
    this.fitContent()

    this.api.subscribeCrosshairMove((param) => {
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
          y = topOffset + (headerHeight * shift) + (shift * 25)
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
      }

      if (param?.point?.x !== this.hoveredXPos) {
        this.hoveredXPos = param?.point?.x
        this.series.applyOptions({
          hoveredXPos: this.hoveredXPos ?? -1,
        } as DeepPartial<CustomHistogramSeriesOptions>)
      }
    })
  }

  updateOptions(params: ChartModelParams<TDataType> & CustomVolumeChartModelParams, options?: any) {
    // Use stacked volume chart set-up options as default base options
    const stackedVolumeChartOptions = {
      localization: {
        locale: params.locale,
        priceFormatter: (price: BarPrice) =>
          params.format.formatFiatPrice({ price }),
      },
      rightPriceScale: {
        visible: false,
      },
      handleScale: false,
      handleScroll: false,
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        vertLine: {
          visible: true,
          labelVisible: false,
          color: params.theme.textTertiary,
          width: 1,
          style: 0,
        },
      },
      ...options,
    }

    super.updateOptions(params, stackedVolumeChartOptions)
    const { data } = params

    // Handles changes in data, e.g. time period selection
    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    this.series.applyOptions({
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      lastValueVisible: false,
    })

    this.series.priceScale().applyOptions({
      scaleMargins: {
        top: 0.3,
        bottom: 0,
      },
    })
  }
}
