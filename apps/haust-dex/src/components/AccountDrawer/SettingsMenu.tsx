import { Trans } from '@lingui/macro'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { ChevronRight } from 'react-feather'
import styled from 'styled-components/macro'
import { ClickableStyle, ThemedText } from 'theme'

import { SlideOutMenu } from './SlideOutMenu'
import { ReactNode } from 'react'
import Row from 'components/Row'


const SettingsButtonWrapper = styled(Row)`
  ${ClickableStyle}
  padding: 16px 0px;
`

const LanguageLabel = styled(Row)`
  white-space: nowrap;
`

const SettingsButton = ({
  title,
  currentState,
  onClick,
  testId,
  showArrow = true,
}: {
  title: ReactNode
  currentState: ReactNode
  onClick: () => void
  testId?: string
  showArrow?: boolean
}) => (
  <SettingsButtonWrapper data-testid={testId} align="center" justify="space-between" onClick={onClick}>
    <ThemedText.SubHeaderSmall color="textPrimary">{title}</ThemedText.SubHeaderSmall>
    <LanguageLabel gap="xs" align="center" width="min-content">
      <ThemedText.LabelSmall color="textPrimary">{currentState}</ThemedText.LabelSmall>
      {showArrow && <ChevronRight size={20} />}
    </LanguageLabel>
  </SettingsButtonWrapper>
)


export default function SettingsMenu({ onClose, openLanguageSettings }: { onClose: () => void, openLanguageSettings: () => void }) {
  const activeLocale = useActiveLocale()

  return (
    <SlideOutMenu title={<Trans>Settings</Trans>} onClose={onClose}>
      <SettingsButton
              title={<Trans>Language</Trans>}
              currentState={activeLocale}
              onClick={openLanguageSettings}
              testId="language-settings-button"
            />
    </SlideOutMenu>
  )
}
