import { Flex } from "components/layout/Flex"
import { Text } from "components/Text/Text"
import { Checkbox } from "nft/components/layout/Checkbox"
import { useReducer, useState } from "react"
import { colors } from "theme/colors"

export type LabeledCheckboxProps = {
  size?: any
  checkboxPosition?: 'start' | 'end'
  checked: boolean
  text?: string | JSX.Element
  checkedColor?: any
  variant?: any
  gap?: any
  px?: any
  py?: any
  hoverStyle?: any
  containerStyle?: any
  onCheckPressed?: (currentState: boolean) => void
}

export function LabeledCheckbox({
  checked,
  checkboxPosition = 'end',
  text,
  size = '12px',
  gap = '12px',
  onCheckPressed,
}: LabeledCheckboxProps): JSX.Element {
  const onPress = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    onCheckPressed?.(!checked)
  }
  const [hovered, setHovered] = useState(false)

  const textElement =
    typeof text === 'string' ? (
      <Text variant="body5" color={hovered ? colors.neutralLighter : colors.white}>
        {text}
      </Text>
    ) : (
      text
    )

  return (
      <Flex 
        row 
        alignItems="center" 
        width="100%"
        gap={gap} 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onPress}
        style={{ cursor: 'pointer' }}
      >
        {checkboxPosition === 'start' && (
          <Checkbox checked={checked} size={size} hovered={hovered}>
            <span />
          </Checkbox>
        )}
        {text && (
          <Flex grow shrink>
            {textElement}
          </Flex>
        )}
        {checkboxPosition === 'end' && 
          <Checkbox checked={checked} size={size} hovered={hovered} />
        }
      </Flex>
  )
}
