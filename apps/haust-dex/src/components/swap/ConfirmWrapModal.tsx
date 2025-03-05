import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ReactNode, useCallback, useMemo } from 'react'

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
  const pendingText = useMemo(() => (
    <div>
      {isWrap ? 'Wrapping' : 'Unwrapping'} {inputAmount?.toSignificant(6)} {inputAmount?.currency?.symbol}
    </div>
  ), [isWrap, inputAmount])

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
            <></>
          )}
          bottomContent={modalBottom}
        />
      ),
    [wrapErrorMessage, onDismiss, isWrap, modalBottom]
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
