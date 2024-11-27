import { TimePeriod } from 'graphql/data/util'
import { startTransition, useState } from 'react'
import styled from 'styled-components/macro'
import {colors} from "theme/colors";

import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { DISPLAYS, ORDERED_TIMES } from '../TokenTable/TimeSelector'

const TimeOptionsWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`
const TimeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  gap: 4px;
  border-radius: 16px;
  height: 40px;
  padding: 4px;
  width: fit-content;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    width: 100%;
    justify-content: space-between;
    border: none;
  }
`
const TimeButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.accentActive : theme.backgroundSurface)};
  font-weight: 600;
  font-size: 16px;
  padding: 6px 12px;
  border-radius: 12px;
  line-height: 20px;
  border: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.black : theme.textSecondary)};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  :hover {
    ${({ active }) => {
      return !active && `
        background-color: ${colors.primaryDark}
      `;
    }}
  }
`

export default function TimePeriodSelector({
  currentTimePeriod,
  onTimeChange,
}: {
  currentTimePeriod: TimePeriod
  onTimeChange: (t: TimePeriod) => void
}) {
  const [timePeriod, setTimePeriod] = useState(currentTimePeriod)
  return (
    <TimeOptionsWrapper>
      <TimeOptionsContainer>
        {ORDERED_TIMES.map((time) => (
          <TimeButton
            key={DISPLAYS[time]}
            active={timePeriod === time}
            onClick={() => {
              startTransition(() => onTimeChange(time))
              setTimePeriod(time)
            }}
          >
            {DISPLAYS[time]}
          </TimeButton>
        ))}
      </TimeOptionsContainer>
    </TimeOptionsWrapper>
  )
}
