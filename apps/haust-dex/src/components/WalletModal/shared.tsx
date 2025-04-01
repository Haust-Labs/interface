import { Text } from "components/Text/Text"
import { Flex } from "rebass"
import { useTheme } from "styled-components/macro"

export const DetectedBadge = () => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        '@media screen and (max-width: 396px)': {
          display: 'none',
        },
      }}
    >
      <Text variant="body2" color={theme.textSecondary}>
        Detected
      </Text>
    </Flex>
  )
}
