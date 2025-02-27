import { Text } from 'components/Text/Text'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import styled from 'styled-components/macro'
import FilterButton from './FilterButton'
import { Flex } from 'components/layout/Flex'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { padding } from 'polished'
import { colors } from 'theme/colors'

const MenuFlyout = styled.div<{ open: boolean }>`
  min-width: 220px;
  max-height: 350px;
  overflow: auto;
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 1px solid ${({ theme }) => theme.neutralBorder};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 40px;
  z-index: 100;
  left: 0;
  gap: 8px;
  opacity: ${({ open }) => (open ? '1' : '0')};
  transform: translateY(${({ open }) => (open ? '0' : '-20px')});
  transition: all 200ms ease-in-out;
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
`

interface DropdownSelectorProps {
  isOpen: boolean
  toggleOpen: (open: boolean) => void
  menuLabel: JSX.Element
  internalMenuItems: JSX.Element
  dataTestId?: string
  optionsContainerTestId?: string
  tooltipText?: string
  hideChevron?: boolean
  buttonStyle?: any
  dropdownStyle?: any
  adaptToSheet?: boolean
  containerStyle?: React.CSSProperties
}

export function DropdownSelector({
  isOpen,
  toggleOpen,
  menuLabel,
  internalMenuItems,
  dataTestId,
  optionsContainerTestId,
  tooltipText,
  hideChevron,
  buttonStyle,
  dropdownStyle,
  adaptToSheet = true,
  containerStyle,
}: DropdownSelectorProps) {
  const node = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(node, () => isOpen && toggleOpen(false))
  // const scrollbarStyles = useScrollbarStyles()
  // const shadowProps = useShadowPropsMedium()

  return (
    <div ref={node} style={{ width: '100%', ...containerStyle }}>
      <StyledMenu>
        <MouseoverTooltip
          text={tooltipText}
          disableHover={!tooltipText}
          placement="top"
        >
          <FilterButton
            onClick={() => toggleOpen(!isOpen)}
            data-testid={dataTestId}
            style={buttonStyle}
          >
            <Flex row gap="8px" justifyContent="space-between" alignItems="center" style={{padding: '8px 12px', color: colors.neutralLighter}}>
              {menuLabel}
              {!hideChevron && (
                <ChevronDown
                  size={20}
                  color={colors.neutralLightest}
                  style={{
                    transform: `rotate(${isOpen ? 180 : 0}deg)`,
                    transition: 'transform 0.2s',
                  }}
                />
              )}
            </Flex>
          </FilterButton>
        </MouseoverTooltip>
        
        <MenuFlyout
          open={isOpen}
          data-testid={optionsContainerTestId}
          style={dropdownStyle}
        >
          {internalMenuItems}
        </MenuFlyout>
      </StyledMenu>
    </div>
  )
}
