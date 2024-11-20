import { Web3Provider } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { TOKEN_SHORTHANDS } from 'constants/tokens'
import { useCurrency, useDefaultActiveTokens } from 'hooks/Tokens'
import { useSendCallback } from 'hooks/useSendCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { Field } from 'state/send/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSendInfo,
  useSendActionHandlers,
  useSendState,
} from 'state/send/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { supportedChainId } from 'utils/supportedChainId'
import { useCreateTransferTransaction } from 'utils/transfer'

import SendAddressInputPanel from './SendAddressInputPanel'
import SendCurrencyInputPanel from './SendCurrencyInputPanel'
import { SendReviewModal } from './SendReviewModal'

enum SendFormModalState {
  None = 'None',
  REVIEW = 'REVIEW',
}

export default function SendCurrencyInputForm() {
  const navigate = useNavigate()
  const { account, chainId, provider } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const [sendFormModalState, setSendFormModalState] = useState(SendFormModalState.None)

  // token warning stuff
  const [loadedInputCurrency] = [
    useCurrency(loadedUrlParams?.[Field.INPUT]?.currencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useDefaultActiveTokens()
  const importTokensNotInDefault = useMemo(
    () =>
      urlLoadedTokens &&
      urlLoadedTokens
        .filter((token: Token) => {
          return !(token.address in defaultTokens)
        })
        .filter((token: Token) => {
          // Any token addresses that are loaded from the shorthands map do not need to show the import URL
          const supported = supportedChainId(chainId)
          if (!supported) return true
          return !Object.keys(TOKEN_SHORTHANDS).some((shorthand) => {
            const shorthandTokenAddress = TOKEN_SHORTHANDS[shorthand][supported]
            return shorthandTokenAddress && shorthandTokenAddress === token.address
          })
        }),
    [chainId, defaultTokens, urlLoadedTokens]
  )

  // toggle wallet when disconnected
  const toggleWalletDrawer = useToggleAccountDrawer()

  const { typedValue, address } = useSendState()
  const {
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSendInfo()

  const fiatValueInput = useUSDPrice(parsedAmount)


  const { onCurrencySelection, onUserInput, onUserAddressInput } = useSendActionHandlers()
  const isValid = !swapInputError

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const handleTypeAddressInput = useCallback(
    (value: string) => {
      onUserAddressInput(Field.ADDRESS, value)
    },
    [onUserAddressInput]
  )

  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    navigate('/send/')
  }, [navigate])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmount?.equalTo(maxInputAmount))

  const handleModalState = useCallback((newState?: SendFormModalState) => {
    setSendFormModalState(newState ?? SendFormModalState.None)
  }, [])

  const [{ txHash }, setSendState] = useState<{
    txHash: string | undefined
  }>({
    txHash: undefined,
  })

  const transferInfo = useMemo(() => {
    return {
      provider,
      account: account as string,
      chainId,
      currencyAmount: parsedAmount,
      toAddress: address,
    }
  }, [account, address, chainId, parsedAmount, provider])
  const transferTransaction = useCreateTransferTransaction(transferInfo)

  // the callback to execute the send
  const sendCallback = useSendCallback({
    transactionRequest: transferTransaction,
    provider: provider as Web3Provider,
  })
  
  const handleSend = useCallback(() => {
    sendCallback()
      .then(() => {
        handleModalState(SendFormModalState.None)
        onUserInput(Field.INPUT, '')
        onUserAddressInput(Field.ADDRESS, '')
      })
      .catch(() => undefined)
  }, [handleModalState, onUserAddressInput, onUserInput, sendCallback])


  const handleConfirmDismiss = useCallback(() => {
    setSendState({ txHash })
    handleModalState(SendFormModalState.None)    
    if (txHash) {
      onUserInput(Field.INPUT, '')
      onUserAddressInput(Field.ADDRESS, '')
    }
  }, [handleModalState, onUserAddressInput, onUserInput, txHash])


  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {       
      return (
      onCurrencySelection(Field.INPUT, inputCurrency)
    )},
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
  }, [maxInputAmount, onUserInput])

  return (
    <>
      <TokenSafetyModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokenAddress={importTokensNotInDefault[0]?.address}
        secondTokenAddress={importTokensNotInDefault[1]?.address}
        onContinue={handleConfirmTokenWarning}
        onCancel={handleDismissTokenWarning}
        showCancel={true}
      />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SendCurrencyInputPanel
                value={typedValue}
                showMaxButton={showMaxButton}
                currency={currencies[Field.INPUT] ?? null}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                fiatValue={fiatValueInput}
                onCurrencySelect={handleInputSelect}
                showCommonBases={true}
                id="CURRENCY_INPUT_PANEL"
              />
              <SendAddressInputPanel value={address} onUserInput={handleTypeAddressInput} />
          </div>
          <AutoColumn gap="4px">
            <div style={{ marginTop: '6px' }}>
              {!account ? (
                <ButtonPrimary onClick={toggleWalletDrawer} fontWeight={600}>
                  <Trans>Connect Wallet</Trans>
                </ButtonPrimary>
              ) : (
                <ButtonPrimary
                  onClick={() => {
                    handleModalState(SendFormModalState.REVIEW)
                  }}
                  id="swap-button"
                  disabled={
                    !isValid
                  }
                >
                  <Text fontSize={20} fontWeight={600}>
                    {swapInputError ? (
                      swapInputError
                    ) :  (
                      <Trans>Send</Trans>
                    )}
                  </Text>
                </ButtonPrimary>
              )}
            </div>
          </AutoColumn>
      <SwitchLocaleLink />
      {sendFormModalState === SendFormModalState.REVIEW ? (
        <SendReviewModal parsedTokenAmount={parsedAmount as CurrencyAmount<Currency>} address={address} chainId={chainId as number} inputCurrency={currencies[Field.INPUT] as Currency} onConfirm={handleSend} onDismiss={() => handleConfirmDismiss()} />
      ) : null}    
    </>
  )
}
