import { Currency } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import Column from "components/Column";
import { Flex } from "components/layout/Flex";
import Row from "components/Row";
import { LoadingBubble } from "components/Tokens/loading";
import { useScreenSize } from "hooks/useScreenSize";
import { ScrollDirection, useScroll } from "hooks/useScroll";
import { Swap } from "pages/Swap";
import { ReactNode, useReducer, useState, useEffect } from "react";
import { Plus, X } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components/macro"
import { BREAKPOINTS, ClickableStyle, ThemedText } from "theme"
import { opacify } from "theme/utils";
import { Z_INDEX } from "theme/zIndex";

const PoolDetailsStatsButtonsRow = styled(Row)`
  gap: 12px;
  z-index: 1;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    gap: 8px;
    position: fixed;
    bottom: 0px;
    left: 0;
    margin: 8px;
    width: calc(100% - 16px);
    background: ${({ theme }) => theme.accentAction};
    padding: 12px 32px;
    border: 1px solid ${({ theme }) => theme.accentAction};
    border-radius: 20px;
    backdrop-filter: blur(10px);
    & > :first-child {
      margin-right: auto;
    }
    z-index: ${Z_INDEX.sticky};
  }
`

const PoolButton = styled.button<{ $open?: boolean; $fixedWidth?: boolean }>`
  display: flex;
  flex-direction: row;
  flex: 1;
  padding: 12px 16px 12px 12px;
  border: unset;
  border-radius: 900px;
  gap: 8px;
  color: ${({ theme, $open }) => ($open ? theme.white : theme.accentAction)};
  background-color: ${({ theme, $open }) => ($open ? opacify(12, theme.neutralBorder) : opacify(12, theme.accentAction))};
  justify-content: center;
  transition: ${({ theme }) => `width ${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  border: ${({ theme, $open }) => $open && `1px solid ${theme.neutralBorder}`};
  ${ClickableStyle}
  @media (max-width: ${BREAKPOINTS.lg}px) {
    width: ${({ $fixedWidth }) => $fixedWidth && '120px'};
  }
  @media (max-width: ${BREAKPOINTS.sm}px) {
    width: ${({ $fixedWidth }) => !$fixedWidth && '100%'};
    background-color: ${({ theme, $open }) => ($open ? theme.accentAction : theme.accentAction)};
    color: ${({ theme, $open }) => ($open ? theme.accentAction : theme.white)};
  }
`

const ButtonBubble = styled(LoadingBubble)`
  height: 44px;
  width: 50%;
  border-radius: 900px;
`

const SwapModalWrapper = styled(Column)<{ open?: boolean }>`
  z-index: 0;
  gap: 24px;
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  opacity: ${({ open }) => (open ? '1' : '0')};
  max-height: ${({ open }) => (open ? '100vh' : '0')};
  transition: ${({ theme }) => `max-height ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};
  padding-top: 24px;
  padding-bottom: ${({ open }) => (open ? '24px' : '0')};

    &:before {
      background-color: unset;
  }

  // Need to override the default visibility to properly hide
    visibility: ${({ open }) => (open ? 'visible' : 'hidden')};

  @media (max-width: ${BREAKPOINTS.lg}px) {
    position: fixed;
    width: calc(100% - 16px);
    padding: 0px 12px 12px;
    border-radius: 24px;
    max-width: 480px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: ${Z_INDEX.fixed};
    background: ${({ theme }) => theme.accentAction};
    transition: ${({ theme }) => `opacity ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};
  }
`

interface PoolDetailsStatsButtonsProps {
  token0?: Currency
  token1?: Currency
  feeTier?: number
  loading?: boolean
}

// function findMatchingPosition(positions: PositionInfo[], token0?: Token, token1?: Token, feeTier?: number) {
//   return positions?.find(
//     (position) =>
//       (position?.details.token0.toLowerCase() === token0?.address ||
//         position?.details.token0.toLowerCase() === token1?.address) &&
//       (position?.details.token1.toLowerCase() === token0?.address ||
//         position?.details.token1.toLowerCase() === token1?.address) &&
//       position?.details.fee == feeTier &&
//       !position.closed,
//   )
// }

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0;
    
    setIsTouch(isTouchDevice);
  }, []);

  return isTouch;
}

export function PoolDetailsStatsButtons({
  token0,
  token1,
  feeTier,
  loading,
}: PoolDetailsStatsButtonsProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleAddLiquidity = async () => {
    if (token0 && token1) {
      const currency0Address = token0.isNative ? 'HST' : token0.wrapped.address
      const currency1Address = token1.isNative ? 'HST' : token1.wrapped.address

      const url = `/add/${currency0Address}/${currency1Address}`
      navigate(url, {
        state: { from: location.pathname },
      })
    }
  }

  const [swapModalOpen, toggleSwapModalOpen] = useReducer((state) => !state, false)

  const isScreenSize = useScreenSize()
  const screenSizeLargerThanTablet = isScreenSize['lg']
  const isMobile = !isScreenSize['sm']

  if (loading || !token0 || !token1) {
    return (
      <PoolDetailsStatsButtonsRow data-testid="pdp-buttons-loading-skeleton">
        <ButtonBubble />
        <ButtonBubble />
      </PoolDetailsStatsButtonsRow>
    )
  }

  return (
    <Flex gap="$gap24">
      <PoolButtonsWrapper isMobile={isMobile}>
        <Flex row justifyContent="center" gap={screenSizeLargerThanTablet ? '12px' : '8px'} width="100%">
          <PoolButton
            onClick={toggleSwapModalOpen}
            $open={swapModalOpen}
            data-testid={`pool-details-${swapModalOpen ? 'close' : 'swap'}-button`}
          >
            {swapModalOpen ? (
              <>
                <X size={20} />
                <ThemedText.BodyPrimary fontWeight={535} color="white">
                  Close
                </ThemedText.BodyPrimary>
              </>
            ) : (
              <>
                {/* <ArrowUpDown color={isMobile ? '$white' : '$accent1'} size="$icon.20" /> */}
                <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
                  Swap
                </ThemedText.BodyPrimary>
              </>
            )}
          </PoolButton>
          <PoolButton onClick={handleAddLiquidity} data-testid="pool-details-add-liquidity-button">
            <Plus size={20} />
            <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
              Add Liquidity
            </ThemedText.BodyPrimary>
          </PoolButton>
        </Flex>
      </PoolButtonsWrapper>
      <SwapModalWrapper open={swapModalOpen} data-testid="pool-details-swap-modal">
        <Swap
          syncTabToUrl={false}
        />
      </SwapModalWrapper>
      {/* <Scrim
        $open={swapModalOpen && !screenSizeLargerThanTablet}
        $maxWidth={BREAKPOINTS.lg}
        $zIndex={Z_INDEX.sticky}
        onClick={toggleSwapModalOpen}
      /> */}
    </Flex>
  )
}

interface PoolButtonsWrapperProps {
  children: ReactNode
  isMobile: boolean
}

function PoolButtonsWrapper({ children, isMobile }: PoolButtonsWrapperProps) {
  const isTouchDevice = useIsTouchDevice()
  const { direction: scrollDirection } = useScroll()

  // Determine wrapper component for pool buttons based on viewport size
  const Wrapper = 
  // isMobile ? MobileBottomBar : 
  PoolDetailsStatsButtonsRow
  const wrapperProps = isMobile ? { hide: isTouchDevice && scrollDirection === ScrollDirection.DOWN } : {}

  return <Wrapper {...wrapperProps}>{children}</Wrapper>
}
