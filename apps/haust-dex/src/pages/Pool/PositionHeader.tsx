// eslint-disable-next-line no-restricted-imports
import { ButtonPrimary } from 'components/Button'
import { LabeledCheckbox } from 'components/checkbox'
import { DropdownSelector } from 'components/DropdownSelector'
import StatusIndicatorCircle from 'components/Icons/StatusIndicatorCircle'
import { Flex } from 'components/layout/Flex'
import { Text } from 'components/Text/Text'
import { useMemo, useState } from 'react'
import { Plus } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { colors, darkTheme } from 'theme/colors'

const StyledDropdownButton = {
  borderRadius: '16px',
  backgroundColor: darkTheme.neutralBorder,
  borderWidth: 0,
  hoverStyle: {
    backgroundColor: 'none',
  },
}

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 16px;
  font-size: 16px;
  padding: 8px 16px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

export enum PositionStatus {
  UNSPECIFIED = 0,
  IN_RANGE = 1,
  OUT_OF_RANGE = 2,
  CLOSED = 3
}

export function getProtocolStatusLabel(status: PositionStatus): string | undefined {
    switch (status) {
      case PositionStatus.IN_RANGE:
        return 'In range'
      case PositionStatus.OUT_OF_RANGE:
        return 'Out of range'
      case PositionStatus.CLOSED:
        return 'Closed'
    }
    return undefined
}

export const lpStatusConfig = {
    [PositionStatus.IN_RANGE]: {
      color: colors.greenVibrant,
    },
    [PositionStatus.OUT_OF_RANGE]: {
      color: colors.redVibrant,
    },
    [PositionStatus.CLOSED]: {
      color: colors.neutralLightest,
    },
    [PositionStatus.UNSPECIFIED]: undefined,
}
  
type PositionsHeaderProps = {
  showFilters?: boolean
  selectedStatus?: PositionStatus[]
  onStatusChange: (toggledStatus: PositionStatus) => void
}

export function PositionsHeader({
  showFilters = true,
  selectedStatus,
  onStatusChange,
}: PositionsHeaderProps) {
  const navigate = useNavigate()

  const statusFilterOptions = useMemo(() => {
    return [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED].map((status) => {
      const config = lpStatusConfig[status]

      if (!config) {
        return null
      }

      return (
        <Flex
          key={`PositionsHeader-status-${status}`}
          row
          gap="8px"
          width="100%"
          alignItems="center"
        >
          <StatusIndicatorCircle size={8} color={config.color} />
          <LabeledCheckbox
            py="4px"
            size="8px"
            hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
            containerStyle={{ flex: 1 }}
            checkboxPosition="end"
            checked={selectedStatus?.includes(status) ?? false}
            text={getProtocolStatusLabel(status)}
            onCheckPressed={() => onStatusChange(status)}
          />
        </Flex>
      )
    })
  }, [selectedStatus, onStatusChange])

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  return (
    <Flex gap="16px">
      <Text variant="heading3" color="$textPrimary">Your positions</Text>
      <Flex gap="8px" row>
        <Flex gap="1px" row>
            <ResponsiveButtonPrimary data-cy="join-pool-button" id="join-pool-button" as={Link} to="/add/BNB">
                + New Position
             </ResponsiveButtonPrimary>
        </Flex>
        {showFilters && (
          <Flex row alignItems="center" shrink gap="4px">
            <DropdownSelector
              isOpen={statusDropdownOpen}
              toggleOpen={() => {
                setStatusDropdownOpen((prev) => !prev)
              }}
              menuLabel={<Text variant="buttonLabel3" color="white">Status</Text>}
              internalMenuItems={<>{statusFilterOptions}</>}
              dropdownStyle={{
                width: 240,
                className: 'scrollbar-hidden',
              }}
              buttonStyle={StyledDropdownButton}
            />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
