import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'

import { Field, replaceSendState, selectCurrency, setRecipient, typeAddressInput, typeInput } from './actions'
import { queryParametersToSendState } from './hooks'

export interface SendState {
  readonly typedValue: string
  readonly address: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined | null
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
}

const initialState: SendState = queryParametersToSendState(parsedQueryString())

export default createReducer<SendState>(initialState, (builder) =>
  builder
    .addCase(
      replaceSendState,
      (state, { payload: { typedValue, address, recipient, field, inputCurrencyId } }) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId ?? null,
          },
          independentField: field,
          typedValue,
          recipient,
          address
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
        return {
          ...state,
          [field]: { currencyId },
        }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
    .addCase(typeAddressInput, (state, { payload: { field, address } }) => {
      return {
        ...state,
        independentField: field,
        address,
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
