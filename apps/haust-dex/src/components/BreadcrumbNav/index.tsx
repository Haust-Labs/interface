import { Currency } from "@uniswap/sdk-core"
import Row from "components/Row"
import { MouseoverTooltip, TooltipSize } from "components/Tooltip"
import useCopyClipboard from "hooks/useCopyClipboard"
import { useScreenSize } from "hooks/useScreenSize"
import { useCallback, useState } from "react"
import { Copy } from "react-feather"
import { Link } from "react-router-dom"
import styled, { useTheme } from "styled-components/macro"
import { ClickableStyle } from "theme"

export const BreadcrumbNavContainer = styled.nav`
  display: flex;
  color: ${({ theme }) => theme.white};
  font-size: 16px;
  line-height: 24px;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
  width: fit-content;
`

export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.white};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  text-decoration: none;
  height: 24px; /* Match the line-height */

  &:hover {
    color: ${({ theme }) => theme.white};
  }
`

const CurrentPageBreadcrumbContainer = styled(Row)`
  gap: 6px;
  display: flex;
  align-items: center;
  height: 24px; /* Match the line-height */
`

// This must be an h1 to match the SEO title, and must be the first heading tag in code.
const PageTitleText = styled.h1`
  font-weight: inherit;
  font-size: inherit;
  line-height: inherit;
  color: ${({ theme }) => theme.white};
  white-space: nowrap;
  margin: 0;
  display: flex;
  align-items: center;
  height: 24px; /* Match the line-height */
`

const TokenAddressHoverContainer = styled(Row)<{ isDisabled?: boolean }>`
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
  gap: 10px;
  white-space: nowrap;
`

const CopyIcon = styled(Copy)`
  ${ClickableStyle}
`

// Used in both TDP & PDP.
// On TDP, currency is defined & poolName is undefined. On PDP, currency is undefined & poolName is defined.
export const CurrentPageBreadcrumb = ({
  address,
  currency,
  poolName,
}: {
  address: string
  currency?: Currency
  poolName?: string
}) => {
  const tokenSymbolName = currency?.symbol ?? 'Symbol Not Found'


  return (
    <CurrentPageBreadcrumbContainer
      aria-current="page"
      data-testid="current-breadcrumb"
    >
      <PageTitleText>{currency ? tokenSymbolName : poolName}</PageTitleText>{' '}
    </CurrentPageBreadcrumbContainer>
  )
}
