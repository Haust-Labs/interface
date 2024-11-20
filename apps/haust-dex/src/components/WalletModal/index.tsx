import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { Connection, ConnectionType, getConnections, networkConnection } from 'connection'
import { useGetConnection } from 'connection'
import { ErrorCode } from 'connection/utils'
import { isSupportedChain } from 'constants/chains'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { useConnectedWallets } from 'state/wallets/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

import ConnectionErrorView from './ConnectionErrorView'
import Option from './Option'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.backgroundSurface};
  width: 100%;
  padding: 14px 16px 16px;
  flex: 1;
`

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

function didUserReject(connection: Connection, error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    (connection.type === ConnectionType.WALLET_CONNECT_V2 && error?.toString?.() === ErrorCode.WC_MODAL_CLOSED) ||
    (connection.type === ConnectionType.COINBASE_WALLET && error?.toString?.() === ErrorCode.CB_REJECTED_REQUEST)
  )
}

export default function WalletModal() {
  const dispatch = useAppDispatch()
  const { connector, account, chainId, provider } = useWeb3React()
  const [drawerOpen, toggleWalletDrawer] = useAccountDrawer()

  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)
  const [pendingConnection, setPendingConnection] = useState<Connection | undefined>()
  const [pendingError, setPendingError] = useState<any>()

  const connections = getConnections()
  const getConnection = useGetConnection()

  useEffect(() => {
    // Clean up errors when the dropdown closes
    return () => setPendingError(undefined)
  }, [setPendingError])

  const openOptions = useCallback(() => {
    if (pendingConnection) {
      setPendingError(undefined)
      setPendingConnection(undefined)
    }
  }, [pendingConnection, setPendingError])

  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && isSupportedChain(chainId) && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector])

  // When the user successfully sets new wallet, trigger logging of Amplitude analytics event.
  useEffect(() => {
    if (account && account !== lastActiveWalletAddress) {
      const walletName = getConnection(connector).getName()
      const isReconnect =
        connectedWallets.filter((wallet) => wallet.account === account && wallet.walletType === walletName).length > 0
      if (!isReconnect) addWalletToConnectedWallets({ account, walletType: walletName })
    }
    setLastActiveWalletAddress(account)
  }, [
    connectedWallets,
    addWalletToConnectedWallets,
    lastActiveWalletAddress,
    account,
    connector,
    chainId,
    provider,
    getConnection,
  ])

  // Used to track the state of the drawer in async function
  const drawerOpenRef = useRef(drawerOpen)
  drawerOpenRef.current = drawerOpen

  const tryActivation = useCallback(
    async (connection: Connection) => {
      // Skips wallet connection if the connection should override the default behavior, i.e. install metamask or launch coinbase app
      if (connection.overrideActivate?.()) return

      try {
        setPendingConnection(connection)
        setPendingError(undefined)

        await connection.connector.activate()
        console.debug(`connection activated: ${connection.getName()}`)
        dispatch(updateSelectedWallet({ wallet: connection.type }))
        if (drawerOpenRef.current) toggleWalletDrawer()
      } catch (error) {
        console.debug(`web3-react connection error: ${JSON.stringify(error)}`)
        if (didUserReject(connection, error)) {
          setPendingConnection(undefined)
        } else {
          setPendingError(error)
        }
      }
    },
    [dispatch, setPendingError, toggleWalletDrawer]
  )

  return (
    <Wrapper data-testid="wallet-modal">
      <AutoRow justify="space-between" width="100%" marginBottom="16px">
        <ThemedText.SubHeader fontWeight={500}>Connect a wallet</ThemedText.SubHeader>
      </AutoRow>
      {pendingError ? (
        pendingConnection && (
          <ConnectionErrorView openOptions={openOptions} retryActivation={() => tryActivation(pendingConnection)} />
        )
      ) : (
          <AutoColumn gap="16px">
              <OptionGrid data-testid="option-grid">
                {connections.map((connection) => connection.shouldDisplay() ? (
                  <Option
                    key={connection.getName()}
                    connection={connection}
                    activate={() => tryActivation(connection)}
                    pendingConnectionType={pendingConnection?.type} />
                ) : null
                )}
              </OptionGrid>
            </AutoColumn>
      )}
    </Wrapper>
  )
}
