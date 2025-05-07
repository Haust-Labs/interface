import { Trans } from '@lingui/macro'
import Web3Status from 'components/Web3Status'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { HaustDexLogo} from 'nft/components/icons'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { ReactNode, useState, useEffect } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { Bag } from './Bag'
import Blur from './Blur'
import { SearchBar } from './SearchBar'
import * as styles from './style.css'
import { Tabs } from './Tabs/Tabs'
import { ThemedText } from 'theme'

const Nav = styled.nav<{ $scrolled: boolean }>`
  padding: ${({ $scrolled }) => ($scrolled ? '12px' : '20px 12px')};
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: 5;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  transition: all 0.2s ease;
  background: ${({ $scrolled, theme }) => 
    $scrolled ? theme.background : 'transparent'};
  box-shadow: ${({ $scrolled }) => 
    $scrolled ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'};
  border-bottom: ${({ $scrolled, theme }) =>
    $scrolled ? `0.5px solid ${theme.neutralBorder}` : 'none'};
`

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
  dataTestId?: string
  onItemClick?: () => void
}

const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  display: flex;
  justify-content: flex-start;
  width: 100%;
  font-size: 16px;
  padding: 0px 16px;

  &:hover {
    background: transparent !important;
  }
`

const MenuItem = ({ href, dataTestId, id, isActive, children, onItemClick }: MenuItemProps) => {
  return (
    <StyledNavLink
      to={href}
      className={styles.menuItem}
      id={id}
      data-testid={dataTestId}
      onClick={onItemClick}
    >
      {children}
    </StyledNavLink>
  )
}

export const PageTabs = ({ onItemClick }: { onItemClick?: () => void }) => {
  const { pathname } = useLocation()

  return (
    <>
      <ThemedText.BodyPrimary style={{padding: '12px 16px'}}>
        App
      </ThemedText.BodyPrimary>
      <MenuItem href="/swap" isActive={pathname === '/swap'} onItemClick={onItemClick}>
        Trade
      </MenuItem>
      <MenuItem href="/explore/tokens" isActive={pathname.startsWith('/explore/tokens')} onItemClick={onItemClick}>
        Explore
      </MenuItem>
      <MenuItem href="/pool" isActive={pathname.startsWith('/pool')} onItemClick={onItemClick}>
        Pool
      </MenuItem>
    </>
  )
}

const BurgerMenu = styled.div`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    padding: 8px;
  }
`

const BurgerIcon = styled.div`
  width: 24px;
  height: 2px;
  background: ${({ theme }) => theme.textSecondary};
  position: relative;

  &:before,
  &:after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background: ${({ theme }) => theme.textSecondary};
    transition: all 0.3s ease;
  }

  &:before {
    top: -6px;
  }

  &:after {
    bottom: -6px;
  }
`

const DropdownMenuLink = styled(NavLink)`
  padding: 12px 16px;
  width: 100%;
  text-decoration: none;
  
`

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: absolute;
  top: calc(100% + 16px);
  left: 0;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.neutralBorder};
  border-radius: 12px;
  padding: 8px 0px;
  min-width: 160px;
  z-index: 1000;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);

  &:before {
    content: '';
    position: absolute;
    top: -16px;
    left: 0;
    right: 0;
    height: 16px;
  }

  ${DropdownMenuLink} {
    &:hover {
      background: transparent;
    }
  }
`

const Navbar = ({ blur }: { blur: boolean }) => {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(isScrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {blur && <Blur />}
      <Nav $scrolled={scrolled}>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              <HaustDexLogo
                className={styles.logo}
                onClick={() => {
                  navigate({
                    pathname: '/',
                  })
                }}
              />
              <Box display={{ sm: 'block', lg: 'none' }}>
                <BurgerMenu 
                  onMouseEnter={() => setIsMenuOpen(true)}
                  onMouseLeave={() => setIsMenuOpen(false)}
                >
                  <BurgerIcon />
                  <DropdownMenu isOpen={isMenuOpen}>
                    <PageTabs onItemClick={() => setIsMenuOpen(false)} />
                  </DropdownMenu>
                </BurgerMenu>
              </Box>
            </Box>
            <Row display={{ sm: 'none', lg: 'flex' }}>
              <Tabs />
            </Row>
          </Box>
          <Box className={styles.searchContainer}>
            <SearchBar />
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box position="relative" display={{ sm: 'flex', navSearchInputVisible: 'none' }}>
                <SearchBar />
              </Box>
              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
    </>
  )
}

export default Navbar
