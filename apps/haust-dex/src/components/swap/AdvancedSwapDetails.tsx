import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Card from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'

import { Separator, ThemedText } from '../../theme'
import { computeRealizedLPFeeAmount, computeRealizedPriceImpact } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip } from '../Tooltip'
import FormattedPriceImpact, { formatPriceImpact } from './FormattedPriceImpact'
import TradePrice from './TradePrice'
import { formatTransactionAmount } from 'utils/formatNumbers'
import InfoIcon from 'components/Icons/InfoIcon'
import { Pool } from '@uniswap/v3-sdk'

const StyledCard = styled(Card)`
  padding: 0;
`

const StyledInfoIcon = styled(InfoIcon)`
  display: flex;
  align-items: center;
`

interface AdvancedSwapDetailsProps {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  hideInfoTooltips?: boolean
  showFeeBreakdown?: boolean
  showRate?: boolean
  showBasicInfo?: boolean
}

function TextWithLoadingPlaceholder({
  syncing,
  width,
  children,
}: {
  syncing: boolean
  width: number
  children: JSX.Element
}) {
  return syncing ? (
    <LoadingRows>
      <div style={{ height: '15px', width: `${width}px` }} />
    </LoadingRows>
  ) : (
    children
  )
}

export function AdvancedSwapDetails({
  trade,
  allowedSlippage,
  syncing = false,
  hideInfoTooltips = false,
  showFeeBreakdown = false,
  showRate = false,
  showBasicInfo = true,
}: AdvancedSwapDetailsProps) {
  const theme = useTheme()

  const { priceImpact } = useMemo(() => {
    return {
      priceImpact: trade ? computeRealizedPriceImpact(trade) : undefined,
    }
  }, [trade])

  const liquidityProviderFee = computeRealizedLPFeeAmount(trade)

  return !trade ? null : (
    <StyledCard>
      <AutoColumn gap="sm">
        {showFeeBreakdown && (
          <>
            <RowBetween>
              <ThemedText.BodySmall style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.textSecondary }}>
                  Fee ({(trade.swaps[0].route.pools[0] as Pool).fee  / 10000}%)
                <MouseoverTooltip
                  text={
                    <Trans>
                      Fees are applied to ensure the best experience with Haust and have already been factored into this quote.
                    </Trans>
                  }
                  disableHover={hideInfoTooltips}
                >
                  <StyledInfoIcon />
                </MouseoverTooltip>
              </ThemedText.BodySmall>
              <ThemedText.BodySmall>
              {`${liquidityProviderFee?.toSignificant(6)} ${liquidityProviderFee?.currency?.symbol}`}
              </ThemedText.BodySmall>
            </RowBetween>
            <RowBetween>
              <ThemedText.BodySmall style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.textSecondary }}>
                <Trans>Network cost</Trans>
                <MouseoverTooltip
                  text={
                    <Trans>
                      This is the cost to process your transaction on the blockchain. Haust does not receive any share of these fees.
                    </Trans>
                  }
                  disableHover={hideInfoTooltips}
                >
                  <StyledInfoIcon />
                </MouseoverTooltip>
              </ThemedText.BodySmall>
              <ThemedText.BodySmall>
                {formatTransactionAmount(0.001)} ETH
              </ThemedText.BodySmall>
            </RowBetween>
          </>
        )}
        
        {showRate && (
          <>
            <RowBetween style={{ marginTop: '8px' }}>
              <RowFixed>
              <ThemedText.BodySmall style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.textSecondary }}>
                <Trans>Rate</Trans>
              </ThemedText.BodySmall>
            </RowFixed>
            <TradePrice price={trade.executionPrice} color={theme.textPrimary} fontSize="14px" />
          </RowBetween>
          </>
        )}
        
        {showBasicInfo && (
          <>
            <RowBetween>
              <RowFixed>
              <ThemedText.BodySmall style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.textSecondary }}>
                    <Trans>Order routing</Trans>
                    <MouseoverTooltip
                      text={
                        <Trans>
                          Most efficient route is estimated to cost in network costs.  This route considers split routes, multiple hops, and network costs of each step.
                        </Trans>
                      }
                      disableHover={hideInfoTooltips}
                    >
                    <StyledInfoIcon />
                  </MouseoverTooltip>
                  </ThemedText.BodySmall>
              </RowFixed>
              <ThemedText.BodySmall>
                  Haustoria API
              </ThemedText.BodySmall>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                  <ThemedText.BodySmall style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.textSecondary }}>
                    <Trans>Price Impact</Trans>
                    <MouseoverTooltip
                      text={
                        <Trans>
                          The impact your trade has on the market price of this pool.
                        </Trans>
                      }
                      disableHover={hideInfoTooltips}
                    >
                    <StyledInfoIcon />
                  </MouseoverTooltip>
                  </ThemedText.BodySmall>
              </RowFixed>
              <TextWithLoadingPlaceholder syncing={syncing} width={50}>
                <ThemedText.BodySmall>
                {priceImpact ? formatPriceImpact(priceImpact) : '-'}
                </ThemedText.BodySmall>
              </TextWithLoadingPlaceholder>
            </RowBetween>
            <RowBetween>
              <RowFixed style={{ marginRight: '20px' }}>
                  <ThemedText.BodySmall style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.textSecondary }}>
                      <Trans>Max slippage</Trans>
                      <MouseoverTooltip
                      text={
                        <Trans>
                         If the price slips any further, your transaction will revert. Below is the maximum amount you would need to spend. {' '}
                         {trade.tradeType === TradeType.EXACT_INPUT
                          ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
                          : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
                        </Trans>
                      }
                      disableHover={hideInfoTooltips}
                    >
                    <StyledInfoIcon />
                  </MouseoverTooltip>
                  </ThemedText.BodySmall>
              </RowFixed>
              <TextWithLoadingPlaceholder syncing={syncing} width={70}>
                <ThemedText.BodySmall>
                  {allowedSlippage.toFixed(2)}%{'  '}
                  <span style={{ color: theme.accentWarning }}>Auto</span>
                </ThemedText.BodySmall>
              </TextWithLoadingPlaceholder>
            </RowBetween>
          </>
        )}
      </AutoColumn>
    </StyledCard>
  )
}
