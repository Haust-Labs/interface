import { Flex } from "components/layout/Flex"
import { useTDPContext } from "pages/TokenDetails/TDPContext"
import { useState } from "react"
import styled, { useTheme } from "styled-components/macro"
import { TransactionsTable } from "./tables/TransactionsTable"
import { TokenDetailsPoolsTable } from "./tables/TokenDetailsPoolsTable"
import { colors } from "theme/colors"

const Container = styled(Flex)`
  width: '100%',
`

const Tab = styled.div`
  text-decoration: none;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 20px;
  font-weight: 485;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  cursor: pointer;

  &[data-active='true'] {
    color: ${({ theme }) => theme.textPrimary};
  }

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
  }
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
      <Flex row gap="24px" id="activity-header" style={{ marginBottom: '16px', marginTop: '40px' }}>
        <Tab
          data-active={activityInView === ActivityTab.Txs}
          onClick={() => setActivityInView(ActivityTab.Txs)}
        >
          Transactions
        </Tab>
        <Tab
          data-active={activityInView === ActivityTab.Pools}
          onClick={() => setActivityInView(ActivityTab.Pools)}
        >
          Pools
        </Tab>
      </Flex>
      {activityInView === ActivityTab.Txs && <TransactionsTable referenceToken={address} />}
      {activityInView === ActivityTab.Pools && (
        <TokenDetailsPoolsTable referenceToken={address} />
      )}
    </Container>
  )
}
