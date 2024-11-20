import { useWeb3React } from '@web3-react/core'
import AddressInput from 'components/AddressInput'
import { loadingOpacityMixin } from 'components/Loader/styled'
import { isSupportedChain } from 'constants/chains'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { flexRowNoWrap } from 'theme/styles'

const Container = styled.div<{ hideInput: boolean }>`
  min-height: 44px;
  border-radius: 12px;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

const InputRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
`

const StyledAddressInput = styled(AddressInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  background-color: ${({ theme }) => theme.backgroundInput};
  border-radius: 18px;
  text-align: left;
  font-weight: 400;
  font-size: 15px;
  padding: 0px 24px 20px 24px;
`
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

interface SwapAddressInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  hideInput?: boolean
  loading?: boolean
}

export default function SendAddressInputPanel({
  value,
  onUserInput,
  hideInput = false,
  loading = false,
}: SwapAddressInputPanelProps) {
  const { chainId } = useWeb3React()
  const chainAllowed = isSupportedChain(chainId)

  return (
    <InnerContainer>
        <Container hideInput={hideInput}>
                <div style={{padding: '10px 24px 5px 24px'}}><ThemedText.BodySecondarySmall>To</ThemedText.BodySecondarySmall></div>
            <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}>
                {!hideInput && (
                <StyledAddressInput
                    className="token-amount-input"
                    value={value}
                    onUserInput={onUserInput}
                    disabled={!chainAllowed}
                    $loading={loading}
                    placeholder='Wallet address or ENS name'
                    />
                )}
            </InputRow>
        </Container>
    </InnerContainer>
  )
}
