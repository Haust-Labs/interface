import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { ReactNode, useCallback, useMemo, useState, useEffect } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult } from 'hooks/useSwapCallback'
import { useConfirmModalState } from 'hooks/useConfirmModalState'
import SwapError, { PendingModalError } from './Error'
import ProgressIndicator from './ProgressIndicator'
import { Pending } from './Pending'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { SwapModal } from './Modal'
import styled from 'styled-components/macro'
import { SwapHead } from './Head'
import { SwapPreview } from './SwapPreview'
import { FadePresence } from 'theme/components/FadePresence'
import { AutoColumn } from 'components/Column'
import { SwapDetails } from './SwapDetails'

const Container = styled.div<{ $height?: string; $padding?: string }>`
  height: ${({ $height }) => $height ?? ''};
  padding: ${({ $padding }) => $padding ?? ''};
`

export enum ConfirmModalState {
  REVIEWING,
  APPROVING_TOKEN,
  PENDING_CONFIRMATION,
  PERMITTING,
}

interface ConfirmSwapModalProps {
  isOpen: boolean
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  originalTrade: Trade<Currency, Currency, TradeType> | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  allowedSlippage: Percent
  onAcceptChanges: () => void
  onConfirm: () => void
  clearSwapState: () => void
  onDismiss: () => void
  swapQuoteReceivedDate: Date | undefined
  swapResult?: SwapResult
  allowance: Allowance
  swapError?: string
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  isOpen,
  attemptingTxn,
  txHash,
  swapResult,
  allowance,
  clearSwapState,
  swapError,
}: ConfirmSwapModalProps) {
  const {
    currentState,
    pendingSteps,
    // priceUpdate,
    approvalError,
    wrapTxHash,
    startSwapFlow,
    onCancel,
    resetToReviewScreen,
  } = useConfirmModalState({
    trade,
    originalTrade,
    allowance,
    allowedSlippage,
    onSwap: () => {
      clearSwapState()
      onConfirm()
    },
  })
 
  const swapStatus = useIsTransactionConfirmed(txHash)
  const swapConfirmed = swapStatus
  const localSwapFailure = Boolean(swapError) && !didUserReject(swapError)

  const errorType = useMemo(() => {
    if (approvalError) {
      return approvalError
    }
    if (swapError && !didUserReject(swapError)) {
      return PendingModalError.CONFIRMATION_ERROR
    }
    return undefined
  }, [approvalError, swapError])

  const { showPreview, showDetails, showProgressIndicator, showAcceptChanges, showConfirming, showSuccess, showError } =
  useMemo(() => {
    const showAcceptChanges = currentState !== ConfirmModalState.PENDING_CONFIRMATION && Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade))
    let showPreview, showDetails, showProgressIndicator, showConfirming, showSuccess, showError
    if (errorType) {
      // When any type of error is encountered (except for SignatureExpiredError, which has special retry logic)
      showError = true
    } else if (swapConfirmed) {
      showSuccess = true
    } else if (currentState === ConfirmModalState.REVIEWING || showAcceptChanges) {
      // When swap is in review, either initially or to accept changes, show the swap details
      showPreview = true
      showDetails = true
    } else if (pendingSteps.length > 1) {
      // When a multi-step swap is in progress (i.e. not in review and not yet confirmed), show the progress indicator
      showPreview = true
      showProgressIndicator = true
    } else {
      // When a single-step swap requires confirmation, show a loading spinner (possibly followed by a submission icon)
      showPreview = true
      showConfirming = true
    }
    return {
      showPreview,
      showDetails,
      showProgressIndicator,
      showAcceptChanges,
      showConfirming,
      showSuccess,
      showError,
    }
  }, [currentState, originalTrade, pendingSteps.length, swapConfirmed, trade, errorType])

  useEffect(() => {
    if (swapError && !localSwapFailure) {
      onCancel()
    }
  }, [onCancel, swapError, localSwapFailure])

  useEffect(() => {
    if (swapConfirmed && !attemptingTxn) {
      console.log('Transaction confirmed, resetting states and closing modal')
      onDismiss() 
      resetToReviewScreen()
    }
  }, [swapConfirmed, attemptingTxn, onDismiss, resetToReviewScreen])

  const onModalDismiss = useCallback(() => {
    onDismiss()
    setTimeout(() => {
      // Reset local state after the modal dismiss animation finishes, to avoid UI flicker as it dismisses
      onCancel()
    }, 200)
  }, [onDismiss, onCancel])

  return (
    <SwapModal isOpen={isOpen} onDismiss={onModalDismiss}>
        <Container $height="24px" $padding="6px 12px 4px 12px">
          <SwapHead
            onDismiss={onModalDismiss}
            swapError={swapError}
          />
        </Container>
        {showPreview && 
            (trade ? <SwapPreview trade={trade} /> : null)
        }
        {showDetails && (
          <Container>
            <FadePresence>
              <AutoColumn gap="md">
                {trade ? <SwapDetails
                  onConfirm={() => {
                    startSwapFlow()
                  }}
                  trade={trade}
                  allowance={allowance}
                  allowedSlippage={allowedSlippage}
                  isLoading={!trade}
                  disabledConfirm={
                    showAcceptChanges || allowance.state === AllowanceState.LOADING
                  }
                  showAcceptChanges={Boolean(showAcceptChanges)}
                  onAcceptChanges={onAcceptChanges}
                  swapErrorMessage={swapError}
                /> : null}
              </AutoColumn>
            </FadePresence>
          </Container>
        )}
        {/* Progress indicator displays all the steps of the swap flow and their current status  */}
        {currentState !== ConfirmModalState.REVIEWING && showProgressIndicator && (
          <Container>
            <FadePresence>
              <ProgressIndicator
                steps={pendingSteps}
                currentStep={currentState}
                trade={trade}
                swapResult={swapResult}
                wrapTxHash={wrapTxHash}
                tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
                swapError={swapError}
                onRetryUniswapXSignature={onConfirm}
              />
            </FadePresence>
          </Container>
        )}
        {/* Pending screen displays spinner for single-step confirmations, as well as success screen for all flows */}
        {(showConfirming || showSuccess) && (
          <Container>
            <FadePresence>
              <Pending
                trade={trade}
                txHash={txHash}
                tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
              />
            </FadePresence>
          </Container>
        )}
        {/* Error screen handles all error types with custom messaging and retry logic */}
        {errorType && showError && (
          <Container $padding="16px">
            <SwapError
              trade={trade}
              showTrade={true}
              swapError={swapError}
              errorType={errorType}
              onRetry={() => {
                  startSwapFlow()
              }}
            />
          </Container>
        )}
    </SwapModal>
  )
}
