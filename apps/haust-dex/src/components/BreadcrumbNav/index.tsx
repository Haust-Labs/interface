import { Currency } from "@uniswap/sdk-core"
import Row from "components/Row"
import { Copy } from "react-feather"
import { Link } from "react-router-dom"
import styled from "styled-components/macro"
import { CopyHelper, ThemedText } from "theme"
import { shortenAddress } from "utils"

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
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  font-weight: 485;
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

const CopyText = styled(CopyHelper).attrs({
  InitialIcon: Copy,
  CopiedIcon: Copy,
  gap: 4,
  iconSize: 14,
  iconPosition: 'right',
})``

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
  const isNative = currency?.isNative
  const tokenSymbolName = currency?.symbol ?? 'Symbol Not Found'

  return (
    <CurrentPageBreadcrumbContainer
      aria-current="page"
      data-testid="current-breadcrumb"
    >
      <PageTitleText>{currency ? tokenSymbolName : poolName}</PageTitleText>{' '}
      {(!currency || (currency && !isNative)) && (
         <ThemedText.BodySmall color="textSecondary" fontWeight={485}>
         <CopyText toCopy={address}>{shortenAddress(address, 4)}</CopyText>
         </ThemedText.BodySmall>
      )}
    </CurrentPageBreadcrumbContainer>
  )
}
