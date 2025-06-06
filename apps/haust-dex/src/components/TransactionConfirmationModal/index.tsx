import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Badge from 'components/Badge'
import { LightCard } from 'components/Card'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId, SupportedL2ChainId } from 'constants/chains'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { NFT } from 'pages/Pool/PositionPage'
import { ReactNode, useCallback, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowUpCircle, CheckCircle } from 'react-feather'
import { Text } from 'rebass'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { isL2ChainId } from 'utils/chains'

import Circle from '../../assets/images/blue-loader.svg'
import { ExternalLink, ThemedText } from '../../theme'
import { CloseIcon, CustomLightSpinner } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { TransactionSummary } from '../AccountDetails/TransactionSummary'
import { ButtonLight, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import { RowBetween, RowFixed } from '../Row'
import AnimatedConfirmation from './AnimatedConfirmation'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 20px;
  outline: 1px solid ${({ theme }) => theme.backgroundOutline};
  border: 1px solid ${({ theme }) => theme.neutralBorder};
  width: 100%;
  padding: 12px;
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const BottomSection = styled(Section)`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  padding-bottom: 10px;
`

const ConfirmedIcon = styled(ColumnCenter)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '20px 0' : '32px 0;')};
`

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`

function ConfirmationPendingContent({
  onDismiss,
  pendingText,
  inline,
}: {
  onDismiss: () => void
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const theme = useTheme()

  return (
    <Wrapper>
      <AutoColumn gap="md">
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
        </ConfirmedIcon>
        <AutoColumn gap="md" justify="center">
          <Text fontWeight={500} fontSize={20} color={theme.textPrimary} textAlign="center">
            <Trans>Waiting for confirmation</Trans>
          </Text>
          <Text fontWeight={600} fontSize={16} color={theme.textPrimary} textAlign="center">
            {pendingText}
          </Text>
          <Text fontWeight={400} fontSize={12} color={theme.textSecondary} textAlign="center" marginBottom="12px">
            <Trans>Confirm this transaction in your wallet</Trans>
          </Text>
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}
function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  currencyToAdd,
  inline,
  lpToAdd,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  inline?: boolean
  lpToAdd?: {
    address: string
    tokenId: string
    image: string
    token0Amount: string
    token1Amount: string
    token0Symbol: string
    token1Symbol: string
    feeTier: number
    imageRef: string
  } | undefined
}) {
  const theme = useTheme()
  const { connector, provider } = useWeb3React()

  const token = currencyToAdd?.wrapped
  const logoURL = useCurrencyLogoURIs(token)[0]

  const [success, setSuccess] = useState<boolean | undefined>()

  const addToken = useCallback(() => {
    if (!token?.symbol || !connector.watchAsset) return
    connector
      .watchAsset({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        image: logoURL,
      })
      .then(() => setSuccess(true))
      .catch(() => setSuccess(false))
  }, [connector, logoURL, token])

  const addLpToken = useCallback(async () => {
    if (!lpToAdd || !provider?.provider?.request) return
    
    try {
        await provider.provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: lpToAdd.address,
              tokenId: lpToAdd.tokenId,
              image: lpToAdd.image,
            }
          } as any,
        });
      setSuccess(true);
    } catch (error) {
      console.error('Error adding NFT to wallet:', error);
      setSuccess(false);
    }
  }, [provider, lpToAdd])

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        
        {!lpToAdd && (
        <ConfirmedIcon inline={inline}>
          <ArrowUpCircle strokeWidth={1} size={inline ? '40px' : '75px'} color={theme.accentActive} />
        </ConfirmedIcon>
        )}

        <AutoColumn gap="md" justify="center" style={{ paddingBottom: '12px' }}>
          <ThemedText.MediumHeader textAlign="center">
            <Trans>Transaction submitted</Trans>
          </ThemedText.MediumHeader>
          {currencyToAdd && connector.watchAsset && !currencyToAdd.isNative && (
            !success ? (
              <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={addToken}>
                <RowFixed>
                  <Trans>Add {currencyToAdd.symbol}</Trans>
                </RowFixed>
              </ButtonLight>
            ) : (
              <ThemedText.MediumHeader textAlign="center" marginTop="12px">
                <RowFixed>
                  <Trans>Added {currencyToAdd.symbol}</Trans>
                  <CheckCircle size="16px" stroke={theme.accentSuccess} style={{ marginLeft: '6px' }} />
                </RowFixed>
              </ThemedText.MediumHeader>
            )
          )}
          {lpToAdd && (
          <AutoColumn gap="24px" style={{ margin: '20px 0' }}>
            <LightCard style={{ 
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              margin: '0 12px'
            }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              padding: '20px',
              borderRadius: '16px',
              margin: '0 12px'
            }}>
              <NFT image={lpToAdd.imageRef} height={200} minHeight={200} disableHover={true} />
            </div>
              <AutoColumn gap="16px" style={{ padding: '20px' }}>
                <RowBetween>
                  <ThemedText.SubHeader color="textSecondary">
                      Pool
                  </ThemedText.SubHeader>
                  <ThemedText.SubHeader>
                    <span style={{ fontWeight: '600' }}>
                      {lpToAdd.token0Symbol}/{lpToAdd.token1Symbol}
                    </span>
                    <span style={{ 
                      marginLeft: '8px',
                      opacity: 0.7,
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      {lpToAdd.feeTier / 10000}%
                    </span>
                  </ThemedText.SubHeader>
                </RowBetween>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />

                <RowBetween>
                  <ThemedText.BodyPrimary color="textSecondary">
                    {lpToAdd.token0Symbol}
                  </ThemedText.BodyPrimary>
                  <ThemedText.BodyPrimary style={{ fontWeight: '600' }}>
                    {lpToAdd.token0Amount}
                  </ThemedText.BodyPrimary>
                </RowBetween>

                <RowBetween>
                  <ThemedText.BodyPrimary color="textSecondary">
                    {lpToAdd.token1Symbol}
                  </ThemedText.BodyPrimary>
                  <ThemedText.BodyPrimary style={{ fontWeight: '600' }}>
                    {lpToAdd.token1Amount}
                  </ThemedText.BodyPrimary>
                </RowBetween>
              </AutoColumn>
            </LightCard>
          </AutoColumn>
          )}
          {lpToAdd && connector.watchAsset && (
            !success ? (
              <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={addLpToken}>
                <RowFixed>
                    Add LP-token to wallet
                </RowFixed>
              </ButtonLight>
            ) : (
              <ThemedText.MediumHeader textAlign="center" marginTop="12px">
                <RowFixed>
                    Added LP-token to wallet
                  <CheckCircle size="16px" stroke={theme.accentSuccess} style={{ marginLeft: '6px' }} />
                </RowFixed>
              </ThemedText.MediumHeader>
            )
          )}
          {chainId && hash && (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={600} fontSize={14} color={theme.accentAction} marginTop="12px">
                <Trans>View on {chainId === SupportedChainId.HAUST ? 'BscScan' : 'Block Explorer'}</Trans>
              </Text>
            </ExternalLink>
          )}
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

export function ConfirmationModalContent({
  title,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: ReactNode
  onDismiss: () => void
  topContent: () => ReactNode
  bottomContent?: () => ReactNode | undefined
}) {
  const theme = useTheme()

  return (
    <Wrapper>
      <Section>
        <RowBetween padding="8px 12px 0px 12px">
          <Text fontWeight={500} fontSize={18} color={theme.iconPrimary}>
            {title}
          </Text>
          <CloseIcon onClick={onDismiss} data-cy="confirmation-close-icon" />
        </RowBetween>
        {topContent()}
      </Section>
      {bottomContent && <BottomSection gap="12px">{bottomContent()}</BottomSection>}
    </Wrapper>
  )
}

export function TransactionErrorContent({ message, onDismiss }: { message: ReactNode; onDismiss: () => void }) {
  const theme = useTheme()
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={600} fontSize={16}>
            <Trans>Error</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
          <AlertTriangle color={theme.accentCritical} style={{ strokeWidth: 1 }} size={90} />
          <ThemedText.MediumHeader textAlign="center">{message}</ThemedText.MediumHeader>
        </AutoColumn>
      </Section>
      <BottomSection gap="12px">
        <ButtonPrimary onClick={onDismiss}>
          <Trans>Dismiss</Trans>
        </ButtonPrimary>
      </BottomSection>
    </Wrapper>
  )
}

