import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ReactNode, useCallback } from 'react'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal'

interface ConfirmWrapModalProps {
  isOpen: boolean
  onDismiss: () => void
  attemptingTxn: boolean
  txHash?: string
  onConfirm: () => void
  wrapErrorMessage?: ReactNode
  isWrap: boolean // true for wrap, false for unwrap
  inputAmount?: CurrencyAmount<Currency>
  fiatValue?: { data?: number; isLoading: boolean }
}

export default function ConfirmWrapModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  txHash,
  onConfirm,
  wrapErrorMessage,
  isWrap,
  inputAmount,
  fiatValue,
}: ConfirmWrapModalProps) {
  // text to show while loading
  const pendingText = (
    <Trans>
      {isWrap ? 'Wrapping' : 'Unwrapping'} {inputAmount?.toSignificant(6)} {inputAmount?.currency?.symbol}
    </Trans>
  )

  const modalBottom = useCallback(() => {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Trans>
            {isWrap ? 'Wrapping' : 'Unwrapping'} {inputAmount?.toSignificant(6)} {inputAmount?.currency?.symbol}
          </Trans>
        </div>
        {!wrapErrorMessage && (
          <button
            onClick={onConfirm}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            <Trans>Confirm {isWrap ? 'Wrap' : 'Unwrap'}</Trans>
          </button>
        )}
      </div>
    )
  }, [inputAmount, isWrap, onConfirm, wrapErrorMessage])

  const confirmationContent = useCallback(
    () =>
      wrapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={wrapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={<Trans>Confirm {isWrap ? 'Wrap' : 'Unwrap'}</Trans>}
          onDismiss={onDismiss}
          topContent={() => (
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '8px' }}>
                <Trans>Amount</Trans>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 500 }}>
                {inputAmount?.toSignificant(6)} {inputAmount?.currency?.symbol}
              </div>
              {fiatValue?.data && (
                <div style={{ fontSize: '14px', color: 'textSecondary' }}>
                  ≈ ${fiatValue.data.toFixed(2)}
                </div>
              )}
            </div>
          )}
          bottomContent={modalBottom}
        />
      ),
    [wrapErrorMessage, onDismiss, isWrap, inputAmount, fiatValue, modalBottom]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      currencyToAdd={inputAmount?.currency}
    />
  )
}
