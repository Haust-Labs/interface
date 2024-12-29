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
import { useEffect, useState, useMemo } from 'react'

import { useToggleAccountDrawer } from '../..'
import { hideSmallBalancesAtom } from '../../SmallBalanceToggle'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 0

const SkeletonOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: ${({ theme }) => theme.backgroundModule};
`

export default function Tokens({ totalBalance }: { totalBalance?: number }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const tokens = useDefaultActiveTokens()
  const nativeCurrency = useNativeCurrency()
  const [isLoading, setIsLoading] = useState(true)

  const tokensList = useMemo(() => 
    [nativeCurrency, ...Object.values(tokens), TOKEN_ADDRESSES.WHAUST],
    [nativeCurrency, tokens]
  )
  
  const [loadedTokens, setLoadedTokens] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    const validTokensCount = tokensList.filter(Boolean).length
    setIsLoading(loadedTokens.size < validTokensCount)
  }, [loadedTokens, tokensList])

  if (!totalBalance && totalBalance === 0) {
    return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  }

  return (
    <PortfolioTabWrapper style={{ position: 'relative' }}>
      {isLoading && (
        <SkeletonOverlay>
          <PortfolioSkeleton />
        </SkeletonOverlay>
      )}
      {tokensList.map((token) => (
        token && <TokenRow 
          key={token instanceof Token ? token.address : token.symbol} 
          token={token} 
          hideSmallBalances={hideSmallBalances}
          onLoaded={(tokenId) => setLoadedTokens(prev => new Set([...prev, tokenId]))}
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
  onLoaded,
}: { 
  token: Token | NativeCurrency
  hideSmallBalances: boolean 
  onLoaded: (tokenId: string) => void
}) {
  const { balance, refetch } = useTokenBalance(token)
  const tokenBalance = balance?.balance
  const percentChange = 0.0;
  const [isTokenLoaded, setIsTokenLoaded] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      refetch?.()
    }, 5000)
    return () => clearInterval(interval)
  }, [refetch])

  useEffect(() => {
    if (!isTokenLoaded && balance !== undefined && tokenBalance !== undefined) {
      setIsTokenLoaded(true)
      onLoaded((token instanceof Token ? token.address : token.symbol) as string)
    }
  }, [balance, tokenBalance, isTokenLoaded, token, onLoaded])

  if (!isTokenLoaded) {
    return <PortfolioSkeleton />
  }

  if (hideSmallBalances && balance?.balance && Number(balance.balance) <= HIDE_SMALL_USD_BALANCES_THRESHOLD) {
    return null
  }

  return (
    <PortfolioRow
      left={<PortfolioLogo chainId={token.chainId} currencies={[token]} size="40px" />}
      title={<ThemedText.SubHeader fontSize='14px' fontWeight={500}>{token.name}</ThemedText.SubHeader>}
      descriptor={
        <TokenBalanceText fontSize='13px'>
          {formatNumber(tokenBalance, NumberType.TokenNonTx)}{' '}
          {token.symbol}
        </TokenBalanceText>
      }
      right={
        tokenBalance && (
          <><ThemedText.SubHeader fontSize='13px' fontWeight={500}>
            {formatNumber(Number(balance?.balanceUSD), NumberType.PortfolioBalance)}
          </ThemedText.SubHeader>
          <Row justify="flex-end">
              <DeltaArrow delta={percentChange} size={20} />
              <ThemedText.BodySecondary fontSize='13px'>{formatDelta(percentChange)}</ThemedText.BodySecondary>
            </Row></>
        )
      }
    />
  )
}
