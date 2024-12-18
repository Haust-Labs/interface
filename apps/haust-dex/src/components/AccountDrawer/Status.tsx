import { AddressDisplay } from "components/AddressDisplay"
import StatusIcon from "components/Identicon/StatusIcon"
import { Connection } from "connection"
import styled from "styled-components/macro"
import { ThemedText } from "theme"

const Container = styled.div`
  display: flex;
  padding-right: 8px;
`

export function Status({
  account,
  showAddressCopy = true,
  connection,
}: {
  connection: Connection
  account: string
  showAddressCopy?: boolean
}) {
  return (
    <Container data-testid="account-drawer-status">
      <StatusIcon connection={connection} size={40} />
        <ThemedText.SubHeader display="flex" alignItems="center" justifyContent="center">
          <AddressDisplay enableCopyAddress={showAddressCopy} address={account} />
        </ThemedText.SubHeader>
    </Container>
  )
}
