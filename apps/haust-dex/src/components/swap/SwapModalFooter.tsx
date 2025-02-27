import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'

import { ButtonError } from '../Button'
import { SwapCallbackError } from './styleds'
import { AutoColumn } from 'components/Column'

export default function SwapModalFooter({
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
  swapQuoteReceivedDate: Date | undefined
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  return (
    <AutoColumn gap="12px">
      <ButtonError
        onClick={onConfirm}
        disabled={disabledConfirm}
        error={swapErrorMessage ? true : false}
      >
        <Text fontSize={20} fontWeight={500}>
          <Trans>Confirm Swap</Trans>
        </Text>
      </ButtonError>

      {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
    </AutoColumn>
  )
}
