import Column, { ColumnCenter } from "components/Column"
import styled, { css } from "styled-components/macro"
import { AnimationType } from "theme/components/FadePresence"
import { slideInAnimation, slideOutAnimation } from "./animations"
import { InterfaceTrade } from "state/routing/types"
import { Currency, TradeType } from "@uniswap/sdk-core"
import { ReactNode, useMemo, useRef } from "react"
import { SwapResult } from "hooks/useSwapCallback"
import { useWeb3React } from "@web3-react/core"
import { useUnmountingAnimation } from "hooks/useUnmountingAnimation"
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink"
import { SupportedChainId } from "constants/chains"
import { ExternalLink, ThemedText } from "theme"
import Row from "components/Row"
import { Trans } from "@lingui/macro"
import { AnimatedEntranceConfirmationIcon, AnimatedEntranceSubmittedIcon, LoadingIndicatorOverlay, LogoContainer } from "./Logos"
import { TransactionStatus } from "components/AccountDrawer/MiniPortfolio/Activity/types"
import { useIsTransactionConfirmed } from "state/transactions/hooks"
import { ButtonError } from "components/Button"
import { colors } from "theme/colors"
import { opacify } from "theme/utils"

const Container = styled(ColumnCenter)`
  margin: 48px 0 8px;
`
const HeaderContainer = styled(ColumnCenter)<{ $disabled?: boolean }>`
  ${({ $disabled }) => $disabled && `opacity: 0.5;`}
  padding: 0 32px;
  overflow: visible;
`
const AnimationWrapper = styled.div`
  position: relative;
  width: 100%;
  min-height: 72px;
  display: flex;
  flex-grow: 1;
`
const StepTitleAnimationContainer = styled(Column)<{ disableEntranceAnimation?: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: display ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  ${({ disableEntranceAnimation }) =>
    !disableEntranceAnimation &&
    css`
      ${slideInAnimation}
    `
  }

  &.${AnimationType.EXITING} {
    ${slideOutAnimation}
  }
`

const ButtonContainer = styled(ColumnCenter)`
  margin: 0;
  padding: 0;
  width: 100%;

`

const CompactHeaderContainer = styled(ColumnCenter)<{ $disabled?: boolean }>`
  ${({ $disabled }) => $disabled && `opacity: 0.5;`}
  padding: 0;
  overflow: visible;
`

const CompactAnimationWrapper = styled.div`
  position: relative;
  width: 100%;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`

function getTitle({
  trade,
  swapPending,
  swapConfirmed,
}: {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  swapPending: boolean
  swapConfirmed: boolean
}): ReactNode {
  if (swapPending) {
    return 'Swap submitted'
  }
  if (swapConfirmed) {
    return 'Swap successful'
  }

  return 'Confirm swap'
}

export function Pending({
  trade,
  tokenApprovalPending = false,
  revocationPending = false,
  txHash,
}: {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  tokenApprovalPending?: boolean
  revocationPending?: boolean
  txHash?: string
}) {
  // This component is only rendered after the user signs, so we don't want to
  // accept new trades with different quotes. We should only display the quote
  // price that the user actually submitted.
  // TODO(WEB-3854): Stop requesting new swap quotes after the user submits the transaction.
  const initialTrade = useRef(trade).current

  const confirmed = useIsTransactionConfirmed(txHash)


  const swapPending = txHash !== undefined && !confirmed
  const transactionPending = revocationPending || tokenApprovalPending || swapPending

  const showSubmitted = swapPending && !confirmed
  const showSuccess = confirmed || swapPending

  const currentStepContainerRef = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(currentStepContainerRef, () => AnimationType.EXITING)

return (
<ButtonError disabled={true} style={{ marginTop: '20px', backgroundColor: opacify(30, colors.neutralBorder) }}>
      <CompactHeaderContainer gap="sm" $disabled={transactionPending}>
        <CompactAnimationWrapper>
          <StepTitleAnimationContainer gap="sm" ref={currentStepContainerRef} disableEntranceAnimation>
            <Row gap="8px" style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', marginTop: '4px' }}>
                {showSubmitted && <AnimatedEntranceSubmittedIcon />}
                {!showSuccess && !showSubmitted && <LoadingIndicatorOverlay />}
              </div>
              <ThemedText.SubHeader style={{ color: colors.neutralLightest }}>
                {getTitle({ trade: initialTrade, swapPending, swapConfirmed: confirmed })}
              </ThemedText.SubHeader>
            </Row>
          </StepTitleAnimationContainer>
        </CompactAnimationWrapper>
      </CompactHeaderContainer>
    </ButtonError>
  )
}
