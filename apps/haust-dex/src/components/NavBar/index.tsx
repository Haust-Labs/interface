import { Trans } from '@lingui/macro'
import Web3Status from 'components/Web3Status'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { HaustDexLogo} from 'nft/components/icons'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { Bag } from './Bag'
import Blur from './Blur'
import { SearchBar } from './SearchBar'
import * as styles from './style.css'
import { Tabs } from './Tabs/Tabs'

const Nav = styled.nav`
  padding: 20px 12px;
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: 2;
`

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
  dataTestId?: string
}

const MenuItem = ({ href, dataTestId, id, isActive, children }: MenuItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none' }}
      data-testid={dataTestId}
    >
      {children}
    </NavLink>
  )
}

export const PageTabs = () => {
  const { pathname } = useLocation()

  const isPoolActive = useIsPoolsPage()

  return (
    <>
      <MenuItem href="/" isActive={pathname === '/'}>
        <Trans>Trade</Trans>
      </MenuItem>
      <MenuItem href="/tokens" isActive={pathname.startsWith('/tokens')}>
        <Trans>Explore</Trans>
      </MenuItem>
      <MenuItem href="/pools" isActive={isPoolActive}>
        <Trans>Pools</Trans>
      </MenuItem>
    </>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const isNftPage = useIsNftPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const navigate = useNavigate()

  return (
    <>
      {blur && <Blur />}
      <Nav>
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
              {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
    </>
  )
}

export default Navbar
