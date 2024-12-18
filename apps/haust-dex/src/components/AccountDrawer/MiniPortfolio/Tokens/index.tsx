import { NativeCurrency, Token } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/Delta'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { formatNumber, NumberType } from 'conedison/format'
import { TOKEN_ADDRESSES } from 'constants/tokens'
import { useDefaultActiveTokens } from 'hooks/Tokens'
import { useTokenBalance } from 'hooks/useTokenBalance'
import { useAtomValue } from 'jotai/utils'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'

import { useToggleAccountDrawer } from '../..'
import { hideSmallBalancesAtom } from '../../SmallBalanceToggle'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioTabWrapper } from '../PortfolioRow'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 0.1

export default function Tokens({ totalBalance }: { totalBalance?: number }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const tokens = useDefaultActiveTokens()
  const nativeCurrency = useNativeCurrency()

  const tokensList = [nativeCurrency, ...Object.values(tokens), TOKEN_ADDRESSES.WHAUST]
  console.log(totalBalance, 'totalBalance');
  
  if (!totalBalance && totalBalance === 0) {
    return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  }

  return (
    <PortfolioTabWrapper>
      {tokensList.map((token) => (
        token && <TokenRow 
          key={token instanceof Token ? token.address : token.symbol} 
          token={token} 
          hideSmallBalances={hideSmallBalances}
        />
      ))}
    </PortfolioTabWrapper>
  )
}

const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`

function TokenRow({ 
  token, 
  hideSmallBalances,
}: { 
  token: Token | NativeCurrency
  hideSmallBalances: boolean
}) {
  const balance = useTokenBalance(token)
  const tokenBalance = balance?.balance?.balance
  const percentChange = 0.0;

  if (hideSmallBalances && balance?.balance?.balance && Number(balance.balance.balance) < HIDE_SMALL_USD_BALANCES_THRESHOLD) {
    return null
  }

  return (
    <PortfolioRow
      left={<PortfolioLogo chainId={token.chainId} currencies={[token]} size="40px" />}
      title={<ThemedText.SubHeader fontSize='14px' fontWeight={500}>{token.name}</ThemedText.SubHeader>}
      descriptor={
        <TokenBalanceText fontSize='13px'>
          {token.symbol}
        </TokenBalanceText>
      }
      right={
        tokenBalance && (
          <><ThemedText.SubHeader  fontSize='13px' fontWeight={500}>
            {formatNumber(Number(tokenBalance), NumberType.TokenNonTx)}
          </ThemedText.SubHeader>
          <Row justify="flex-end">
              <DeltaArrow delta={percentChange} size={20} />
              <ThemedText.BodySecondary  fontSize='13px'>{formatDelta(percentChange)}</ThemedText.BodySecondary>
            </Row></>
        )
      }
    />
  )
}
