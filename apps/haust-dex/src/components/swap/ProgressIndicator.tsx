import Column from 'components/Column'
import styled, { useTheme } from 'styled-components/macro'
import { ConfirmModalState } from './ConfirmSwapModal'
import { InterfaceTrade } from 'state/routing/types'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { SwapResult } from 'hooks/useSwapCallback'
import { useWeb3React } from '@web3-react/core'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useColor } from 'hooks/useColor'
import { useBlockConfirmationTime } from 'hooks/useBlockConfirmationTime'
import { useEffect, useMemo, useState } from 'react'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { colors } from 'theme/colors'
import { DivideSquare } from 'react-feather'
import { Step, StepDetails } from './Step'
import { StepStatus } from './types'
import { Sign } from 'components/Icons/Sign'
import { Swap } from 'components/Icons/Swap'

const Edge = styled.div`
  width: 2px;
  height: 14px;
  background-color: ${({ theme }) => theme.neutralBorder};
  margin: 10px 32px;
`
const DividerLine = styled.div`
  width: 95%;
  height: 1px;
  background-color: ${({ theme }) => theme.neutralBorder};
  margin: 16px auto;
`
type ProgressIndicatorStep = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.PERMITTING
>
export default function ProgressIndicator({
  steps,
  currentStep,
  trade,
  swapResult,
  wrapTxHash,
  tokenApprovalPending = false,
  revocationPending = false,
  swapError,
  onRetryUniswapXSignature,
  isPendingSwap,
}: {
  steps: ProgressIndicatorStep[]
  currentStep: ProgressIndicatorStep
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  swapResult?: SwapResult
  wrapTxHash?: string
  tokenApprovalPending?: boolean
  revocationPending?: boolean
  swapError?: Error | string
  isPendingSwap?: boolean
  onRetryUniswapXSignature?: () => void
}) {
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()
  const inputTokenColor = useColor(trade?.inputAmount.currency.wrapped)
  const theme = useTheme()

  // Dynamic estimation of transaction wait time based on confirmation of previous block
  const { blockConfirmationTime } = useBlockConfirmationTime()
  const [estimatedTransactionTime, setEstimatedTransactionTime] = useState<number>()
  useEffect(() => {
    // Value continuously updates as new blocks get confirmed
    // Only set step timers once to prevent resetting
    if (blockConfirmationTime && !estimatedTransactionTime) {
      // Add buffer to account for variable confirmation
      setEstimatedTransactionTime(Math.ceil(blockConfirmationTime * 1.2))
    }
  }, [blockConfirmationTime, estimatedTransactionTime])

  const transactionPending = revocationPending || tokenApprovalPending || isPendingSwap

  // Retry logic for UniswapX orders when a signature expires
  // const [signatureExpiredErrorId, setSignatureExpiredErrorId] = useState('')
  // useEffect(() => {
  //   if (swapError instanceof SignatureExpiredError && swapError.id !== signatureExpiredErrorId) {
  //     setSignatureExpiredErrorId(swapError.id)
  //     onRetryUniswapXSignature?.()
  //   }
  // }, [onRetryUniswapXSignature, signatureExpiredErrorId, swapError])

  function getStatus(targetStep: ProgressIndicatorStep) {
    const currentIndex = steps.indexOf(currentStep)
    const targetIndex = steps.indexOf(targetStep)
    if (currentIndex < targetIndex) {
      return StepStatus.Preview
    } else if (currentIndex === targetIndex) {
      return transactionPending ? StepStatus.InProgress : StepStatus.Active
    } else {
      return StepStatus.Complete
    }
  }

  const stepDetails: Record<ProgressIndicatorStep, StepDetails> = useMemo(
    () => ({
      [ConfirmModalState.APPROVING_TOKEN]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} size="36px" />,
        rippleColor: inputTokenColor,
        previewTitle: `Approve in wallet`,
        actionRequiredTitle: `Approve in wallet`,
        inProgressTitle: `Approve in wallet`,
        learnMoreLinkText: `Why do I have to approve a token?`,
        learnMoreLinkHref: 'uniswapUrls.helpArticleUrls.approvalsExplainer',
      },
      [ConfirmModalState.PERMITTING]: {
        icon: <Sign />,
        rippleColor: theme.accentAction,
        previewTitle: `Sign message`,
        actionRequiredTitle: `Sign message in wallet`,
        inProgressTitle: `Sign message in wallet`,
        learnMoreLinkText: `Why are signatures required?`,
        learnMoreLinkHref: 'uniswapUrls.helpArticleUrls.approvalsExplainer',
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: {
        icon: <Swap />,
        rippleColor: theme.accentAction,
        previewTitle: `Confirm swap`,
        actionRequiredTitle: `Confirm swap in wallet`,
        inProgressTitle: `Confirm swap in wallet`,
        learnMoreLinkText: `Learn more about swaps`,
        learnMoreLinkHref: `uniswapUrls.helpArticleUrls.limitsInfo`,
      },
    }),
    [trade, inputTokenColor, theme.accentAction],
  )

  if (steps.length === 0) {
    return null
  }

  return (
    <Column>
      <DividerLine />
      {steps.map((step, i) => (
        <div key={`progress-indicator-step-${i}`}>
          <Step
            stepStatus={getStatus(step)}
            stepDetails={stepDetails[step]}
          />
          {i !== steps.length - 1 && <Edge />}
        </div>
      ))}
    </Column>
  )
}
