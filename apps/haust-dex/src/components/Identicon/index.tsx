import { useWeb3React } from '@web3-react/core'
import useENSAvatar from 'hooks/useENSAvatar'
import { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { generateWalletPattern } from './walletMasks'

const StyledIdenticon = styled.div<{ iconSize: number }>`
  height: ${({ iconSize }) => `${iconSize}px`};
  width: ${({ iconSize }) => `${iconSize}px`};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.deprecated_bg4};
  font-size: initial;
  position: relative;
`

const StyledAvatar = styled.img`
  height: inherit;
  width: inherit;
  border-radius: inherit;
`

const StyledWalletIcon = styled.div<{ pattern: ReturnType<typeof generateWalletPattern> }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${({ pattern }) => pattern.background};
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ pattern }) => pattern.pattern};
    opacity: 0.7;
  }
`

export default function Identicon({ size, account: externalAccount }: { size?: number; account?: string | null }) {
  const { account: contextAccount } = useWeb3React()
  const account = externalAccount ?? contextAccount
  const { avatar } = useENSAvatar(account ?? undefined)
  const [fetchable, setFetchable] = useState(true)
  const iconSize = size ?? 24

  const handleError = useCallback(() => setFetchable(false), [])

  const pattern = useMemo(() => {
    if (!account) return null
    return generateWalletPattern(account)
  }, [account])

  return (
    <StyledIdenticon iconSize={iconSize}>
      {avatar && fetchable ? (
        <StyledAvatar alt="avatar" src={avatar} onError={handleError} />
      ) : pattern ? (
        <StyledWalletIcon pattern={pattern} />
      ) : null}
    </StyledIdenticon>
  )
}
