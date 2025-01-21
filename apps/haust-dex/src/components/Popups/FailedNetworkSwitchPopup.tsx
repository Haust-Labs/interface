import { Trans } from '@lingui/macro'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

const ColumnContainer = styled(AutoColumn)`
  margin: 0 12px;
`

export const PopupAlertTriangle = styled(AlertTriangleFilled)`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
`

export default function FailedNetworkSwitchPopup({ chainId }: { chainId: SupportedChainId }) {
  const chainInfo = getChainInfo(chainId)

  return (
    <RowNoFlex gap="5px">
        <PopupAlertTriangle />
        <ThemedText.BodySmall color="textSecondary">
          <Trans>To use Haust DEX on {chainInfo.label}, switch the network in your wallet’s settings.</Trans>
        </ThemedText.BodySmall>
    </RowNoFlex>
  )
}
