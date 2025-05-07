import { Trans } from '@lingui/macro'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import { Link } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'
import { ClickableStyle, CopyHelperRefType } from 'theme'
import { colors } from 'theme/colors'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'

import { ReactComponent as ShareIcon } from '../../../assets/svg/share.svg'
import { CopyHelper } from '../../../theme'

const ShareButtonDisplay = styled.div`
  display: flex;
  position: relative;
`

const Share = styled(ShareIcon)<{ open: boolean }>`
  stroke: ${({ theme }) => theme.textSecondary};
  height: 24px;
  width: 24px;
  ${ClickableStyle}
  ${({ open, theme }) => open && `opacity: ${theme.opacity.click} !important`};
`

const ShareActions = styled.div`
  position: absolute;
  z-index: ${Z_INDEX.dropdown};
  width: 240px;
  top: 36px;
  right: 0;
  justify-content: center;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 8px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border-radius: 12px;
`
const ShareAction = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 400;
  gap: 12px;
  height: 40px;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  :hover {
    background-color: ${({ theme }) => opacify(10, theme.darkMode ? colors.gray200 : colors.gray300)};
  }
`

export default function ShareButton() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.SHARE)
  const toggleShare = useToggleModal(ApplicationModal.SHARE)
  useOnClickOutside(node, open ? toggleShare : undefined)

  const copyHelperRef = useRef<CopyHelperRefType>(null)

  return (
    <ShareButtonDisplay ref={node}>
      <Share onClick={toggleShare} aria-label="ShareOptions" open={open} />
      {open && (
        <ShareActions>
          <ShareAction onClick={() => copyHelperRef.current?.forceCopy()}>
            <CopyHelper
              InitialIcon={Link}
              color={theme.textPrimary}
              iconPosition="left"
              gap={12}
              toCopy={window.location.href}
              ref={copyHelperRef}
            >
              <Trans>Copy Link</Trans>
            </CopyHelper>
          </ShareAction>
        </ShareActions>
      )}
    </ShareButtonDisplay>
  )
}
