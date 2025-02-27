import { AutoColumn } from "components/Column"
import Modal from "components/Modal"
import { PropsWithChildren } from "react"
import styled from "styled-components/macro"

const Content = styled(AutoColumn)`
  background-color: ${({ theme }) => theme.backgroundModule};
  width: 100%;
  padding: 12px;
  gap: 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.neutralBorder};
`

export function SwapModal({
  children,
  onDismiss,
  isOpen,
}: PropsWithChildren<{
  onDismiss: () => void
  isOpen: boolean
}>) {
  return (
      <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onDismiss} maxHeight={90}>
        <Content>{children}</Content>
      </Modal>
  )
}
