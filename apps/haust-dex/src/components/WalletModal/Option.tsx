import Loader from 'components/Icons/LoadingSpinner'
import { Connection, ConnectionType } from 'connection'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'

import NewBadge from './NewBadge'
import { DetectedBadge } from './shared'

const OptionCardLeft = styled.div`
  ${flexColumnNoWrap};
  flex-direction: row;
  align-items: center;
`

const OptionCardClickable = styled.button<{ isActive?: boolean; clickable?: boolean }>`
  background-color: ${({ theme }) => theme.backgroundModule};
  width: 100% !important;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.neutralBorder};
  padding: 12px 16px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  margin-top: 0;
  transition: ${({ theme }) => theme.transition.duration.fast};
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  &:hover {
    cursor: ${({ clickable }) => clickable && 'pointer'};
    background-color: ${({ theme, clickable }) => clickable && theme.hoverState};
  }
  &:focus {
    background-color: ${({ theme, clickable }) => clickable && theme.hoverState};
  }
`

const HeaderText = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.accentAction : ({ theme }) => theme.textPrimary)};
  font-size: 16px;
  font-weight: 600;
  padding: 0 8px;
`

const IconWrapper = styled.div`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: 40px;
    width: 40px;
    border-radius: 50%;
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

type OptionProps = {
  connection: Connection
  activate: () => void
  pendingConnectionType?: ConnectionType
  isDetected?: boolean;
}
export default function Option({ connection, pendingConnectionType, activate, isDetected }: OptionProps) {
  const isPending = pendingConnectionType === connection.type
  const isDarkMode = useIsDarkMode()
  return (
    <OptionCardClickable
      onClick={!pendingConnectionType ? activate : undefined}
      clickable={!pendingConnectionType}
      disabled={Boolean(!isPending && !!pendingConnectionType)}
      data-testid="wallet-modal-option"
    >
      <OptionCardLeft>
        <IconWrapper>
          <img src={connection.getIcon?.(isDarkMode)} alt="Icon" />
        </IconWrapper>
        <HeaderText>{connection.getName()}</HeaderText>
        {connection.isNew && <NewBadge />}
      </OptionCardLeft>
      {isPending && <Loader />}
      {isDetected && <DetectedBadge />}
    </OptionCardClickable>
  )
}
