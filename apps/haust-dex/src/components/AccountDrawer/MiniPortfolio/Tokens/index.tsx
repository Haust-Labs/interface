import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/Delta'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { formatNumber, NumberType } from 'conedison/format'
import { isSupportedChain } from 'constants/chains'
import { useDefaultActiveTokens } from 'hooks/Tokens'
import { useSwitchNetwork } from 'hooks/useSwitchNetwork'
import { useAtomValue } from 'jotai/utils'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { memo, useCallback,useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTokensWithBalances } from 'state/tokens/hooks'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'

import { useToggleAccountDrawer } from '../..'
import { hideSmallBalancesAtom } from '../../SmallBalanceToggle'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 0.00000000000000001
const PREFERRED_TOKENS_ORDER = ['HAUST', 'WHAUST', 'USDT', 'USDC', 'WBTC', 'WETH']


const SkeletonOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: ${({ theme }) => theme.backgroundModule};
`

let isFirstLoad = true

const MemoizedTokenRow = memo(TokenRow)

export default function Tokens({ totalBalance }: { totalBalance?: number }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const tokens = useDefaultActiveTokens()
  const nativeCurrency = useNativeCurrency()
  const [isLoading, setIsLoading] = useState(isFirstLoad)
  const { chainId } = useWeb3React()
  const { switchNetwork } = useSwitchNetwork()
  const { tokens: tokensWithBalances } = useTokensWithBalances()

  const tokensList = useMemo(() => {
    const allTokens = [nativeCurrency, ...Object.values(tokens)]
      .filter(token => token?.symbol !== 'MYR' && token?.symbol?.toLocaleUpperCase() !== 'WHAUST')

    return allTokens
      .filter(Boolean)
      .filter(token => {
        const tokenData = tokensWithBalances.find(t => {
          const searchId = token.isNative ? 'native' : token.wrapped.address.toLowerCase();
          return t.id.toLowerCase() === searchId;
        });
        return !!tokenData;
      })
      .sort((a, b) => {
        const aSymbol = (a as Token | NativeCurrency).symbol
        const bSymbol = (b as Token | NativeCurrency).symbol
        const aIndex = PREFERRED_TOKENS_ORDER.indexOf(aSymbol ?? '')
        const bIndex = PREFERRED_TOKENS_ORDER.indexOf(bSymbol ?? '')
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex
        }
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        return 0
      })
  }, [nativeCurrency, tokens, tokensWithBalances])
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

  if (chainId && !isSupportedChain(chainId)) {
    return <EmptyWalletModule type="chain" onNavigateClick={toggleWalletDrawer} onSwitchNetwork={() => switchNetwork()}/>
  }

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
          key={token instanceof Token ? token.address : `native-${token.symbol}`}
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

function TokenRow({ token, hideSmallBalances, onLoaded }: { token: Token | NativeCurrency; hideSmallBalances: boolean; onLoaded: (tokenId: string) => void }) {
  const { tokens } = useTokensWithBalances();
  const navigate = useNavigate();
  const toggleWalletDrawer = useToggleAccountDrawer();
  
  const tokenData = tokens.find(t => {
    const searchId = token.isNative ? 'native' : token.wrapped.address.toLowerCase();
    return t.id.toLowerCase() === searchId;
  });

  useEffect(() => {
    if (tokenData && onLoaded) {
      onLoaded(token.isNative ? 'native' : token.wrapped.address.toLowerCase());
    }
  }, [token.wrapped.address, tokenData, onLoaded, token.isNative]);

  const handleClick = useCallback(() => {
    const address = token instanceof NativeCurrency 
      ? 'NATIVE'
      : token.address 

    if (address) {
      navigate(`/explore/token/haust_mainnet/${address}`)
      toggleWalletDrawer()
    }
  }, [token, navigate, toggleWalletDrawer])

  if (hideSmallBalances && tokenData?.balanceUSD && tokenData.balanceUSD < HIDE_SMALL_USD_BALANCES_THRESHOLD) {
    return null;
  }

  return (
    <PortfolioRow
      onClick={handleClick}
      left={<PortfolioLogo chainId={token.chainId} currencies={[token]} size="40px" />}
      title={<ThemedText.SubHeader fontSize='14px' fontWeight={500}>{token.name}</ThemedText.SubHeader>}
      descriptor={
        <TokenBalanceText fontSize='13px'>
          {formatNumber(tokenData?.balance, NumberType.TokenNonTx)}{' '}
          {token.symbol}
        </TokenBalanceText>
      }
      right={
        tokenData && (
          <><ThemedText.SubHeader fontSize='13px' fontWeight={500}>
            {formatNumber(tokenData.balanceUSD, NumberType.PortfolioBalance)}
          </ThemedText.SubHeader>
          <Row justify="flex-end">
            <DeltaArrow delta={tokenData.priceChange} size={20} />
            <ThemedText.BodySecondary fontSize='13px'>{formatDelta(tokenData.priceChange)}</ThemedText.BodySecondary>
          </Row></>
        )
      }
    />
)
}
