import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ButtonPrimary } from 'components/Button'
import Column, { ColumnCenter } from 'components/Column'
import Identicon from 'components/Identicon'
import Modal from 'components/Modal'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import Row from 'components/Row'
import { formatCurrencyAmount, NumberType } from 'conedison/format'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Separator } from 'theme/components'
import { shortenAddress } from 'utils'

const ModalWrapper = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  border-radius: 20px;
  outline: 1px solid ${({ theme }) => theme.backgroundBackdrop};
  width: 100%;
  padding: 8px;
`

const ModalHeader = styled(GetHelpHeader)`
  display: flex;
  padding: 8px 12px 4px;
  justify-content: space-between;
`

const ReviewContentContainer = styled(Column)`
  width: 100%;
  padding: 12px 16px;
  gap: 16px;
`

const SendModalHeader = ({
  label,
  header,
  subheader,
  image,
}: {
  label: ReactNode
  header: ReactNode
  subheader: ReactNode
  image: ReactNode
}) => {
  return (
    <Row justify="space-between" align="center">
      <Column gap="xs">
        <ThemedText.BodySmall color="neutral2" lineHeight="20px">
          {label}
        </ThemedText.BodySmall>
        <ThemedText.HeadlineLarge lineHeight="44px">{header}</ThemedText.HeadlineLarge>
        <ThemedText.BodySmall lineHeight="20px" color="neutral2">
          {subheader}
        </ThemedText.BodySmall>
      </Column>
      <div style={{ height: '36px' }}>{image}</div>
    </Row>
  )
}

export interface ISendReviewModal {
  onConfirm: () => void; 
  onDismiss: () => void;
  parsedTokenAmount: CurrencyAmount<Currency>;
  inputCurrency: Currency;
  address: string;
  chainId: number;
}

export function SendReviewModal({ onConfirm, onDismiss, parsedTokenAmount, inputCurrency, address, chainId }: ISendReviewModal) {
  const formattedInputAmount = formatCurrencyAmount(
   parsedTokenAmount,
    NumberType.TokenNonTx,
  )
  const formattedFiatInputAmount = formatCurrencyAmount(parsedTokenAmount,
    NumberType.PortfolioBalance,
  )

  const gasFeeUSD = useStablecoinValue(parsedTokenAmount)
  const gasFeeFormatted = formatCurrencyAmount(
    gasFeeUSD,
    NumberType.PortfolioBalance,
  )

  const currencySymbolAmount = `${formattedInputAmount} ${inputCurrency?.symbol ?? inputCurrency?.name}`

  const [primaryInputView] = [currencySymbolAmount, formattedFiatInputAmount]

  const shortenedAddress = address ? shortenAddress(address) : ''
  
  return (
    <Modal $scrollOverlay isOpen onDismiss={onDismiss}>
      <ModalWrapper data-testid="send-review-modal" gap="md">
        <ModalHeader title="Review send" closeModal={onDismiss} />
        <ReviewContentContainer>
          <Column gap="lg">
            <SendModalHeader
              label="You’re sending"
              header={primaryInputView}
              subheader=''
              image={
                <PortfolioLogo currencies={[inputCurrency]} size='36px' chainId={chainId} />
              }
            />
            <SendModalHeader
              label='To'
              header={shortenedAddress}
              subheader=''
              image={<Identicon account={address} size={36} />}
            />
          </Column>
          <Separator />
          <Row width="100%" justify="space-between">
            <ThemedText.BodySmall color="neutral2" lineHeight="20px">
              Network cost
            </ThemedText.BodySmall>
            <Row width="min-content" gap="xs">
              <ThemedText.BodySmall>{gasFeeFormatted}</ThemedText.BodySmall>
            </Row>
          </Row>
        </ReviewContentContainer>
          <ButtonPrimary onClick={onConfirm}>
            Confirm send
          </ButtonPrimary>
      </ModalWrapper>
    </Modal>
  )
}
