import { Trans } from "@lingui/macro"
import Column, { AutoColumn } from "components/Column"
import { AnglesMaximize } from "components/Icons/AnglesMaximize"
import { AnglesMinimize } from "components/Icons/AnglesMinimize"
import styled, { useTheme } from "styled-components/macro"
import { AdvancedSwapDetails } from "./AdvancedSwapDetails"
import { ReactNode, useMemo, useState } from "react"
import { SwapCallbackError, SwapShowAcceptChanges } from "./styleds"
import Row, { AutoRow, RowBetween, RowFixed } from "components/Row"
import { AlertTriangle } from "react-feather"
import { ThemedText } from "theme"
import { ButtonError, ButtonPrimary } from "components/Button"
import { Allowance, AllowanceState } from "hooks/usePermit2Allowance"
import { Currency, Percent, TradeType } from "@uniswap/sdk-core"
import { InterfaceTrade } from "state/routing/types"
import Loader from "components/Icons/LoadingSpinner"
import { Text } from "components/Text/Text"

const ShowMoreButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  cursor: pointer;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  width: auto;
  
  &:hover {
    opacity: 0.8;
  }
`

const ShowMoreWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 16px;
  gap: 8px;
  width: 100%;
`

const ExpandableCard = styled.div<{ expanded: boolean }>`
  padding: .75rem;
  margin-top: 10px;
  transition: max-height 0.2s ease-out;
  overflow: hidden;
  max-height: ${({ expanded }) => expanded ? '400px' : '80px'};
  position: relative;
`

const BaseContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ExpandableContent = styled.div<{ expanded: boolean }>`
  transition: opacity 0.15s ease-out;
  opacity: ${({ expanded }) => expanded ? '1' : '0'};
  visibility: ${({ expanded }) => expanded ? 'visible' : 'hidden'};
  transition-property: opacity, visibility;
  transition-delay: ${({ expanded }) => expanded ? '0s' : '0s, 0s'};
  height: auto;
`

const Separator = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.textSecondary};
  opacity: 0.24;
  width: 100%;
  margin: 8px 10px;
`
interface CallToAction {
  buttonText: string
}

export function SwapDetails({
  trade,
  allowance,
  allowedSlippage,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  showAcceptChanges,
  onAcceptChanges,
  isLoading,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  allowance?: Allowance
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage?: ReactNode
  disabledConfirm: boolean
  showAcceptChanges: boolean
  onAcceptChanges?: () => void
  isLoading: boolean
}) {
  const theme = useTheme()
  const [showMore, setShowMore] = useState(false)

  const callToAction: CallToAction = useMemo(() => {
    if (allowance && allowance.state === AllowanceState.REQUIRED && allowance.needsSetupApproval) {
      return {
        buttonText: 'Approve and swap',
      }
    } else if (allowance && allowance.state === AllowanceState.REQUIRED && allowance.needsPermitSignature) {
      return {
        buttonText: 'Sign and swap',
      }
    } else if (disabledConfirm) {
      return {
        buttonText: 'Finalizing quote...',
      }
    } else {
      return {
        buttonText: 'Confirm swap',
      }
    }
  }, [allowance])

  const toggleShowMore = () => {
    setShowMore(!showMore)
  }

  return (
    <>
      <ShowMoreWrapper>
        <Separator style={{ flex: 1 }} />
        <ShowMoreButton onClick={toggleShowMore}>
          {showMore ? (
            <>
              <Trans>Show less</Trans>
              <AnglesMinimize />
            </>
          ) : (
            <>
              <Trans>Show more</Trans>
              <AnglesMaximize />
            </>
          )}
        </ShowMoreButton>
        <Separator style={{ flex: 1 }} />
      </ShowMoreWrapper>

      <ExpandableCard expanded={showMore}>
        <AutoColumn>
          {/* Always visible section */}
          <BaseContent>
            <AdvancedSwapDetails 
              trade={trade} 
              allowedSlippage={allowedSlippage} 
              showFeeBreakdown={true} 
              showBasicInfo={false}
            />
          </BaseContent>

          {/* Expandable content */}
          <ExpandableContent expanded={showMore}>
            <AutoColumn gap="sm">
              <AdvancedSwapDetails 
                trade={trade} 
                allowedSlippage={allowedSlippage} 
                showRate={true}
                showFeeBreakdown={false}
                showBasicInfo={true}
              />
            </AutoColumn>
          </ExpandableContent>
        </AutoColumn>
      </ExpandableCard>


      {showAcceptChanges ? (
          <SwapShowAcceptChanges justify="flex-start" gap="0px" data-testid="show-accept-changes">
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
              <ThemedText.DeprecatedMain color={theme.accentAction}>
                <Trans>Price Updated</Trans>
              </ThemedText.DeprecatedMain>
            </RowFixed>
            <ButtonPrimary
              style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }}
              onClick={onAcceptChanges}
            >
              <Trans>Accept</Trans>
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : (
        <AutoRow>
            <ButtonError
              data-testid="confirm-swap-button"
              onClick={onConfirm}
              disabled={disabledConfirm}
              error={swapErrorMessage ? true : false}
            >
              {isLoading ? (
                <ThemedText.HeadlineSmall color="neutral2">
                  <Row gap="8px">
                    <Loader />
                    <Trans>Finalizing quote</Trans>
                  </Row>
                </ThemedText.HeadlineSmall>
              ) : (
                <Text style={{ fontSize: '20px', fontWeight: '600' }}>{callToAction.buttonText}</Text>
              )}
            </ButtonError>

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      )}
    </>
  )
}
