import { Flex } from 'components/layout/Flex'
import { Text } from 'components/Text/Text'
import { ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components/macro'
import { ClickableStyle, CloseIcon } from 'theme/components'

const BackButton = styled(ArrowLeft)`
  color: ${({ theme }) => theme.white};
  ${ClickableStyle};
`

interface GetHelpHeaderProps {
  closeModal: () => void
  link?: string
  title?: ReactNode
  goBack?: () => void
  closeDataTestId?: string
  className?: string
}

export function GetHelpHeader({ title, goBack, closeModal, closeDataTestId, className }: GetHelpHeaderProps) {
  return (
    <Flex row align-items="center" width="100%" className={className} justify-content="space-between">
      {title && (
        <Flex>
          <Text variant="body2" color='white'>{title}</Text>
        </Flex>
      )}
      <Flex row align-items="center" gap="10px">
        {goBack && <BackButton size="24px" onClick={goBack} />}
        <CloseIcon data-testid={closeDataTestId} onClick={closeModal} />
      </Flex>
    </Flex>
  )
}
