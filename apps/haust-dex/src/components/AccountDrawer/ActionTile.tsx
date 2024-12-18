import { ButtonEmphasis, ButtonSize, LoadingButtonSpinner, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { ReactNode } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme/components/text'

const Container = styled(Column)`
  position: relative;
  height: 100%;
  width: 100%;
`
const Tile = styled(ThemeButton)`
  height: 100%;
  width: 100%;

  display: flex;
  justify-content: flex-start;
  padding: 12px;

  border-color: transparent;
  border-radius: 16px;
  border-style: solid;
  border-width: 1px;
`
const StyledLoadingButtonSpinner = styled(LoadingButtonSpinner)`
  height: 28px;
  width: 28px;
  fill: ${({ theme }) => 'white'};
`
const ActionName = styled(Text)`
  font-size: 16px;
  font-style: normal;
  font-weight: 535;
  line-height: 24px;
`
const ErrorContainer = styled(Row)`
  width: 100%;
  position: absolute;
  bottom: -24px;
  display: flex;
  justify-content: center;
  align-items: center;
`
const ErrorText = styled(ThemedText.LabelMicro)`
  color: ${({ theme }) => 'white'};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

export function ActionTile({
  dataTestId,
  Icon,
  name,
  onClick,
  loading,
  disabled,
  error,
  errorMessage,
  errorTooltip,
}: {
  dataTestId: string
  Icon: ReactNode
  name: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  errorTooltip?: string
}) {

  return (
    <Container>
      <Tile
        data-testid={dataTestId}
        size={ButtonSize.medium}
        emphasis={ButtonEmphasis.highSoft}
        onClick={onClick}
        disabled={disabled}
      >
        <Column gap="sm">
          {loading ? <StyledLoadingButtonSpinner /> : Icon}
          <ActionName>{name}</ActionName>
        </Column>
      </Tile>
      {error && (
        <ErrorContainer>
          <ErrorText>{errorMessage}</ErrorText>
        </ErrorContainer>
      )}
    </Container>
  )
}
