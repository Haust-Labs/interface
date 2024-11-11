import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { NavIcon } from 'components/Logo/NavIcon'
import styled from 'lib/styled-components'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Popover } from 'ui/src'

const ArrowDown = styled(ArrowChangeDown)<{ $isActive: boolean }>`
  height: 100%;
  color: ${({ $isActive, theme }) => ($isActive ? theme.neutral1 : theme.neutral2)};
`
const Trigger = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  &:hover {
    ${ArrowDown} {
      color: ${({ theme }) => theme.neutral1} !important;
    }
  }
`
const UniIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

export function CompanyMenu() {
  const popoverRef = useRef<Popover>(null)
  const location = useLocation()
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  useEffect(() => closeMenu(), [location, closeMenu])

  const handleLogoClick = useCallback(() => {
    navigate({
      pathname: '/',
    })
  }, [navigate])

  return (
    <Popover ref={popoverRef} placement="bottom" hoverable stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger data-testid="nav-company-menu">
        <Trigger>
          <UniIcon onClick={handleLogoClick} data-testid="nav-uniswap-logo">
            <NavIcon width="48" height="48" />
          </UniIcon>
        </Trigger>
      </Popover.Trigger>
    </Popover>
  )
}
