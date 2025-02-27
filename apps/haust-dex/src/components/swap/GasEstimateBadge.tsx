import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
// import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'
import { ResponsiveTooltipContainer } from './styleds'
import SwapRoute from './SwapRoute'

const GasWrapper = styled(RowFixed)`
  border-radius: 8px;
  padding: 4px 6px;
  height: 24px;
  color: ${({ theme }) => theme.textTertiary};
  background-color: ${({ theme }) => theme.deprecated_bg1};
  font-size: 14px;
  font-weight: 500;
  user-select: none;
`
const StyledGasIcon = styled(GasIcon)`
  margin-right: 4px;
  height: 14px;
  & > * {
    stroke: ${({ theme }) => theme.textTertiary};
  }
`

export default function GasEstimateBadge({
  trade,
  loading,
  disableHover,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined | null // dollar amount in active chain's stablecoin
  loading: boolean
  disableHover?: boolean
}) {
  const formattedGasPriceString = trade?.gasUseEstimateUSD
    ? trade.gasUseEstimateUSD.toFixed(2) === '0.00'
      ? '<$0.01'
      : '$' + trade.gasUseEstimateUSD.toFixed(2)
    : undefined

  return (
    <MouseoverTooltip
      text={
        <Trans>
          This is the cost to process your transaction on the blockchain. Haust does not receive any share of these fees.
        </Trans>
      }
      disableHover={disableHover}
    >
      <LoadingOpacityContainer $loading={loading}>
        <GasWrapper>
          <StyledGasIcon />
          {formattedGasPriceString ?? null}
        </GasWrapper>
      </LoadingOpacityContainer>
    </MouseoverTooltip>
  )
}
