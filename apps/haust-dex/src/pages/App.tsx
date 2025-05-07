import { useWeb3React } from '@web3-react/core'
import Loader from 'components/Icons/LoadingSpinner'
import TopLevelModals from 'components/TopLevelModals'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StatsigProvider, StatsigUser } from 'statsig-react'
import styled from 'styled-components/macro'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'
import { STATSIG_DUMMY_KEY } from 'tracing'
import { getEnvName } from 'utils/env'

import ErrorBoundary from '../components/ErrorBoundary'
import NavBar from '../components/NavBar'
import Popups from '../components/Popups'
import {isSupportedChain, SupportedChainId} from "../constants/chains";
import {useAddPopup} from "../state/application/hooks";
import DarkModeQueryParamReader from '../theme/components/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import MigrateV2 from './MigrateV2'
import MigrateV2Pair from './MigrateV2/MigrateV2Pair'
import NotFound from './NotFound'
import Pool from './Pool'
import PositionPage from './Pool/PositionPage'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import StakeLiquidityV3 from './StakeLiquidity/V3'
import Swap from './Swap'
import Tokens, { ExploreTab } from './Tokens'
import ClaimRewardsV3 from './UnStakeLiquidity/V3'

const TokenDetails = lazy(() => import('./TokenDetails'))
const PoolDetails = lazy(() => import('./PoolDetails'))

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  padding: ${({ theme }) => theme.navHeight}px 0px 5rem 0px;
  align-items: center;
  flex: 1;
`

const HeaderWrapper = styled.div<{ transparent?: boolean }>`
  ${flexRowNoWrap};
  background-color: ${({ theme, transparent }) => !transparent && theme.backgroundSurface};
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: ${Z_INDEX.dropdown};
`

export default function App() {
  const { chainId } = useWeb3React()
  const isLoaded = useFeatureFlagsIsLoaded()
  const addPopup = useAddPopup();

  const { pathname } = useLocation()
  const [scrolledState, setScrolledState] = useState(false)

  // useAnalyticsReporter()

  useEffect(() => {
    window.scrollTo(0, 0)
    setScrolledState(false)
  }, [pathname])

  useEffect(() => {
    const scrollListener = () => {
      setScrolledState(window.scrollY > 0)
    }
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  useEffect(() => {
    if (chainId && !isSupportedChain(chainId)) {
      addPopup({ failedSwitchNetwork: SupportedChainId.HAUST_TESTNET }, '97', 5000)
    }
  }, [addPopup, chainId]);

  const isHeaderTransparent = !scrolledState

  const { account } = useWeb3React()
  const statsigUser: StatsigUser = useMemo(
    () => ({
      customIDs: { address: account ?? '' },
    }),
    [account]
  )

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <ApeModeQueryParamReader />
      <StatsigProvider
        user={statsigUser}
        sdkKey={STATSIG_DUMMY_KEY}
        waitForInitialization={false}
        options={{
          environment: { tier: getEnvName() },
          api: process.env.REACT_APP_STATSIG_PROXY_URL,
        }}
      >
        <HeaderWrapper transparent={isHeaderTransparent}>
          <NavBar blur={isHeaderTransparent} />
        </HeaderWrapper>
        <BodyWrapper>
          <Popups />
          <TopLevelModals />
          <Suspense fallback={<Loader />}>
            {isLoaded ? (
              <Routes>
                <Route path="/" element={<Swap />} />

                <Route path="explore/tokens" element={<Tokens initialTab={ExploreTab.Tokens} />} />
                <Route path="explore/pools" element={<Tokens initialTab={ExploreTab.Pools} />} />
                <Route path="explore/transactions" element={<Tokens initialTab={ExploreTab.Transactions} />} />
                <Route path="explore/token/:chainName/:tokenAddress" element={<TokenDetails />} />
                <Route path="explore/pools/:chainName/:poolAddress" element={<PoolDetails />} />
                <Route path="explore/token/:chainName" element={<TokenDetails />} />
                <Route path="swap" element={<Swap />} />
                <Route path="send" element={<Swap />} />

                <Route path="pool/v2/find" element={<PoolFinder />} />
                <Route path="pool" element={<Pool />} />
                <Route path="pool/:tokenId" element={<PositionPage />} />

                <Route path="pools/v2/find" element={<PoolFinder />} />
                <Route path="pools" element={<Pool />} />
                <Route path="pools/:tokenId" element={<PositionPage />} />

                <Route path="add/v2" element={<RedirectDuplicateTokenIdsV2 />}>
                  <Route path=":currencyIdA" />
                  <Route path=":currencyIdA/:currencyIdB" />
                </Route>
                <Route path="add" element={<RedirectDuplicateTokenIds />}>
                   this is workaround since react-router-dom v6 doesn&apos;t support optional parameters any more
                  <Route path=":currencyIdA" />
                  <Route path=":currencyIdA/:currencyIdB" />
                  <Route path=":currencyIdA/:currencyIdB/:feeAmount" />
                </Route>

                <Route path="increase" element={<AddLiquidity />}>
                  <Route path=":currencyIdA" />
                  <Route path=":currencyIdA/:currencyIdB" />
                  <Route path=":currencyIdA/:currencyIdB/:feeAmount" />
                  <Route path=":currencyIdA/:currencyIdB/:feeAmount/:tokenId" />
                </Route>

                <Route path="stake/:tokenId" element={<StakeLiquidityV3 />} />
                <Route path="claim/:tokenId" element={<ClaimRewardsV3 />} />
                <Route path="unstake/:tokenId" element={<StakeLiquidityV3 />} />


                <Route path="remove/v2/:currencyIdA/:currencyIdB" element={<RemoveLiquidity />} />
                <Route path="remove/:tokenId" element={<RemoveLiquidityV3 />} />

                <Route path="migrate/v2" element={<MigrateV2 />} />
                <Route path="migrate/v2/:address" element={<MigrateV2Pair />} />

                <Route path="*" element={<Navigate to="/not-found" replace />} />
                <Route path="/not-found" element={<NotFound />} />
              </Routes>
            ) : (
              <Loader />
            )}
          </Suspense>
        </BodyWrapper>
      </StatsigProvider>
    </ErrorBoundary>
  )
}
