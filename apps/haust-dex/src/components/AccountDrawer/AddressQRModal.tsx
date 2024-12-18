import { AddressDisplay } from 'components/AddressDisplay'
import { ColumnCenter } from 'components/Column'
import Identicon from 'components/Identicon'
import { Flex } from 'components/layout/Flex'
import Modal from 'components/Modal'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { QRCodeDisplay } from 'components/QRCode/QRCodeDisplay'
import { Address } from 'conedison/types'
import { useCallback } from 'react'
import { useModalIsOpen, useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'

const UNICON_SIZE = 50
const QR_CODE_SIZE = 240

const ModalWrapper = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 20px;
  outline: 1px solid ${({ theme }) => theme.backgroundSurface};
  width: 100%;
  text-align: center;
  padding-top: 16px;
  padding-bottom: 26px;
  padding-left: 24px;
  padding-right: 24px;
  max-height: 420px;
`

const ModalHeader = styled(GetHelpHeader)`
  display: flex;
  justify-content: space-between;
  width: 100%;
  
  > div {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
`

export function AddressQRModal({ accountAddress }: { accountAddress: Address }) {
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO_QR)
  const isOpen = useModalIsOpen(ApplicationModal.RECEIVE_CRYPTO_QR)
  const openReceiveCryptoModal = useOpenModal(ApplicationModal.RECEIVE_CRYPTO)

  const goBack = useCallback(() => {
    toggleModal()
    openReceiveCryptoModal()
  }, [toggleModal, openReceiveCryptoModal])

  return (
    <Modal isOpen={isOpen} onDismiss={toggleModal} maxWidth={420} maxHeight={420}>
      <ModalWrapper>
        <Flex style={{ gap: '12px', flexDirection: 'column' }}>
          <ModalHeader goBack={goBack} closeModal={toggleModal} />
          <Flex alignItems="center">
            <ThemedText.SubHeader>
              <AddressDisplay enableCopyAddress address={accountAddress} />
            </ThemedText.SubHeader>
          </Flex>
          <QRCodeDisplay
            color={colors.primaryBase}
            containerBackgroundColor={colors.neutralDark}
            size={QR_CODE_SIZE}
            eyeSize={180}
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            encodedValue={accountAddress!}
          >
            <Flex
              justifyContent="center"
              alignItems="center"
              style={{padding: '4px', backgroundColor: colors.green900, borderRadius: '100%'}}
            >
              <Identicon size={UNICON_SIZE} account={accountAddress} />
            </Flex>
          </QRCodeDisplay>
          <ThemedText.BodySmall color={colors.gray450} style={{ marginTop: '8px', color: colors.gray450 }}>
            You can send and receive tokens on the Haust Testnet.
          </ThemedText.BodySmall>
        </Flex>
      </ModalWrapper>
    </Modal>
  )
}
