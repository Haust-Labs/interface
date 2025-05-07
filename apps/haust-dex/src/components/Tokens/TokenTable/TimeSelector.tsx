import { TimePeriod } from 'graphql/data/util'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useAtom } from 'jotai'
import { useRef, useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'

import { MOBILE_MEDIA_BREAKPOINT, SMALL_MEDIA_BREAKPOINT } from '../constants'
import { filterTimeAtom } from '../state'
import FilterOption from './FilterOption'

export const DISPLAYS: Record<TimePeriod, string> = {
  [TimePeriod.DAY]: '1D volume',
  [TimePeriod.WEEK]: '1W volume',
  [TimePeriod.MONTH]: '1M volume',
  [TimePeriod.YEAR]: '1Y volume',
}

export const MOBILE_DISPLAYS: Record<TimePeriod, string> = {
  [TimePeriod.DAY]: '1D',
  [TimePeriod.WEEK]: '1W',
  [TimePeriod.MONTH]: '1M',
  [TimePeriod.YEAR]: '1Y',
}

export const ORDERED_TIMES: TimePeriod[] = [
  TimePeriod.DAY,
  TimePeriod.WEEK,
  TimePeriod.MONTH,
  TimePeriod.YEAR,
]

const InternalMenuItem = styled.div`
  flex: 1;
  padding: 8px;
  color: ${({ theme }) => theme.textPrimary};
  border-radius: 8px;

  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`
const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 8px;
  justify-content: space-between;
  text-decoration: none;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => theme.hoverState};
    text-decoration: none;
  }
`
const MenuTimeFlyout = styled.span<{ open: boolean }>`
  min-width: 140px;
  max-height: 300px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 1px solid ${({ theme }) => theme.neutralBorder};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 48px;
  z-index: 100;
  left: 0px;
  opacity: ${({ open }) => (open ? '1' : '0')};
  transform: translateY(${({ open }) => (open ? '0' : '-20px')});
  transition: all 200ms ease-in-out;
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    right: 0px;
    left: unset;
  }
`
const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    width: 72px;
  }
`
const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  border: none;
  width: 100%;
  vertical-align: middle;
`
const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  transform: rotate(${({ open }) => (open ? '180deg' : '0deg')});
  transition: transform 200ms ease-in-out;
`

// TODO: change this to reflect data pipeline
export default function TimeSelector() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.TIME_SELECTOR)
  const toggleMenu = useToggleModal(ApplicationModal.TIME_SELECTOR)
  useOnClickOutside(node, open ? toggleMenu : undefined)
  const [activeTime, setTime] = useAtom(filterTimeAtom)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= parseInt(MOBILE_MEDIA_BREAKPOINT))

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= parseInt(MOBILE_MEDIA_BREAKPOINT))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <StyledMenu ref={node}>
      <FilterOption onClick={toggleMenu} aria-label="timeSelector" active={open} data-testid="time-selector">
        <StyledMenuContent>
          {isMobile ? MOBILE_DISPLAYS[activeTime] : DISPLAYS[activeTime]}
          <Chevron open={open}>
            <ChevronDown width={20} height={15} viewBox="0 0 24 20" />
          </Chevron>
        </StyledMenuContent>
      </FilterOption>
      <MenuTimeFlyout open={open}>
        {ORDERED_TIMES.map((time) => (
          <InternalLinkMenuItem
            key={DISPLAYS[time]}
            data-testid={DISPLAYS[time]}
            onClick={() => {
              setTime(time)
              toggleMenu()
            }}
          >
            <div>{isMobile ? MOBILE_DISPLAYS[time] : DISPLAYS[time]}</div>
            {time === activeTime && <Check color={theme.accentAction} size={16} />}
          </InternalLinkMenuItem>
        ))}
      </MenuTimeFlyout>
    </StyledMenu>
  )
}
