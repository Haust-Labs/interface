import {useWeb3React} from '@web3-react/core'
import Column from 'components/Column'
import { ArrowDownCircleFilled } from 'components/Icons/ArrowDownCircleFilled'
import Row, { AutoRow } from 'components/Row'
import { DeltaArrow } from 'components/Tokens/Delta'
import { LoadingBubble } from 'components/Tokens/loading'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { formatNumber, NumberType } from 'conedison/format'
import {useGetConnection} from 'connection'
import {shortenAddress} from 'nft/utils/address'
import {useCallback, useEffect} from 'react'
import {ArrowDownRight, ArrowUpRight, Copy, IconProps, Power, Settings} from 'react-feather'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import {useAppDispatch} from 'state/hooks'
import {updateSelectedWallet} from 'state/user/reducer'
import styled, {useTheme} from 'styled-components/macro'
import {CopyHelper, ThemedText} from 'theme'
import { formatLargeBalance } from 'utils/formatNumbers'

import { useWalletBalance } from '../../hooks/useWalletBalance'
import StatusIcon from '../Identicon/StatusIcon'
import { ActionTile } from './ActionTile'
import IconButton, {IconHoverText} from './IconButton'
import { MiniPortfolio } from './MiniPortfolio'
import { portfolioFadeInAnimation } from './MiniPortfolio/PortfolioRow'

const AuthenticatedHeaderWrapper = styled.div`
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0;
    ${IconHoverText}:last-child {
      left: 0;
    }
  }
`

const StatusWrapper = styled.div`
  width: 70%;
  padding-right: 4px;
  display: inline-flex;
`

const AccountNamesWrapper = styled.div`
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`

const HeaderWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const PortfolioDrawerContainer = styled(Column)`
  flex: 1;
`
const FadeInColumn = styled(Column)`
  ${portfolioFadeInAnimation}
`

const CopyText = styled(CopyHelper).attrs({
  InitialIcon: Copy,
  CopiedIcon: Copy,
  gap: 4,
  iconSize: 14,
  iconPosition: 'right',
})``

const HeadlineText = styled(ThemedText.HeadlineLarge)<{ isLarge: boolean }>`
  font-size: ${({ isLarge }) => isLarge ? '24px' : '36px'};
`

export function PortfolioArrow({ change, ...rest }: { change: number } & IconProps) {
  const theme = useTheme()
  return change < 0 ? (
    <ArrowDownRight color={theme.accentCritical} size={20} {...rest} />
  ) : (
    <ArrowUpRight color={theme.accentSuccess} size={20} {...rest} />
  )
}

export default function AuthenticatedHeader({ account, openSettings }: { account: string; openSettings: () => void }) {
  const { connector, ENSName } = useWeb3React()
  const dispatch = useAppDispatch()
  const openReceiveModal = useOpenModal(ApplicationModal.RECEIVE_CRYPTO)

  const absoluteChange = 0;
  const percentChange = 0;
  const { totalBalance, loading, refetch } = useWalletBalance()

  const getConnection = useGetConnection()
  const connection = getConnection(connector)
  const disconnect = useCallback(() => {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    dispatch(updateSelectedWallet({ wallet: undefined }))
  }, [connector, dispatch])

  useEffect(() => {
    const interval = setInterval(() => {
      refetch?.()
    }, 5000)

    return () => clearInterval(interval)
  }, [refetch])

  return (
    <AuthenticatedHeaderWrapper>
      <HeaderWrapper>
        <StatusWrapper>
          <StatusIcon connection={connection} size={40} />
          {account && (
            <AccountNamesWrapper>
              <ThemedText.SubHeader color="textPrimary" fontWeight={500}>
                <CopyText toCopy={ENSName ?? account}>{ENSName ?? shortenAddress(account, 4, 4)}</CopyText>
              </ThemedText.SubHeader>
              {/* Displays smaller view of account if ENS name was rendered above */}
              {ENSName && (
                <ThemedText.BodySmall color="textTertiary">
                  <CopyText toCopy={account}>{shortenAddress(account, 4, 4)}</CopyText>
                </ThemedText.BodySmall>
              )}
            </AccountNamesWrapper>
          )}
        </StatusWrapper>
        <IconContainer>
          <IconButton data-testid="wallet-settings" onClick={openSettings} Icon={Settings} />
          <IconButton data-testid="wallet-disconnect" onClick={disconnect} Icon={Power} />
        </IconContainer>
      </HeaderWrapper>
      <PortfolioDrawerContainer>
        {!loading ? (
          <FadeInColumn gap="xs">
            <HeadlineText 
              fontWeight={535} 
              data-testid="portfolio-total-balance"
              isLarge={formatLargeBalance(totalBalance).isLarge}
            >
              {`${formatNumber(Number(formatLargeBalance(totalBalance).value), NumberType.TokenNonTx)}${formatLargeBalance(totalBalance).unit}`}
            </HeadlineText>
            <AutoRow marginBottom="20px">
                <>
                  <DeltaArrow delta={absoluteChange} />
                  <ThemedText.BodySecondary>
                    {`${formatNumber(
                      Math.abs(absoluteChange as number),
                      NumberType.PortfolioBalance,
                    )} (${formatDelta(percentChange)})`}
                  </ThemedText.BodySecondary>
                </>
            </AutoRow>
          </FadeInColumn>
        ) : (
          <Column gap="xs">
            <LoadingBubble height="44px" width="170px" />
            <LoadingBubble height="16px" width="100px" margin="4px 0 20px 0" />
          </Column>
        )}
        <>
          <Row gap="8px" marginBottom="0px">
            <ActionTile
              dataTestId="wallet-recieve-crypto"
              Icon={<ArrowDownCircleFilled />}
              name="Recieve"
              onClick={openReceiveModal}
            />
          </Row>
          <MiniPortfolio account={account} totalBalance={totalBalance} />
        </>
      </PortfolioDrawerContainer>
    </AuthenticatedHeaderWrapper>
  )
}
