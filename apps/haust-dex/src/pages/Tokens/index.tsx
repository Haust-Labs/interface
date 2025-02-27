import { Trans } from '@lingui/macro'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { filterStringAtom } from 'components/Tokens/state'
import NetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import TimeSelector from 'components/Tokens/TokenTable/TimeSelector'
import TokenTable from 'components/Tokens/TokenTable/TokenTable'
import { useResetAtom } from 'jotai/utils'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { NavLink } from 'react-router-dom'
import { ExploreChartsSection } from './charts/ExploreChartsSection'
import PoolTable from 'components/Pools/PoolTable/PoolTable'
import { ButtonPrimary } from 'components/Button'
import TransactionTable from 'components/Transactions/TransactionTable/TransactionTable'
const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 32px 0;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 40px;
  flex-shrink: 0;
`
const SearchContainer = styled(FiltersContainer)`
  margin-left: 8px;
  width: auto;
  flex-shrink: 1;
`
const FiltersWrapper = styled.div`
  display: flex;
  color: ${({ theme }) => theme.textTertiary};
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }
`

const TabsContainer = styled.div`
  display: flex;
  gap: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

const Tab = styled.div`
  text-decoration: none;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 20px;
  font-weight: 485;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &[data-active='true'] {
    color: ${({ theme }) => theme.textPrimary};
  }

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
  }
`

const ContentWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto 20px auto;
  justify-content: space-between;
  align-items: center;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 16px;
  font-size: 16px;
  padding: 8px 16px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

export enum ExploreTab {
  Tokens = 'tokens',
  Pools = 'pools',
  Transactions = 'transactions',
}

interface Page {
  title: React.ReactNode
  key: ExploreTab
  component: React.ComponentType
}

const Pages: Array<Page> = [
  {
    title: <Trans>Tokens</Trans>,
    key: ExploreTab.Tokens,
    component: TokenTable,
  },
  {
    title: <Trans>Pools</Trans>,
    key: ExploreTab.Pools,
    component: PoolTable,
  },
  {
    title: <Trans>Transactions</Trans>,
    key: ExploreTab.Transactions,
    component: TransactionTable,
  },
]

const Tokens = ({ initialTab }: { initialTab?: ExploreTab }) => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const navigate = useNavigate()
  
  const [currentTab, setCurrentTab] = useState(() => {
    if (initialTab) {
      const index = Pages.findIndex(({ key }) => key === initialTab)
      return index >= 0 ? index : 0
    }
    const path = location.pathname
    const tabFromPath = path.split('/').pop() as ExploreTab
    const index = Pages.findIndex(({ key }) => key === tabFromPath)
    return index >= 0 ? index : 0
  })

  useEffect(() => {
    const path = location.pathname
    const tabFromPath = path.split('/').pop() as ExploreTab
    const index = Pages.findIndex(({ key }) => key === tabFromPath)
    if (index >= 0) {
      setCurrentTab(index)
    }
  }, [location.pathname])

  const handleTabClick = (index: number, key: ExploreTab) => {
    setCurrentTab(index)
    window.history.replaceState(null, '', `#/explore/${key}`)
  }

  useEffect(() => {
    resetFilterString()
  }, [currentTab, resetFilterString])

  const { component: Page } = Pages[currentTab]
  const currentKey = Pages[currentTab].key

  return (
    <ExploreContainer>
      <ExploreChartsSection />
      <ContentWrapper>
        <TabsContainer>
          {Pages.map(({ title, key }, index) => (
            <Tab 
              key={key}
              data-active={currentTab === index}
              onClick={() => handleTabClick(index, key)}
            >
              {title}
            </Tab>
          ))}
        </TabsContainer>
        <FiltersWrapper>
        {currentKey === ExploreTab.Pools && 
          <ResponsiveButtonPrimary data-cy="join-pool-button" id="join-pool-button" as={Link} to="/add/">
                + Add liquidity
             </ResponsiveButtonPrimary>}
          <NetworkFilter />
          {currentKey === ExploreTab.Tokens && <TimeSelector />}
          {currentKey !== ExploreTab.Transactions && <SearchBar />}
        </FiltersWrapper>
      </ContentWrapper>
      <Page />
    </ExploreContainer>
  )
}

export default Tokens
