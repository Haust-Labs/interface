import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import WalletModal from 'components/WalletModal'
import { useCallback, useState } from 'react'
import styled from 'styled-components/macro'

import AuthenticatedHeader from './AuthenticatedHeader'
import SettingsMenu from './SettingsMenu'
import LanguageMenu from './LanguageMenu'

const DefaultMenuWrap = styled(Column)`
  width: 100%;
  height: 100%;
`

enum MenuState {
  DEFAULT,
  SETTINGS,
  LANGUAGE_SETTINGS,
}

function DefaultMenu() {
  const { account } = useWeb3React()
  const isAuthenticated = !!account

  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const openSettings = useCallback(() => setMenu(MenuState.SETTINGS), [])
  const closeSettings = useCallback(() => setMenu(MenuState.DEFAULT), [])
  const openLanguageSettings = useCallback(() => setMenu(MenuState.LANGUAGE_SETTINGS), [])
  return (
    <DefaultMenuWrap>
      {(() => {
        switch (menu) {
          case MenuState.DEFAULT:
            return isAuthenticated ? (
              <AuthenticatedHeader account={account} openSettings={openSettings} />
            ) : (
              <WalletModal />
            )
          case MenuState.SETTINGS:
            return (
              <SettingsMenu
                onClose={closeSettings}
                openLanguageSettings={openLanguageSettings}
              />
            )
          case MenuState.LANGUAGE_SETTINGS:
            return <LanguageMenu onClose={openSettings} />
        }
      })()}
    </DefaultMenuWrap>
  )
}

export default DefaultMenu
