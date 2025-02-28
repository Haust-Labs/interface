import { CHART_TYPE_LABELS, ChartType, PriceChartType } from "components/ChartsV2/utils"
import { DropdownSelector } from "components/DropdownSelector"
import { MouseoverTooltip } from "components/Tooltip"
import { useState } from "react"
import { Check, Info } from "react-feather"
import styled, { useTheme } from "styled-components/macro"

const StyledDropdownButton = {
  borderRadius: 20,
  width: '100%',
  height: 36,
}

const StyledMenuFlyout = {
  minWidth: 130,
  borderRadius: '$rounded16',
  right: 0,
  left: 'auto',
  transformOrigin: 'right',
  zIndex: '$popover',
} 

export const InternalMenuItem = styled.div<{ disabled: boolean }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  gap: 12px;
  color: ${({ theme }) => theme.textPrimary};
  text-decoration-line: none;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    background-color: ${({ theme }) => theme.accentActionSoft};
  }
  ${({ disabled }) => disabled && `
    opacity: 0.6;
    cursor: default;
  `}
`


interface ChartTypeSelectorOption<T extends ChartType | PriceChartType> {
  value: T // Value to be selected/stored, used as default display value
  display?: JSX.Element // Optional custom display element
}

function getChartTypeSelectorOption<T extends ChartType | PriceChartType>(
  option: ChartTypeSelectorOption<T> | T,
): ChartTypeSelectorOption<T> {
  if (typeof option === 'string') {
    return { value: option }
  }
  return option
}

export function ChartTypeDropdown<T extends ChartType | PriceChartType>({
  options,
  disabledOption,
  menuLabel,
  currentChartType,
  onSelectOption,
  tooltipText,
}: {
  options: readonly (ChartTypeSelectorOption<T> | T)[]
  disabledOption?: T
  menuLabel?: JSX.Element | string
  currentChartType: T
  onSelectOption: (option: T) => void
  tooltipText?: string
}) {
  const theme = useTheme()
  const [isMenuOpen, toggleMenu] = useState(false)

  const displayLabel = menuLabel 
    ? (typeof menuLabel === 'string' ? <span>{menuLabel}</span> : menuLabel)
    : <span>{CHART_TYPE_LABELS[currentChartType]}</span>

  return (
    <DropdownSelector
      isOpen={isMenuOpen}
      toggleOpen={toggleMenu}
      menuLabel={displayLabel}
      internalMenuItems={
        <>
          {options.map((option) => {
            const { value: chartType, display } = getChartTypeSelectorOption(option)
            const disabled = chartType === disabledOption
            return (
              <MouseoverTooltip
                key={chartType}
                text={disabled && 'Unavailable'}
                placement='right'
              >
                <InternalMenuItem
                  onClick={() => {
                    if (disabled) {
                      return
                    }
                    onSelectOption(chartType)
                    toggleMenu(false)
                  }}
                  disabled={disabled}
                >
                  {display ?? CHART_TYPE_LABELS[chartType]}
                  {chartType === currentChartType && <Check size={20} color={theme.accentAction} />}
                  {disabled && <Info size={20} color={theme.accentActionSoft} />}
                </InternalMenuItem>
              </MouseoverTooltip>
            )
          })}
        </>
      }
      tooltipText={tooltipText}
      buttonStyle={StyledDropdownButton}
      dropdownStyle={StyledMenuFlyout}
      adaptToSheet={false}
    />
  )
}
