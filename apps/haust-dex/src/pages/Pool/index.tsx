import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { ButtonPrimary, ButtonText } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useV3Positions } from 'hooks/useV3Positions'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Inbox } from 'react-feather'
import { Link } from 'react-router-dom'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { PositionDetails } from 'types/position'

import { LoadingRows } from './styleds'
import { isSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import { PositionsHeader, PositionStatus } from './PositionHeader'
import PositionListItem from 'components/PositionListItem'
import { atom, useAtom } from 'jotai'
import { TOKEN_ADDRESSES } from 'constants/tokens'
import { useSwitchNetwork } from 'hooks/useSwitchNetwork'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0;
  max-width: 870px;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    max-width: 500px;
  `};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.textSecondary};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  `};
`
const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    flex-direction: row-reverse;
  `};
`

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const NetworkIcon = styled(AlertTriangle)`
  ${IconStyle}
`

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 12px;
  font-size: 16px;
  padding: 6px 8px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const MainContentWrapper = styled.main`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.borderSecondary};
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.01), 0 4px 8px rgba(0, 0, 0, 0.04), 0 16px 24px rgba(0, 0, 0, 0.04),
    0 24px 32px rgba(0, 0, 0, 0.01);
`

function PositionsLoadingPlaceholder() {
  return (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  )
}

export function WrongNetworkCard({ title }: { title: string }) {
  const theme = useTheme()
  const { switchNetwork } = useSwitchNetwork()
  return (
    <>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">
              <ThemedText.LargeHeader>
                {title}
              </ThemedText.LargeHeader>
            </TitleRow>

            <MainContentWrapper>
              <ErrorContainer>
                <ThemedText.DeprecatedBody color={theme.textTertiary} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans>Your connected network is unsupported.</Trans>
                  </div>
                  <ButtonPrimary
                    style={{ marginTop: '2em', padding: '8px 16px' }}
                    onClick={switchNetwork}
                  >
                    <Trans>Switch network</Trans>
                  </ButtonPrimary>
                </ThemedText.DeprecatedBody>
              </ErrorContainer>
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

const statusFilterAtom = atom<PositionStatus[]>([PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE])

export default function Pool() {
  const { account, chainId } = useWeb3React()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const theme = useTheme()
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)

  const [, setForceUpdate] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const { positions, loading: positionsLoading } = useV3Positions(account)
  
  const isValidToken = (address: string) => {
    return Object.values(TOKEN_ADDRESSES).some(
      tokenAddress => tokenAddress?.address?.toLowerCase() === address.toLowerCase()
    )
  }

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      if (isValidToken(p.token0) && isValidToken(p.token1)) {
        acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      }
      return acc
    },
    [[], []]
  ) ?? [[], []]


  const filteredPositions = useMemo(
    () => [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)],
    [closedPositions, openPositions, userHideClosedPositions]
  )

  const handleStatusChange = useCallback((toggledStatus: PositionStatus) => {
    setStatusFilter((currentFilter) => {
      if (currentFilter.includes(toggledStatus)) {
        return currentFilter.filter((s) => s !== toggledStatus)
      }
      return [...currentFilter, toggledStatus]
    })
  }, [setStatusFilter])

  if (chainId && !isSupportedChainId(chainId)) {
    return <WrongNetworkCard title="Pools" />
  }

  if (!account) {
    return (
      <>
        <PageWrapper>
          <AutoColumn gap="lg" justify="center">
            <AutoColumn gap="lg" style={{ width: '100%' }}>
              <TitleRow padding="0">
                <ThemedText.LargeHeader>
                  <Trans>Pools</Trans>
                </ThemedText.LargeHeader>
              </TitleRow>
              <MainContentWrapper>
                <ErrorContainer>
                  <ThemedText.DeprecatedBody color={theme.textTertiary} textAlign="center">
                    <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
                    <div>
                      <Trans>Connect your wallet to view your liquidity positions</Trans>
                    </div>
                  </ThemedText.DeprecatedBody>
                  <ButtonPrimary
                    style={{ marginTop: '2em', marginBottom: '2em', padding: '8px 16px' }}
                    onClick={toggleWalletDrawer}
                  >
                    <Trans>Connect a wallet</Trans>
                  </ButtonPrimary>
                </ErrorContainer>
              </MainContentWrapper>
            </AutoColumn>
          </AutoColumn>
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    )
  }

  const showConnectAWallet = Boolean(!account)

  return (
    <>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <PositionsHeader 
              selectedStatus={statusFilter}   
              onStatusChange={handleStatusChange}
            />
            {positionsLoading ? (
              <PositionsLoadingPlaceholder />
            ) : filteredPositions && filteredPositions.length > 0 ? (
              <>
                {filteredPositions.map((p) => (
                  <PositionListItem 
                    key={p.tokenId.toString()} 
                    {...p} 
                    filterStatus={statusFilter}
                  />
                ))}
              </>
            ) : (
              <ErrorContainer>
                <ThemedText.DeprecatedBody color={theme.textTertiary} textAlign="center">
                  <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
                  <div>
                    <Trans>Your active V3 liquidity positions will appear here.</Trans>
                  </div>
                </ThemedText.DeprecatedBody>
              </ErrorContainer>
            )}
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
