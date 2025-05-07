import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { formatCurrencyAmount, formatNumber, formatUSDPrice, NumberType } from 'conedison/format'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { isSupportedChain } from 'constants/chains'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { useTokenBalance } from 'hooks/useTokenBalance'
import { useUSDPrice } from 'hooks/useUSDPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const BalancesCard = styled.div`
  border-radius: 16px;
  color: ${({ theme }) => theme.textPrimary};
  display: none;
  height: fit-content;
  width: 100%;

  // 768 hardcoded to match NFT-redesign navbar breakpoints
  // src/nft/css/sprinkles.css.ts
  // change to match theme breakpoints when this navbar is updated
  @media screen and (min-width: 768px) {
    display: flex;
  }
`
const BalanceSection = styled.div`
  height: fit-content;
  width: 100%;
`
const BalanceRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  margin-top: 20px;
`
const BalanceItem = styled.div`
  display: flex;
  align-items: center;
`

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 8px;
  flex: 1;
`

const BalanceAmountsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const StyledNetworkLabel = styled.div`
  font-size: 12px;
  line-height: 16px;
`

export default function BalanceSummary({ token }: { token: Currency }) {
  const { account } = useWeb3React()
  const theme = useTheme()
  const balance = useTokenBalance(token)
  const formattedBalanceUSD = formatUSDPrice(balance.balance?.balanceUSD, NumberType.FiatTokenPrice)
  const formattedBalance = formatNumber(balance.balance?.balance, NumberType.TokenNonTx)

  if (!account || !balance) {
    return null
  }
  return (
    <BalancesCard>
      <BalanceSection>
        <ThemedText.SubHeaderSmall color={theme.textPrimary} fontSize={20}>
          <Trans>Your balance</Trans>
        </ThemedText.SubHeaderSmall>
        <BalanceRow>
          <CurrencyLogo currency={token} size="2rem" hideL2Icon={false} />
          <BalanceContainer>
            <BalanceAmountsContainer>
              <BalanceItem> 
                <ThemedText.BodyPrimary>{formattedBalanceUSD}</ThemedText.BodyPrimary>
              </BalanceItem>
              <BalanceItem>
              <ThemedText.SubHeader>
                  {formattedBalance}
                </ThemedText.SubHeader>
              </BalanceItem>
            </BalanceAmountsContainer>
          </BalanceContainer>
        </BalanceRow>
      </BalanceSection>
    </BalancesCard>
  )
}
