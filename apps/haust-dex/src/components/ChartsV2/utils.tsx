import { TickMarkType, UTCTimestamp } from 'lightweight-charts'

/** Compatible with ISeriesApi<'Area' | 'Candlestick'> */
export enum PriceChartType {
  LINE = 'Line chart',
  CANDLESTICK = 'Candlestick',
}

export enum ChartType {
  PRICE = 'Price',
  VOLUME = 'Volume',
  TVL = 'TVL', // Locked value distributed by timestamp
  LIQUIDITY = 'Liquidity', // Locked value distributed by tick
}

export const CHART_TYPE_LABELS: Record<ChartType | PriceChartType, string> = {
  [ChartType.PRICE]: 'Price',
  [ChartType.VOLUME]: 'Volume',
  [ChartType.TVL]: 'Total Value Locked',
  [ChartType.LIQUIDITY]: 'Liquidity',
  [PriceChartType.LINE]: 'Line chart',
  [PriceChartType.CANDLESTICK]: 'Candlestick',
}

/**
 * Custom time formatter used to customize tick mark labels on the time scale.
 * Follows the function signature of lightweight-charts' TickMarkFormatter.
 */
// eslint-disable-next-line consistent-return
export function formatTickMarks(time: UTCTimestamp, tickMarkType: TickMarkType, locale: string): string {
  const date = new Date(time.valueOf() * 1000)
  switch (tickMarkType) {
    case TickMarkType.Year:
      return date.toLocaleString(locale, { year: 'numeric' })
    case TickMarkType.Month:
      return date.toLocaleString(locale, { month: 'short', year: 'numeric' })
    case TickMarkType.DayOfMonth:
      return date.toLocaleString(locale, { month: 'short', day: 'numeric' })
    case TickMarkType.Time:
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric' })
    case TickMarkType.TimeWithSeconds:
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric', second: '2-digit' })
  }
}
