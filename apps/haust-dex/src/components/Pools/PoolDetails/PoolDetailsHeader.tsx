import styled, { useTheme } from "styled-components/macro"
import { ClickableStyle, EllipsisStyle, ExternalLink, ExternalLinkIcon, ThemedText } from "theme"
import { textFadeIn } from "theme/styles"
import { LoadingBubble } from "../loading"
import { Currency} from "@uniswap/sdk-core"
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from "components/BreadcrumbNav"
import { ChevronRight } from "react-feather"
import { ActionButtonStyle, DetailBubble } from "./shared"
import { getTokenDetailsURL } from "api/util"
import { Flex } from "components/layout/Flex"
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink"
import { SupportedChainId } from "constants/chains"
import Row from "components/Row"
import { shortenAddress } from "utils"
import { useState } from "react"
import { DropdownSelector } from "components/DropdownSelector"
import { EtherscanLogo } from "components/Icons/Etherscan"
import ShareButton from "./ShareButton"
import { Link } from "react-router-dom"
import { Column } from "nft/components/Flex"
import { useScreenSize } from "hooks/useScreenSize"
import { PortfolioLogo } from "components/AccountDrawer/MiniPortfolio/PortfolioLogo"
import CurrencyLogo from "components/Logo/CurrencyLogo"

const StyledExternalLink = styled(ExternalLink)`
  &:hover {
    // Override hover behavior from ExternalLink
    opacity: 1;
  }
`

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: 'flex-start';
  width: 100%;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
`

const IconBubble = styled(LoadingBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`

interface PoolDetailsBreadcrumbProps {
  poolAddress?: string
  token0?: Currency
  token1?: Currency
  loading?: boolean
}

export const PoolDetailsBadge = styled(ThemedText.UtilityBadge)`
  padding: 2px 6px !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  line-height: 20px !important;
  background-color: ${({ theme }) => theme.neutralBorder};
  color: ${({ theme }) => theme.textLightGray};
  border-radius: 4px;
})`

export function PoolDetailsBreadcrumb({ poolAddress, token0, token1, loading }: PoolDetailsBreadcrumbProps) {
  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to='/explore/tokens'>
         Explore <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to='/explore/pools'>
          Pools <ChevronRight size={14} />
      </BreadcrumbNavLink>
      {loading || !poolAddress ? (
        <DetailBubble $width={200} />
      ) : (
        <CurrentPageBreadcrumb address={poolAddress} poolName={`${token0?.symbol} / ${token1?.symbol}`} />
      )}
    </BreadcrumbNavContainer>
  )
}

const StyledPoolDetailsTitle = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: max-content;
  align-items: center;
`

const PoolName = styled(ThemedText.HeadlineMedium)`
  font-size: 24px !important;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    font-size: 18px !important;
    line-height: 24px !important;
  }
`

const PoolDetailsTitle = ({
  token0,
  token1,
  feeTier,
  toggleReversed,
  hookAddress,
}: {
  token0?: Currency
  token1?: Currency
  feeTier?: number
  toggleReversed: React.DispatchWithoutAction
  hookAddress?: string
}) => {
  const feePercent = feeTier && feeTier / 10000

  return (
    <StyledPoolDetailsTitle>
      <div>
        <PoolName>
          <StyledLink
            to={getTokenDetailsURL({
              address: token0?.wrapped.address,
            })}
          >
            {token0?.symbol}
          </StyledLink>
          &nbsp;/&nbsp;
          <StyledLink
            to={getTokenDetailsURL({
              address: token1?.wrapped.address,
            })}
          >
            {token1?.symbol}
          </StyledLink>
        </PoolName>
      </div>
      <Flex row gap="$gap4" alignItems="center">
        {!!feePercent && (
          <PoolDetailsBadge>
            {feePercent}%
          </PoolDetailsBadge>
        )}
      </Flex>
    </StyledPoolDetailsTitle>
  )
}

const ContractsDropdownRowContainer = styled(Row)`
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 8px;
  ${EllipsisStyle}
  &:hover {
    background: ${({ theme }) => theme.neutralBorder};
  }
