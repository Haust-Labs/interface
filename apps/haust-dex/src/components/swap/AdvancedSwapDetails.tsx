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
import FormattedPriceImpact from './FormattedPriceImpact'

const StyledCard = styled(Card)`
  padding: 0;
`

interface AdvancedSwapDetailsProps {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  hideInfoTooltips?: boolean
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
}: AdvancedSwapDetailsProps) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()

  const { expectedOutputAmount, priceImpact } = useMemo(() => {
    return {
      expectedOutputAmount: trade?.outputAmount,
      priceImpact: trade ? computeRealizedPriceImpact(trade) : undefined,
    }
  }, [trade])

  const liquidityProviderFee = computeRealizedLPFeeAmount(trade)

  return !trade ? null : (
    <StyledCard>
      <AutoColumn gap="sm">
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  The amount you expect to receive at the current market price. You may receive less or more if the
                  market price changes while your transaction is pending.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Expected Output</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={65}>
            <ThemedText.BodySecondary textAlign="right" fontSize={14}>
              {expectedOutputAmount
                ? `${expectedOutputAmount.toSignificant(6)}  ${expectedOutputAmount.currency.symbol}`
                : '-'}
            </ThemedText.BodySecondary>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={<Trans>The impact your trade has on the market price of this pool.</Trans>}
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Price Impact</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={50}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              <FormattedPriceImpact priceImpact={priceImpact} />
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <Separator />
        <RowBetween>
          <RowFixed style={{ marginRight: '20px' }}>
            <MouseoverTooltip
              text={
                <Trans>
                  The minimum amount you are guaranteed to receive. If the price slips any further, your transaction
                  will revert.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
                {trade.tradeType === TradeType.EXACT_INPUT ? (
                  <Trans>Minimum received</Trans>
                ) : (
                  <Trans>Maximum sent</Trans>
                )}{' '}
                <Trans>after slippage</Trans> ({allowedSlippage.toFixed(2)}%)
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
                : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        {!liquidityProviderFee ? null : (
          <RowBetween>
            <MouseoverTooltip
              text={
                <Trans>
                  Fees are applied to ensure the best experience with Haust and have already been factored into this quote.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
                <Trans>Liquidity provider fee</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
            <TextWithLoadingPlaceholder syncing={syncing} width={50}>
              <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
              {`${liquidityProviderFee?.toSignificant(6)} ${liquidityProviderFee?.currency?.symbol}`}
              </ThemedText.DeprecatedBlack>
            </TextWithLoadingPlaceholder>
          </RowBetween>
        )}
      </AutoColumn>
    </StyledCard>
  )
}
