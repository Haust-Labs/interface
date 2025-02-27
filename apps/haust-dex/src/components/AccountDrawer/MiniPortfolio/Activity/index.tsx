import { Trans } from '@lingui/macro'
import { useAccountDrawer, useToggleAccountDrawer } from 'components/AccountDrawer'
import { Flex } from 'components/layout/Flex'
import { LoadingBubble } from 'components/Tokens/loading'
import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'
import { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import Column from 'components/Column'
import { ActivityRow } from './ActivityRow'
import styled from 'styled-components'
import { useActivities, useLocalActivities } from './parseLocal'

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

const TIME_GROUP_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  thisYear: 'This Year',
}

export function ActivityTab({ account }: { account: string }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const activities = useActivities(account)

  if (!activities || Object.values(activities).every(group => !group || group.length === 0)) {
    return (
      <>
        <EmptyWalletModule type="activity" onNavigateClick={toggleWalletDrawer} />
      </>
    )
  }

  const getDisplayTitle = (key: string) => {
    return TIME_GROUP_LABELS[key] || key
  }

  const orderedGroups = [
    'today',
    'yesterday',
    'thisWeek',
    'thisMonth',
    'thisYear',
    ...Object.keys(activities)
      .filter(key => !TIME_GROUP_LABELS[key])
      .sort((a, b) => Number(b) - Number(a))
  ]

  return (
    <>
      <PortfolioTabWrapper>
        {orderedGroups.map((groupKey) => {
          const groupActivities = activities[groupKey]
          if (!groupActivities || groupActivities.length === 0) return null

          return (
            <ActivityGroupWrapper key={groupKey}>
              <ThemedText.SubHeader color="neutral2" marginLeft="16px">
                {getDisplayTitle(groupKey)}
              </ThemedText.SubHeader>
              <Column data-testid="activity-content">
                {groupActivities.map((activity) => (
                  <ActivityRow key={activity.hash} activity={activity} />
                ))}
              </Column>
            </ActivityGroupWrapper>
          )
        })}
      </PortfolioTabWrapper>
    </>
  )
}