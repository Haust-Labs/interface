import { iconSizes } from "./iconSizes"

const iconSize = {
  true: iconSizes.icon40,
  8: iconSizes.icon8,
  12: iconSizes.icon12,
  16: iconSizes.icon16,
  18: iconSizes.icon18,
  20: iconSizes.icon20,
  24: iconSizes.icon24,
  28: iconSizes.icon28,
  36: iconSizes.icon36,
  40: iconSizes.icon40,
  64: iconSizes.icon64,
  70: iconSizes.icon70,
  100: iconSizes.icon100,
}

export type IconSizeTokens = `$icon.${keyof typeof iconSize}`
