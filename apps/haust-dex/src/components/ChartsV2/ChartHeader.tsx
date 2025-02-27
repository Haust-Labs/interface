import { useHeaderDateFormatter } from 'components/ChartsV2/hooks'
import { Flex } from 'components/layout/Flex'
import { Text } from 'components/Text/Text'
import { formatNumber, NumberType } from 'conedison/format'
import { UTCTimestamp } from 'lightweight-charts'
import { ReactElement, ReactNode } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { ThemeColors } from 'theme/colors'

export type ChartHeaderProtocolInfo = { protocol: any; value?: number }

export enum PriceSource {
  SubgraphV2 = 'V2',
  SubgraphV3 = 'V3',
  SubgraphV4 = 'V4'
}

type ProtocolMeta = { name: string; color: keyof ThemeColors; gradient: { start: string; end: string } }
const PROTOCOL_META: { [source in PriceSource]: ProtocolMeta } = {
  [PriceSource.SubgraphV2]: {
    name: 'v2',
    color: 'accentAction',
    gradient: { start: 'rgba(96, 123, 238, 0.20)', end: 'rgba(55, 70, 136, 0.00)' },
  },
  [PriceSource.SubgraphV3]: {
    name: 'v3',
    color: 'accentActiveSoft',
    gradient: { start: 'rgba(252, 116, 254, 0.20)', end: 'rgba(252, 116, 254, 0.00)' },
  },
  [PriceSource.SubgraphV4]: {
    name: 'v4',
    color: 'accentActive', // TODO(WEB-4618): update the colors when they are available
    gradient: { start: 'rgba(252, 116, 254, 0.20)', end: 'rgba(252, 116, 254, 0.00)' },
  },
  /* [PriceSource.UniswapX]: { name: 'UniswapX', color: purple } */
}

export function getProtocolName(priceSource: PriceSource): string {
  return PROTOCOL_META[priceSource].name
}

export function getProtocolColor(priceSource: PriceSource, theme: ThemeColors): string {
  return theme[PROTOCOL_META[priceSource].color]
}

const ProtocolLegendWrapper = styled(Flex)`
  position: absolute;
  pointer-events: none;
  background-color: ${({ theme }) => theme.backgroundModule};
  padding: 8px;
  gap: 6px;
  border-radius: 12px;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.02), 0px 1px 6px 2px rgba(0, 0, 0, 0.03);
  z-index: 4;
  left: var(--crosshair-x);
  top: var(--legend-y);
  transform: translate(-50%, -100%);
  will-change: transform, left, top;
`

interface ColorBlipProps {
  $backgroundColor: string;
}

const ColorBlip = styled(Flex)<ColorBlipProps>`
  align-self: center;
  border-radius: 4px;
  width: 12px;
  height: 12px;
  background-color: ${({ $backgroundColor }) => $backgroundColor};
`

function ProtocolLegend({ protocolData }: { protocolData?: ChartHeaderProtocolInfo[] }) {
  const theme = useTheme()

  return (
    <ProtocolLegendWrapper className="protocol-legend">
      {protocolData
        ?.map(({ value, protocol }) => {
          const display = value
            ? formatNumber(value, NumberType.ChartFiatValue)
            : null
          return (
            !!display && (
              <Flex
                row
                gap="8px"
                justifyContent="flex-end"
                key={protocol + '_blip'}
                width="max-content"
              >
                  <Text variant="body3" color={theme.textSecondary}>
                    {getProtocolName(protocol)}
                  </Text>                
                  <ColorBlip $backgroundColor={getProtocolColor(protocol, theme)} />
                  <Text variant="body3" color={theme.textPrimary}>
                    {display}
                  </Text>
              </Flex>
            )
          )
        })
        .reverse()}
    </ProtocolLegendWrapper>
  )
}

interface HeaderValueDisplayProps {
  /** The number to be formatted and displayed, or the ReactElement to be displayed */
  value?: number | ReactElement
  /** Used to override default format NumberType (ChartFiatValue) */
  valueFormatterType?: NumberType
}

function HeaderValueDisplay({ value, valueFormatterType = NumberType.ChartFiatValue }: HeaderValueDisplayProps) {
  const theme = useTheme()
  if (typeof value !== 'number' && typeof value !== 'undefined') {
    return <>{value}</>
  }

  return (
    <Text color={theme.textPrimary} variant="heading2Bolder">
      {formatNumber(value, valueFormatterType)}
    </Text>
  )
}

interface HeaderTimeDisplayProps {
  time?: UTCTimestamp
  /** Optional string to display when time is undefined */
  timePlaceholder?: string
}

function HeaderTimeDisplay({ time, timePlaceholder }: HeaderTimeDisplayProps) {
  const headerDateFormatter = useHeaderDateFormatter()
  return (
    <ThemedText.SubHeaderSmall id="chart-header-time">{time ? headerDateFormatter(time) : timePlaceholder}</ThemedText.SubHeaderSmall>
  )
}

interface ChartHeaderProps extends HeaderValueDisplayProps, HeaderTimeDisplayProps {
  protocolData?: ChartHeaderProtocolInfo[]
  additionalFields?: ReactNode
}

export function ChartHeader({
  value,
  valueFormatterType,
  time,
  timePlaceholder,
  protocolData,
  additionalFields,
}: ChartHeaderProps) {
  const isHovered = !!time

  return (
    <Flex
      row
      position="absolute"
      width="100%"
      gap="8px"
      alignItems="flex-start"
      id="chart-header"
    >
      <Flex position="absolute" gap="4px" width="70%" id="chart-header-value">
        <HeaderValueDisplay value={value} valueFormatterType={valueFormatterType} />
        <Flex row gap="8px">
          {additionalFields}
          <HeaderTimeDisplay time={time} timePlaceholder={timePlaceholder} />
        </Flex>
      </Flex>
      {(isHovered && protocolData) && <ProtocolLegend protocolData={protocolData} />}
    </Flex>
  )
}
