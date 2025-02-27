import AlertTriangleFilled from "components/Icons/AlertTriangleFilled"
import { LoaderV2 } from "components/Icons/LoadingSpinner"
import { useTimeSince } from "./parseRemote"
import { EllipsisStyle, ThemedText } from "theme"
import styled from "styled-components/macro"
import { TransactionStatus } from "./types"
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink"
import { useCallback } from "react"
import PortfolioRow from "../PortfolioRow"
import Column from "components/Column"
import { PortfolioLogo } from "../PortfolioLogo"
import Row from "components/Row"
import { Activity } from "./types"


const ActivityRowDescriptor = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.textSecondary};
  ${EllipsisStyle}
`

const StyledTimestamp = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.textSecondary};
  line-height: 24px;
  font-variant: small;
  font-feature-settings:
    'tnum' on,
    'lnum' on,
    'ss02' on;
`

function StatusIndicator({ activity: { status, timestamp } }: { activity: Activity  }) {
  const timeSince = useTimeSince(timestamp)

  switch (status) {
    case TransactionStatus.Pending:
      return <LoaderV2 />
    case TransactionStatus.Confirmed:
      return <StyledTimestamp>{timeSince}</StyledTimestamp>
    case TransactionStatus.Failed:
      return <AlertTriangleFilled />
  }
}

// TODO WEB-4550 - Fix regression where ENS name is not displayed in activity row
export function ActivityRow({ activity }: { activity: Activity }) {
  const {
    chainId,
    title,
    descriptor,
    otherAccount,
    currencies,
    hash,
    prefixIconSrc,
    suffixIconSrc,
    logos,
    type,
  } = activity


  const explorerUrl = getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)

  const onClick = useCallback(() => {
    // Do not allow FOR activity to be opened until confirmed on chain
    if (activity.status === TransactionStatus.Pending) {
      return
    }

    window.open(explorerUrl, '_blank')
  }, [activity.status, explorerUrl])

  return (
      <PortfolioRow
        left={
          <Column>
            <PortfolioLogo
              chainId={chainId}
              currencies={currencies}
              images={logos}
              accountAddress={otherAccount}
            />
          </Column>
        }
        title={
          <Row align="space-between" justify-content="center">
            <Row gap="4px">
              {prefixIconSrc && <img height="14px" width="14px" src={prefixIconSrc} alt="" />}
              <ThemedText.SubHeader>{title}</ThemedText.SubHeader>
              {suffixIconSrc && <img height="14px" width="14px" src={suffixIconSrc} alt="" />}
            </Row>
            <StatusIndicator activity={activity} />
          </Row>
        }
        descriptor={<ActivityRowDescriptor color="neutral2">{descriptor}</ActivityRowDescriptor>}
        onClick={onClick}
      />
  )
}
