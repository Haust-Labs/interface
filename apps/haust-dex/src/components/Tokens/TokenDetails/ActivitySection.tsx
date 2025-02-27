import { Flex } from "components/layout/Flex"
import { useTDPContext } from "pages/TokenDetails/TDPContext"
import { useState } from "react"
import styled from "styled-components/macro"
import { TokenDetailsPoolsTable } from "./tables/TokenDetailsPoolsTable"

const Container = styled(Flex)`
  width: '100%',
`

const Tab = styled.div`
  color: '$neutral1',
  variant: 'heading3',
  ...ClickableTamaguiStyle,
`

enum ActivityTab {
  Txs,
  Pools,
}
export function ActivitySection() {
  const { address } = useTDPContext()

  const [activityInView, setActivityInView] = useState(ActivityTab.Txs)

  if (!address) {
    return null
  }
  return (
    <Container data-testid="token-details-activity-section">
      <Flex row gap="$spacing24" id="activity-header">
        <Tab
          color={activityInView === ActivityTab.Txs ? '$neutral1' : '$neutral2'}
          onClick={() => setActivityInView(ActivityTab.Txs)}
        >
          Transactions
        </Tab>
        <Tab
          color={activityInView === ActivityTab.Pools ? '$neutral1' : '$neutral2'}
          onClick={() => setActivityInView(ActivityTab.Pools)}
        >
          Pools
        </Tab>
      </Flex>
      {/* {activityInView === ActivityTab.Txs && <TransactionsTable chainId={chainId} referenceToken={address} />} */}
      {activityInView === ActivityTab.Pools && (
        <TokenDetailsPoolsTable referenceToken={address} />
      )}
    </Container>
  )
}
