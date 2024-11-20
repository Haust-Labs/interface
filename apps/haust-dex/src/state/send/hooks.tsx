import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { useCurrencyBalances } from '../connection/hooks'
import { AppState } from '../types'
import { Field, replaceSendState, selectCurrency, setRecipient, typeAddressInput, typeInput } from './actions'
import { SendState } from './reducer'

export function useSendState(): AppState['send'] {
  return useAppSelector((state) => state.send)
}

export function useSendActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onUserInput: (field: Field, typedValue: string) => void
  onUserAddressInput: (field: Field, address: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useAppDispatch()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      console.log({field, currency}, 'sssss');
      
      dispatch(
        selectCurrency({
          field,
          currencyId: currency.isToken ? currency.address : currency.isNative ? 'HST' : '',
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onUserAddressInput = useCallback(
    (field: Field, address: string) => {
      dispatch(typeAddressInput({ field, address }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onUserAddressInput,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

export function useDerivedSendInfo(): {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
} {
  const { account } = useWeb3React()

  const {
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    address,
  } = useSendState()

  const inputCurrency = useCurrency(inputCurrencyId)

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined], [inputCurrency])
  )

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined),
    [inputCurrency, typedValue]
  )

  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
    }),
    [relevantTokenBalances]
  )

  const currencies: { [field in Field]?: Currency | null } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency,
    }),
    [inputCurrency]
  )

  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account) {
      inputError = <Trans>Connect Wallet</Trans>
    }

    if (!currencies[Field.INPUT]) {
      inputError = inputError ?? <Trans>Select a token</Trans>
    }

    if (!parsedAmount) {
      inputError = inputError ?? <Trans>Enter an amount</Trans>
    }

    const formattedTo = isAddress(address)
    if (!address || !formattedTo) {
      inputError = inputError ?? <Trans>Enter a recipient</Trans>
    } 

    return inputError
  }, [account, address, currencies, parsedAmount])

  return useMemo(
    () => ({
      currencies,
      currencyBalances,
      parsedAmount,
      inputError,
    }),
    [currencies, currencyBalances, inputError, parsedAmount]
  )
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    const upper = urlParam.toUpperCase()
    if (upper === 'BNB') return 'BNB'
    if (upper in TOKEN_SHORTHANDS) return upper
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}


const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSendState(parsedQs: ParsedQs): SendState {
  const inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency === '' ? null : inputCurrency ?? null,
    },
    typedValue,
    address: '',
    recipient,
  }
}

export function useDefaultsFromURLSearch(): SendState {
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()

  const parsedSendState = useMemo(() => {
    return queryParametersToSendState(parsedQs)
  }, [parsedQs])

  useEffect(() => {
    if (!chainId) return
    const inputCurrencyId = parsedSendState[Field.INPUT].currencyId ?? undefined

    dispatch(
      replaceSendState({
        typedValue: parsedSendState.typedValue,
        address: parsedSendState.address,
        field: Field.INPUT,
        inputCurrencyId,
        recipient: parsedSendState.recipient,
      })
    )
  }, [dispatch, chainId, parsedSendState])

  return parsedSendState
}