function L2Content({
  onDismiss,
  chainId,
  hash,
  pendingText,
  inline,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: SupportedL2ChainId
  currencyToAdd?: Currency | undefined
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const theme = useTheme()

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.receipt?.status === 1

  // convert unix time difference to seconds
  const secondsToConfirm = transaction?.confirmedTime
    ? (transaction.confirmedTime - transaction.addedTime) / 1000
    : undefined

  const info = getChainInfo(chainId)

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween mb="16px">
            <Badge>
              <RowFixed>
                <StyledLogo src={info.logoUrl} style={{ margin: '0 8px 0 0' }} />
                {info.label}
              </RowFixed>
            </Badge>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          {confirmed ? (
            transactionSuccess ? (
              // <CheckCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.accentSuccess} />
              <AnimatedConfirmation />
            ) : (
              <AlertCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.accentFailure} />
            )
          ) : (
            <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
          )}
        </ConfirmedIcon>
        <AutoColumn gap="md" justify="center">
          <Text fontWeight={500} fontSize={20} textAlign="center">
            {!hash ? (
              <Trans>Confirm transaction in wallet</Trans>
            ) : !confirmed ? (
              <Trans>Transaction Submitted</Trans>
            ) : transactionSuccess ? (
              <Trans>Success</Trans>
            ) : (
              <Trans>Error</Trans>
            )}
          </Text>
          <Text fontWeight={400} fontSize={16} textAlign="center">
            {transaction ? <TransactionSummary info={transaction.info} /> : pendingText}
          </Text>
          {chainId && hash ? (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={500} fontSize={14} color={theme.accentAction}>
                <Trans>View on Explorer</Trans>
              </Text>
            </ExternalLink>
          ) : (
            <div style={{ height: '17px' }} />
          )}
          <Text color={theme.textTertiary} style={{ margin: '20px 0 0 0' }} fontSize="14px">
            {!secondsToConfirm ? (
              <div style={{ height: '24px' }} />
            ) : (
              <div>
                <Trans>Transaction completed in </Trans>
                <span style={{ fontWeight: 500, marginLeft: '4px', color: theme.textPrimary }}>
                  {secondsToConfirm} seconds 🎉
                </span>
              </div>
            )}
          </Text>
          <ButtonPrimary onClick={onDismiss} style={{ margin: '4px 0 0 0' }}>
            <Text fontWeight={500} fontSize={20}>
              {inline ? <Trans>Return</Trans> : <Trans>Close</Trans>}
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss: () => void
  hash: string | undefined
  content?: () => ReactNode
  attemptingTxn: boolean
  pendingText: ReactNode
  currencyToAdd?: Currency | undefined
  lpToAdd?: {
    address: string
    tokenId: string
    image: string
    token0Amount: string
    token1Amount: string
    token0Symbol: string
    token1Symbol: string
    feeTier: number
    imageRef: string
  } | undefined
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd,
  lpToAdd,
}: ConfirmationModalProps) {
  const { chainId } = useWeb3React()

  if (!chainId) return null

  return (
    <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onDismiss} maxHeight={90}>
      {isL2ChainId(chainId) && (hash || attemptingTxn) ? (
        <L2Content chainId={chainId} hash={hash} onDismiss={onDismiss} pendingText={pendingText} />
      ) : attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
      ) : hash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          currencyToAdd={currencyToAdd}
          lpToAdd={lpToAdd}
        />
      ) : (
        content && content()
      )}
    </Modal>
  )
}
