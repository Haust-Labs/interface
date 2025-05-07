import { Flex } from 'components/layout/Flex'
import { Text } from 'components/Text/Text'
import { cloneElement, useState, useEffect } from 'react'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

const TOGGLE_PADDING = 4

const OptionsSelector = styled.div<{
  fullWidth?: boolean
  outlined?: boolean
  size?: 'small' | 'default' | 'large'
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-color: ${({ theme }) => theme.neutralBorder};
  border-style: ${({ outlined }) => (outlined ? 'solid' : 'none')};
  border-width: ${({ outlined }) => (outlined ? '1px' : '0')};
  outline-width: 0;
  gap: 8px;
  overflow: hidden;
  padding: ${TOGGLE_PADDING}px;
  
  ${({ fullWidth }) => fullWidth && `
    width: 100%;
  `}
  
  ${({ size }) => {
    switch (size) {
      case 'small':
        return `
          height: 28px;
          gap: 6.5px;
          border-radius: 16px;
        `
      case 'large':
        return `
          height: 42px;
          gap: 12px;
          border-radius: 24px;
        `
      default:
        return `
          height: 34px;
          gap: 8px;
          border-radius: 20px;
        `
    }
  }}
`

const TabsRovingIndicator = styled(Flex)<{
  disabled?: boolean
  height: number
  width: string
  x: number
  y: number
}>`
  transition: all 0.2s ease;
  background-color: ${({ theme, disabled }) => 
    disabled ? theme.accentActive : theme.textTertiary};
  border-radius: 9999px;
  position: absolute;
  cursor: pointer;
  z-index: 1;
  height: ${({ height }) => `${height}px`};
  width: ${({ width }) => width};
  transform: translate(${({ x }) => x}px, ${({ y }) => y}px);
  
  &:hover {
    background-color: ${({ theme }) => theme.accentActionSoft};
  }
`

const OptionButton = styled.button<{
  fullWidth?: boolean
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
  active?: boolean
}>`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border-radius: 9999px;
  cursor: ${({ disabled }) => disabled ? 'unset' : 'pointer'};
  border: none;
  outline: none;
  padding: 0 8px;
  
  ${({ fullWidth }) => fullWidth && `
    flex: 1;
  `}
  
  ${({ size }) => {
    switch (size) {
      case 'small':
        return `
          height: 20px;
          padding: 4px 8px;
        `
      case 'large':
        return `
          height: 32px;
          padding: 8px 12px;
        `
      default:
        return `
          height: 24px;
          padding: 2px 8px;
        `
    }
  }}
`

export interface SegmentedControlOption<T extends string = string> {
  // String value to be selected/stored, used as default display value
  value: T
  // Optional custom display element
  display?: JSX.Element
  // Optional wrapper around the display element
  wrapper?: JSX.Element
}

type SegmentedControlSize = 'small' | 'default' | 'large'

interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedControlOption<T>[]
  selectedOption: T
  onSelectOption: (option: T) => void
  size?: SegmentedControlSize
  disabled?: boolean
  fullWidth?: boolean
  outlined?: boolean
}

/**
 * Spore segmented control component, for selecting between multiple options.
 *
 * @param options - An array of options to display in the segmented control - must have between 2 and 6 options.
 *
 * Note: options can be just text (i.e. their value), or a value with a custom display element.
 * If you are defining custom display elements, you must ensure that each option fits within the vertical bounds of the SegmentedControl.
 *
 * For reference, the heights of the container are as follows (each with top and bottom padding of 4px):
 * - small: 30px
 * - default: 34px
 * - large: 42px
 *
 * @param selectedOption - The value of the currently selected option.
 * @param onSelectOption - Callback function to be called when an option is selected.
 * @param size - The size of the segmented control which affects the height and padding.
 * @param disabled - Whether the segmented control is disabled.
 */
export function SegmentedControl<T extends string = string>({
  options,
  selectedOption,
  onSelectOption,
  size = 'default',
  disabled,
  fullWidth,
  outlined = true,
}: SegmentedControlProps<T>): JSX.Element {
  const [activeLayout, setActiveLayout] = useState<{
    width: number
    height: number
    x: number
    y: number
  } | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number>()

  useEffect(() => {
    const selectedIndex = options.findIndex(option => option.value === selectedOption)
    if (selectedIndex >= 0) {
      const element = document.querySelector(`button[data-value="${selectedOption}"]`) as HTMLButtonElement
      if (element) {
        const rect = element.getBoundingClientRect()
        const parentRect = element.parentElement?.getBoundingClientRect()
        
        if (parentRect) {
          setActiveLayout({
            width: rect.width,
            height: rect.height,
            x: rect.left - parentRect.left,
            y: rect.top - parentRect.top,
          })
        }
      }
    }
  }, [selectedOption, options])

  const handleButtonClick = (value: T, element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect()
    const parentRect = element.parentElement?.getBoundingClientRect()
    
    if (parentRect) {
      setActiveLayout({
        width: rect.width,
        height: rect.height,
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top,
      })
    }
    
    onSelectOption(value)
  }

  return (
    <OptionsSelector
      fullWidth={fullWidth}
      outlined={outlined}
      size={size}
    >
      {options.map((option, index) => {
        const { value, display, wrapper } = option

        const optionButton = (
          <OptionButton
            key={value}
            data-value={value}
            active={selectedOption === value}
            disabled={disabled}
            fullWidth={fullWidth}
            size={size}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(undefined)}
            onClick={(e) => handleButtonClick(value, e.currentTarget)}
          >
            {display ?? (
              <Text
                variant='buttonLabel5'
                style={{
                  fontWeight: '600',
                  color: getOptionTextColor(selectedOption === value, hoveredIndex === index, disabled),
                }}
              >
                {value}
              </Text>
            )}
          </OptionButton>
        )

        if (wrapper) {
          return cloneElement(wrapper, {
            children: optionButton,
          })
        }
        return optionButton
      })}
      {activeLayout && (
        <TabsRovingIndicator
          disabled={disabled}
          height={activeLayout.height}
          width={activeLayout.width.toString()}
          x={activeLayout.x - TOGGLE_PADDING}
          y={activeLayout.y - TOGGLE_PADDING - (!outlined ? 1 : 0)}
        />
      )}
    </OptionsSelector>
  )
}

function getOptionTextColor(active: boolean, hovered: boolean, disabled = false): string {
  if (disabled) {
    return active ? colors.white : colors.neutralLighter
  }
  if (active || hovered) {
    return colors.white
  }
  return colors.neutralLighter
}
