import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import styled from 'styled-components/macro'

const StyledSwapHeader = styled(GetHelpHeader)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export function SwapHead({
  onDismiss,
  swapError,
}: {
  onDismiss: () => void
  swapError: string | undefined
}) {
  return (
    <StyledSwapHeader
      title={swapError ? ' ' : `You're swapping`}
      closeModal={onDismiss}
      closeDataTestId="confirmation-close-icon"
    />
  )
}
