import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import { ButtonGray } from 'components/Button'
import { FiatValue } from 'components/CurrencyInputPanel/FiatValue'
import { LoadingOpacityContainer, loadingOpacityMixin } from 'components/Loader/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { Input } from 'components/NumericalInput'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { isSupportedChain } from 'constants/chains'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { darken } from 'polished'
import {ReactNode, useCallback, useState} from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ReactComponent as DropDown } from '../../../../assets/images/dropdown.svg'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${flexColumnNoWrap};
  margin-top: 8px;
  position: relative;
  border-radius: 16px;
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  transition: height 1s ease;
  will-change: height;
  height: 134px;
`

const Container = styled.div<{ hideInput: boolean }>`
  min-height: 44px;
  border-radius: 12px;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

const CurrencySelect = styled(ButtonGray)<{
  visible: boolean
  selected: boolean
  hideInput?: boolean
  disabled?: boolean
}>`
  display: block;
  width: 100%;
  height: 64px;
  background: ${({ theme }) => theme.backgroundInput};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  color: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.textSecondary)};
  cursor: pointer;
  border-top: 1px solid ${({ theme }) => theme.black};
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  outline: none;
  user-select: none;
  font-size: 16px;
  font-weight: 600;
  padding: 8px;
  gap: 8px;
  justify-content: center;

  &:hover,
  &:active {
    background-color: ${({ theme }) => theme.backgroundInput};
    color: ${({ theme }) => theme.textTertiary};
  }

  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  margin-top: 8px; 
`

const InputRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
`

const LabelRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.75rem;
  line-height: 1rem;

  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.textSecondary)};
  }
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
  min-height: 20px;
  padding: 8px 0 0 0;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0px 16px;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 8px;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.buttonSecondaryText)};
    stroke-width: 2px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0;')}
  ${({ active }) => (active ? '  flex-direction: column;' : '  margin: 0;')}
  display: flex;
  font-size: 16px;
  font-weight: 400;
  align-items: flex-start;
  justify-content: center;
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.accentAction};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  padding: 4px 6px;
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};
  z-index: 999;

  :hover {
    opacity: ${({ disabled }) => (!disabled ? 0.8 : 0.4)};
  }

  :focus {
    outline: none;
  }
`

const StyledNumericalInput = styled(Input)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  background-color: ${({ theme }) => theme.backgroundInput};
  border-radius: 8px;
  text-align: center;
  font-weight: 400;
  font-size: 63px;
  line-height: 60px;
  font-variant: small-caps;
  height: 134px;
`
const GroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const InnerContainer = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
  border: none;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;

  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: none;
  }

  &:hover:before {
    border-color: ${({ theme }) => theme.stateOverlayHover};
  }

  &:focus-within:before {
    border-color: ${({ theme }) => theme.stateOverlayPressed};
  }
`;

interface SwapCurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue: { data?: number; isLoading: boolean }
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  loading?: boolean
}

export default function SendCurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  fiatValue,
  priceImpact,
  hideBalance = false,
  hideInput = false,
  loading = false,
  ...rest
}: SwapCurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { account, chainId } = useWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useTheme()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const chainAllowed = isSupportedChain(chainId)

  return (
    <GroupContainer>
      <InnerContainer>
      <div style={{padding: '16px'}}><ThemedText.BodySecondarySmall>You’re sending</ThemedText.BodySecondarySmall></div>
        <InputPanel id={id} hideInput={hideInput} {...rest}>
          <Container hideInput={hideInput}>
            <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}>
              {!hideInput && (
                <StyledNumericalInput
                  className="token-amount-input"
                  value={value}
                  onUserInput={onUserInput}
                  disabled={!chainAllowed}
                  $loading={loading}
                  />
              )}
            </InputRow>
          </Container>
          {onCurrencySelect && (
            <CurrencySearchModal
              isOpen={modalOpen}
              onDismiss={handleDismissSearch}
              onCurrencySelect={onCurrencySelect}
              selectedCurrency={currency}
              otherSelectedCurrency={otherCurrency}
              showCommonBases={showCommonBases}
              showCurrencyAmount={showCurrencyAmount}
              disableNonToken={disableNonToken} />
          )}
        </InputPanel>
        <CurrencySelect
          disabled={!chainAllowed}
          visible={currency !== undefined}
          selected={!!currency}
          hideInput={hideInput}
          className="open-currency-select-button"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('max-button')) return;
            if (onCurrencySelect) {
              setModalOpen(true);
            }
          }}
        >
          <Aligner>
            <RowFixed>
              {currency ? (
                <CurrencyLogo style={{ marginRight: '2px' }} currency={currency} size="24px" />
              ) : null}
              <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
                {(currency && currency.symbol && currency.symbol.length > 20
                  ? currency.symbol.slice(0, 4) + '...' + currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                  : currency?.symbol) || <Trans>Select token</Trans>}
                  <RowFixed style={{ height: '17px' }}>
                    <ThemedText.DeprecatedBody
                      color={theme.accentTextLightSecondary}
                      fontWeight={400}
                      fontSize={14}
                      style={{ display: 'inline' }}
                    >
                      {!hideBalance && currency && selectedCurrencyBalance ? (
                          <Trans>Balance: {formatCurrencyAmount(selectedCurrencyBalance, 6)}</Trans>
                        ) : null}
                    </ThemedText.DeprecatedBody>
                  </RowFixed>
              </StyledTokenName>
            </RowFixed>
            <FiatRow>
              <RowBetween>
                <LoadingOpacityContainer $loading={loading}>
                  <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
                </LoadingOpacityContainer>
              </RowBetween>
            </FiatRow>
            <div>
              {showMaxButton && selectedCurrencyBalance ? (
                <StyledBalanceMax
                  className="max-button"
                  onClick={onMax}
                >
                  <Trans>Max</Trans>
                </StyledBalanceMax>
              ) : null}
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}
            </div>
          </Aligner>
        </CurrencySelect>
      </InnerContainer>
    </GroupContainer>
  )
}