`

const ContractsDropdownRow = ({
  address,
  chainId,
  tokens,
}: {
  address?: string
  chainId?: number
  tokens: (Currency | undefined)[]
}) => {
  const theme = useTheme()
  const currency = tokens[0]
  const isPool = tokens.length === 2
  const currencies = isPool && tokens[1] ? tokens : [currency]
  const explorerUrl =
    chainId &&
    address &&
    getExplorerLink(
      chainId,
      address,
      isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN,
    )

  if (!chainId || !explorerUrl) {
    return (
      <ContractsDropdownRowContainer>
        <DetailBubble $width={117} />
      </ContractsDropdownRowContainer>
    )
  }

  return (
    <StyledExternalLink href={explorerUrl}>
      <ContractsDropdownRowContainer>
        <Row gap="8px">
          {isPool ? (
            <PortfolioLogo chainId={SupportedChainId.HAUST_TESTNET} currencies={currencies} size='24px' />
          ) : (
            <CurrencyLogo currency={currency} size='24px' />
          )}
          <ThemedText.BodyPrimary>
            {isPool ? 'Pool' : tokens[0]?.symbol}
          </ThemedText.BodyPrimary>
          <ThemedText.BodySecondary fontSize='14px' lineHeight='20px' fontWeight='400'>{shortenAddress(address)}</ThemedText.BodySecondary>
        </Row>
        <ExternalLinkIcon size={16} href={explorerUrl} color={theme.textSecondary}/>
      </ContractsDropdownRowContainer>
    </StyledExternalLink>
  )
}

const StyledMenuFlyout = {
  minWidth: 235,
  borderRadius: '16px',
  right: 0,
  left: 'auto',
  transformOrigin: 'right',
  zIndex: 111,
} 

const PoolDetailsHeaderActions = ({
  chainId,
  poolAddress,
  poolName,
  token0,
  token1,
}: {
  chainId?: number
  poolAddress?: string
  poolName: string
  token0?: Currency
  token1?: Currency
}) => {
  const theme = useTheme()
  const [contractsModalIsOpen, toggleContractsModal] = useState(false)

  return (
    <Row width="max-content" justify="flex-end" gap="8px">
      <DropdownSelector
        isOpen={contractsModalIsOpen}
        toggleOpen={toggleContractsModal}
        menuLabel={
            <EtherscanLogo width="18px" height="18px" fill={theme.white} />
        }
        internalMenuItems={
          <>
            <ContractsDropdownRow address={poolAddress} chainId={chainId} tokens={[token0, token1]} />
            <ContractsDropdownRow address={token0?.wrapped.address} chainId={chainId} tokens={[token0]} />
            <ContractsDropdownRow address={token1?.wrapped.address} chainId={chainId} tokens={[token1]} />
          </>
        }
        tooltipText='Explorers'
        hideChevron
        buttonStyle={ActionButtonStyle}
        dropdownStyle={StyledMenuFlyout}
        adaptToSheet={false}
      />
      <ShareButton />
    </Row>
  )
}

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.white};
  text-decoration: none;
  ${ClickableStyle}
`

interface PoolDetailsHeaderProps {
  chainId?: number
  poolAddress?: string
  token0?: Currency
  token1?: Currency
  feeTier?: number
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
  hookAddress?: string
}

export function PoolDetailsHeader({
  chainId,
  poolAddress,
  token0,
  token1,
  feeTier,
  hookAddress,
  toggleReversed,
  loading,
}: PoolDetailsHeaderProps) {
  const screenSize = useScreenSize()
  const shouldColumnBreak = !screenSize['sm']
  const poolName = `${token0?.symbol} / ${token1?.symbol}`

  if (loading) {
    return (
      <HeaderContainer data-testid="pdp-header-loading-skeleton">
        {shouldColumnBreak ? (
          <Column gap="4" style={{ width: '100%' }}>
            <IconBubble />
            <DetailBubble $height={40} $width={137} />
          </Column>
        ) : (
          <Row gap="sm">
            <IconBubble />
            <DetailBubble $height={40} $width={137} />
          </Row>
        )}
      </HeaderContainer>
    )
  }
  return (
    <HeaderContainer>
      {shouldColumnBreak ? (
        <Column gap="4" style={{ width: '100%' }}>
          <Row gap="10px" justify="space-between">
            <PortfolioLogo chainId={SupportedChainId.HAUST_TESTNET} currencies={[token0, token1]} size="32px" />
            <PoolDetailsHeaderActions
              chainId={SupportedChainId.HAUST_TESTNET}
              poolAddress={poolAddress}
              poolName={poolName}
              token0={token0}
              token1={token1}
            />
          </Row>
          <PoolDetailsTitle
            token0={token0}
            token1={token1}
            feeTier={feeTier}
            toggleReversed={toggleReversed}
          />
        </Column>
      ) : (
        <>
          <Row gap="10px">
            <PortfolioLogo chainId={SupportedChainId.HAUST_TESTNET} currencies={[token0, token1]} size="32px" />
            <PoolDetailsTitle
                token0={token0}
                token1={token1}
                feeTier={feeTier}
                toggleReversed={toggleReversed}
                hookAddress={hookAddress}
              />
          </Row>
          <PoolDetailsHeaderActions
            chainId={SupportedChainId.HAUST_TESTNET}
            poolAddress={poolAddress}
            poolName={poolName}
            token0={token0}
            token1={token1}
          />
        </>
      )}
    </HeaderContainer>
  )
}
