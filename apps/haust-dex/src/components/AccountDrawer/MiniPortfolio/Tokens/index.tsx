import { NativeCurrency, Token } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/Delta'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { formatNumber, NumberType } from 'conedison/format'
import { useDefaultActiveTokens } from 'hooks/Tokens'
import { useTokenBalance } from 'hooks/useTokenBalance'
import { useAtomValue } from 'jotai/utils'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useEffect, useMemo, useState, memo, useCallback } from 'react'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'

import { useToggleAccountDrawer } from '../..'
import { hideSmallBalancesAtom } from '../../SmallBalanceToggle'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 0.00000000000000001

interface TokenBalanceData {
  balance: number
  balanceUSD: number
  priceChange: number
  timestamp: number
}

const SkeletonOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: ${({ theme }) => theme.backgroundModule};
`

const TokenBalanceCache = new Map<string, TokenBalanceData>()
let isFirstLoad = true

const MemoizedTokenRow = memo(TokenRow)

export default function Tokens({ totalBalance }: { totalBalance?: number }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const tokens = useDefaultActiveTokens()
  const nativeCurrency = useNativeCurrency()
  const [isLoading, setIsLoading] = useState(isFirstLoad)

  const tokensList = useMemo(() => 
    [nativeCurrency, ...Object.values(tokens)],
    [nativeCurrency, tokens]
  )

  const [loadedTokens, setLoadedTokens] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    if (isFirstLoad) {
      const validTokensCount = tokensList.filter(Boolean).length
      setIsLoading(loadedTokens.size < validTokensCount)
      if (loadedTokens.size === validTokensCount) {
        isFirstLoad = false
        setIsLoading(false)
      }
    }
  }, [loadedTokens, tokensList])

  const handleTokenLoaded = useCallback((tokenId: string) => {
    setLoadedTokens(prev => new Set([...prev, tokenId]))
  }, [])

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
        token && <MemoizedTokenRow 
          key={token instanceof Token ? token.address : token.symbol} 
          token={token} 
          hideSmallBalances={hideSmallBalances}
          onLoaded={handleTokenLoaded}
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
  const tokenId = (token instanceof Token ? token.address : token.symbol) as string
  const [isTokenLoaded, setIsTokenLoaded] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const cachedData = TokenBalanceCache.get(tokenId)
    if (cachedData) {
      if (!isTokenLoaded) {
        setIsTokenLoaded(true)
        onLoaded(tokenId)
      }
    }

    if (balance) {
      TokenBalanceCache.set(tokenId, {
        balance: balance.balance,
        balanceUSD: balance.balanceUSD,
        priceChange: balance.priceChange,
        timestamp: Date.now()
      })
      if (!isTokenLoaded) {
        setIsTokenLoaded(true)
        onLoaded(tokenId)
      }
    }

    const updateInterval = setInterval(() => {
      const cachedData = TokenBalanceCache.get(tokenId)
      if (!cachedData || Date.now() - cachedData.timestamp > 30000) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          refetch?.()
        }, 1000)
      }
    }, 15000)

    return () => {
      clearInterval(updateInterval)
      clearTimeout(timeoutId)
    }
  }, [balance, tokenId, isTokenLoaded, onLoaded, refetch])

  const displayBalance = balance || TokenBalanceCache.get(tokenId)
  
  if (!displayBalance) {
    return <PortfolioSkeleton />
  }

  if (hideSmallBalances && Number(displayBalance.balance) < HIDE_SMALL_USD_BALANCES_THRESHOLD) {
    return null
  }

  return (
    <PortfolioRow
      left={<PortfolioLogo chainId={token.chainId} currencies={[token]} size="40px" />}
      title={<ThemedText.SubHeader fontSize='14px' fontWeight={500}>{token.name}</ThemedText.SubHeader>}
      descriptor={
        <TokenBalanceText fontSize='13px'>
          {formatNumber(displayBalance.balance, NumberType.TokenNonTx)}{' '}
          {token.symbol}
        </TokenBalanceText>
      }
      right={
        displayBalance && (
          <><ThemedText.SubHeader fontSize='13px' fontWeight={500}>
            {formatNumber(displayBalance.balanceUSD, NumberType.PortfolioBalance)}
          </ThemedText.SubHeader>
          <Row justify="flex-end">
              <DeltaArrow delta={displayBalance.priceChange} size={20} />
              <ThemedText.BodySecondary fontSize='13px'>{formatDelta(displayBalance.priceChange)}</ThemedText.BodySecondary>
            </Row></>
        )
      }
    />
  )
}
