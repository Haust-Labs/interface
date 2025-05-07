import { Trans } from '@lingui/macro'
import { AlertTriangle, Slash } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { MouseoverTooltip } from '../../components/Tooltip'

const BadgeWrapper = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: flex-start;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  margin-right: 8px;
`

const ActiveDot = styled.span<{ $backgroundColor?: string }>`
  background-color: ${({ $backgroundColor, theme }) => $backgroundColor ?? theme.accentSuccess};
  border-radius: 50%;
  height: 8px;
  width: 8px;
`

const LabelText = styled.div<{ color: string }>`
  align-items: center;
  color: ${({ color }) => color};
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 4px;
`

export default function RangeBadge({
  removed,
  inRange,
  staked,
}: {
  removed: boolean | undefined
  inRange: boolean | undefined
  staked?: boolean | undefined
}) {
  const theme = useTheme()
  return (
    <BadgeWrapper>
      {removed ? (
        <MouseoverTooltip text={<Trans>Your position has 0 liquidity, and is not earning fees.</Trans>}>
          <LabelText color={theme.textSecondary}>
            <ActiveDot $backgroundColor={theme.textSecondary} />
            <BadgeText>
              <Trans>Closed</Trans>
            </BadgeText>
          </LabelText>
        </MouseoverTooltip>
      ) : staked ? (
        <MouseoverTooltip text='This position is staked and earning additional rewards.'>
          <LabelText color={theme.accentAction}>
            <ActiveDot $backgroundColor={theme.accentAction} />
            <BadgeText>
                Staked
            </BadgeText>
          </LabelText>
        </MouseoverTooltip>
      ) : inRange ? (
        <MouseoverTooltip
          text={
            <Trans>
              The price of this pool is within your selected range. Your position is currently earning fees.
            </Trans>
          }
        >
          <LabelText color={theme.accentSuccess}>
            <ActiveDot $backgroundColor={theme.accentSuccess} />
            <BadgeText>
              <Trans>In range</Trans>
            </BadgeText>
          </LabelText>
        </MouseoverTooltip>
      ) : (
        <MouseoverTooltip
          text={
            <Trans>
              The price of this pool is outside of your selected range. Your position is not currently earning fees.
            </Trans>
          }
        >
          <LabelText color={theme.accentWarning2}>
          <ActiveDot $backgroundColor={theme.accentCritical} />
            <BadgeText>
              <Trans>Out of range</Trans>
            </BadgeText>
          </LabelText>
        </MouseoverTooltip>
      )}
    </BadgeWrapper>
  )
}
