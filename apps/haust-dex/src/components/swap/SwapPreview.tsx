import { AutoColumn } from "components/Column"
import { RowBetween, RowFixed } from "components/Row"
import { ArrowDown } from "react-feather"
import styled, { useTheme } from "styled-components/macro"
import { TruncatedText } from "./styleds"
import { FiatValue } from "components/CurrencyInputPanel/FiatValue"
import CurrencyLogo from "components/Logo/CurrencyLogo"
import { useUSDPrice } from "hooks/useUSDPrice"
import { currencyAmountToPreciseFloat, formatTransactionAmount } from "utils/formatNumbers"
import { InterfaceTrade } from "state/routing/types"
import { Currency, TradeType } from "@uniswap/sdk-core"

const HeaderContainer = styled(AutoColumn)`
  margin-top: 16px;
`
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 12px;
  gap: 16px;
`

export function SwapPreview({
  trade,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
}) {
  const theme = useTheme()
  const fiatValueInput = useUSDPrice(trade.inputAmount)
  const fiatValueOutput = useUSDPrice(trade.outputAmount)

  return (
    <HeaderContainer gap="sm">
      <Wrapper>
        <AutoColumn gap="sm">
          <RowBetween>
            <AutoColumn gap="sm">
              <RowFixed>
                <TruncatedText
                  fontSize={24}
                  fontWeight={450}
                  data-testid="input-amount"
                >
                {Number(currencyAmountToPreciseFloat(trade.inputAmount)) > 9999 
                  ? formatTransactionAmount(Number(Number(currencyAmountToPreciseFloat(trade.inputAmount)).toFixed(2)))
                  : formatTransactionAmount(currencyAmountToPreciseFloat(trade.inputAmount))
                } {trade.inputAmount.currency.symbol}
                </TruncatedText>
              </RowFixed>
              <FiatValue fiatValue={fiatValueInput} color={theme.textSecondary} />
            </AutoColumn>
            <RowFixed gap="0px" style={{ alignSelf: 'center' }}>
              <CurrencyLogo currency={trade.inputAmount.currency} size="40px" />
            </RowFixed>
          </RowBetween>
        </AutoColumn>
        <ArrowDown size="20" color={theme.textSecondary} />
        <AutoColumn gap="sm">
          <RowBetween align="flex-end">
          <AutoColumn gap="sm">
            <RowFixed>
              <TruncatedText fontSize={24} fontWeight={450} data-testid="output-amount">
                {Number(currencyAmountToPreciseFloat(trade.outputAmount)) > 9999 
                  ? formatTransactionAmount(Number(Number(currencyAmountToPreciseFloat(trade.outputAmount)).toFixed(2)))
                  : formatTransactionAmount(currencyAmountToPreciseFloat(trade.outputAmount))
                } {trade.outputAmount.currency.symbol}
              </TruncatedText>
            </RowFixed>
            <FiatValue fiatValue={fiatValueOutput} color={theme.textSecondary}/>
            </AutoColumn>
            <RowFixed gap="0px">
              <CurrencyLogo currency={trade.outputAmount.currency} size="40px" />
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </Wrapper>
    </HeaderContainer>
  )
}
