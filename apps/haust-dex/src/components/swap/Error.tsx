import { Trans } from "@lingui/macro"
import { DialogContent } from "@reach/dialog"
import { Currency, TradeType } from "@uniswap/sdk-core"
import { ButtonError } from "components/Button"
import { ColumnCenter } from "components/Column"
import AlertTriangleFilled from "components/Icons/AlertTriangleFilled"
import { SupportedChainId } from "constants/chains"
import { SwapResult } from "hooks/useSwapCallback"
import { Text } from "rebass"
import { InterfaceTrade } from "state/routing/types"
import { ExternalLink, ThemedText } from "theme"
import { colors } from "theme/colors"
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink"

export enum PendingModalError {
  TOKEN_APPROVAL_ERROR,
  PERMIT_ERROR,
  XV2_HARD_QUOTE_ERROR,
  CONFIRMATION_ERROR,
  WRAP_ERROR,
}

interface ErrorModalContentProps {
  errorType: PendingModalError
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  showTrade?: boolean
  swapError?: string
  onRetry: () => void
}

function getErrorContent({ errorType, trade }: { errorType: PendingModalError; trade?: InterfaceTrade<Currency, Currency, TradeType> }): {
  title: JSX.Element
  message?: JSX.Element
  supportArticleURL?: string
} {
  switch (errorType) {
    case PendingModalError.TOKEN_APPROVAL_ERROR:
      return {
        title: <Trans>Token approval failed</Trans>,
        message: <Trans>This provides the Uniswap protocol access to your token for trading. For security, it expires after 30 days.</Trans>,
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: <Trans>Permit approval failed</Trans>,
        message: <Trans>Permit2 allows token approvals to be shared and managed across different applications.</Trans>,
      }
    case PendingModalError.CONFIRMATION_ERROR:
      return {
        title: <Trans>Swap failed</Trans>,
      }
    case PendingModalError.WRAP_ERROR:
      return {
        title: <Trans>Wrap failed</Trans>,
        message: <Trans>Swaps on the Haust Protocol can start and end with HAUST. However, during the swap, HAUST is wrapped into WHAUST.</Trans>,
      }
    default:
      return {
        title: <Trans>Unknown Error</Trans>,
        message: <Trans>Swap failed</Trans>,
      }
  }
}

export default function Error({ errorType, trade, showTrade, swapError, onRetry }: ErrorModalContentProps) {
  const { title, message, supportArticleURL } = getErrorContent({ errorType, trade })

  return (
      <ColumnCenter gap="sm">
        <AlertTriangleFilled size="30px" />
        <ThemedText.HeadlineSmall>{title}</ThemedText.HeadlineSmall>
        {message && <ThemedText.BodyPrimary>{message}</ThemedText.BodyPrimary>}
        {swapError && <ThemedText.BodyPrimary color="critical">{swapError}</ThemedText.BodyPrimary>}
        
        <ButtonError onClick={onRetry} marginTop="20px">
          <Text fontSize={20} fontWeight={500} id="confirm-expert-mode">
              <Trans>Try again</Trans>
          </Text>
        </ButtonError>

        {supportArticleURL && (
          <ExternalLink href={supportArticleURL}>
            <ThemedText.LabelSmall>
              <Trans>Learn more</Trans>
            </ThemedText.LabelSmall>
          </ExternalLink>
        )}
      </ColumnCenter>
  )
}
