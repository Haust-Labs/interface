import { useWeb3React } from '@web3-react/core'
import { Connection, ConnectionType } from 'connection'
import useENSAvatar from 'hooks/useENSAvatar'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap } from 'theme/styles'
import walletSvg from 'assets/svg/wallet.svg'

import Identicon from '../Identicon'

export const IconWrapper = styled.div<{ size?: number }>`
  position: relative;
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

const MiniIconContainer = styled.div<{ side: 'left' | 'right' }>`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  bottom: -4px;
  ${({ side }) => `${side === 'left' ? 'left' : 'right'}: -4px;`}
  border-radius: 50%;
  outline: 2px solid ${({ theme }) => theme.backgroundSurface};
  outline-offset: -0.1px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  overflow: hidden;
  @supports (overflow: clip) {
    overflow: clip;
  }
`

const MiniImg = styled.img`
  width: 16px;
  height: 16px;
`

const WalletImg = styled.img`
  width: 16px;
  height: 16px;
`

const MiniWalletIcon = ({ connection, side }: { connection: Connection; side: 'left' | 'right' }) => {
  const isDarkMode = useIsDarkMode()
  return (
    <MiniIconContainer side={side}>
      <MiniImg src={connection.getIcon?.(isDarkMode)} alt={`${connection.getName()} icon`} />
    </MiniIconContainer>
  )
}

const MainWalletIcon = ({ connection, size }: { connection: Connection; size: number }) => {
  const { account } = useWeb3React()
  const { avatar } = useENSAvatar(account ?? undefined)

  if (!account) {
    return null
  } else if (avatar || (connection.type === ConnectionType.INJECTED && connection.getName() === 'MetaMask')) {
    return <Identicon size={size} />
  } else {
    return <WalletImg src={walletSvg} size={size} />
  }
}

export default function StatusIcon({
  connection,
  size = 16,
  showMiniIcons = true,
}: {
  connection: Connection
  size?: number
  showMiniIcons?: boolean
}) {
  return (
    <IconWrapper size={size} data-testid="StatusIconRoot">
      <MainWalletIcon connection={connection} size={size} />
      {showMiniIcons && <MiniWalletIcon connection={connection} side="right" />}
    </IconWrapper>
  )
}
