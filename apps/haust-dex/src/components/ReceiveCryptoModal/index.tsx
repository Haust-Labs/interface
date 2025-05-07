import { useWeb3React } from '@web3-react/core'
import Column, { ColumnCenter } from 'components/Column'
import Modal from 'components/Modal'
import { ChooseProvider } from 'components/ReceiveCryptoModal/ChooseProvider'
// import { useAccount } from 'hooks/useAccount'
// import ms from 'ms'
import { useCallback } from 'react'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'
// import { AdaptiveWebModal } from 'ui/src'
// import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
// import { logger } from 'utilities/src/logger/logger'

const ModalWrapper = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.neutralBorder};
  width: 100%;
  text-align: center;
  padding: 22px;
`
export function ReceiveCryptoModal() {
  const {account} = useWeb3React()
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO)
  const isOpen = useModalIsOpen(ApplicationModal.RECEIVE_CRYPTO)

  const onClose = useCallback(() => {
    toggleModal()

  }, [toggleModal])

  if (!account) {
    onClose()
    return null
  }
  return (
    <Modal isOpen={isOpen} onDismiss={onClose} maxWidth={420} hideBorder={true}>
      <ModalWrapper>
          <ChooseProvider />
      </ModalWrapper>
    </Modal>
  )
}
