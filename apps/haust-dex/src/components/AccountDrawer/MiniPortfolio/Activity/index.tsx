import { Trans } from '@lingui/macro'
import { Flex } from 'components/layout/Flex'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'

export function ActivityTab() {
  return (
    <Flex
      style={{
        padding: '24px',
        height: '100%',
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center'
      }}
    >
      <ThemedText.BodyPrimary style={{color: colors.gray450}}>
        <Trans>Activity history coming soon</Trans>
      </ThemedText.BodyPrimary>
    </Flex>
  )
}
