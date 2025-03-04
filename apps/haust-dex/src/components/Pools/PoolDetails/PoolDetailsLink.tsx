import { Currency, Token } from "@uniswap/sdk-core"
import { getTokenDetailsURL } from "api/util"
import DoubleCurrencyLogo from "components/DoubleLogo"
import { EtherscanLogo } from "components/Icons/Etherscan"
import CurrencyLogo from "components/Logo/CurrencyLogo"
import Row from "components/Row"
import { MouseoverTooltip } from "components/Tooltip"
import { SupportedChainId } from "constants/chains"
import { NATIVE_CHAIN_ID } from "constants/tokens"
import useCopyClipboard from "hooks/useCopyClipboard"
import { useCallback, useState } from "react"
import { ChevronRight, Copy } from "react-feather"
import { useNavigate } from "react-router-dom"
import styled, { useTheme } from "styled-components/macro"
import { BREAKPOINTS, ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from "theme"
import { isAddress, shortenAddress } from "utils"
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink"
import { DetailBubble, SmallDetailBubble } from "./shared"
import { PortfolioLogo } from "components/AccountDrawer/MiniPortfolio/PortfolioLogo"


const TokenName = styled(ThemedText.BodyPrimary)`
  display: none;

  @media (max-width: ${BREAKPOINTS.lg}px) and (min-width: ${BREAKPOINTS.xs}px) {
    display: block;
  }
  ${EllipsisStyle}
`

const TokenTextWrapper = styled(Row)<{ isClickable?: boolean }>`
  gap: 8px;
  margin-right: 12px;
  ${EllipsisStyle}
  ${({ isClickable }) => isClickable && ClickableStyle}
`

const SymbolText = styled(ThemedText.BodyPrimary)`
  flex-shrink: 0;

  @media (max-width: ${BREAKPOINTS.lg}px) and (min-width: ${BREAKPOINTS.xs}px) {
    color: ${({ theme }) => theme.accentAction};
  }
`

const CopyAddress = styled(Row)`
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  font-size: 14px;
  font-weight: 535;
  line-height: 16px;
  width: max-content;
  flex-shrink: 0;
  ${ClickableStyle}
`
const StyledCopyIcon = styled(Copy)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.accentAction};
  flex-shrink: 0;
`

const ExplorerWrapper = styled.div`
  padding: 8px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  display: flex;
  ${ClickableStyle}
`

const ButtonsRow = styled(Row)`
  gap: 8px;
  flex-shrink: 0;
  width: max-content;
`

interface PoolDetailsLinkProps {
  address?: string
  tokens: (Currency | undefined)[]
  loading?: boolean
}

export function PoolDetailsLink({ address, tokens, loading }: PoolDetailsLinkProps) {
  const theme = useTheme()
  const isNative = address === NATIVE_CHAIN_ID
  const currency = tokens[0]
  const [isCopied, setCopied] = useCopyClipboard()
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)
  const copy = useCallback(() => {
    const checksummedAddress = isAddress(address)
    if (checksummedAddress) {
      setCopied(checksummedAddress)
      setShowCopiedTooltip(true)
      setTimeout(() => setShowCopiedTooltip(false), 1500) // Hide tooltip after 1.5 seconds
    }
  }, [address, setCopied])

  const isPool = tokens.length === 2
  const explorerUrl =
    address &&
    getExplorerLink(
      SupportedChainId.HAUST_TESTNET,
      address,
      isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN,
    )

  const navigate = useNavigate()
  const handleTokenTextClick = useCallback(() => {
    if (!isPool) {
      navigate(getTokenDetailsURL({ address: tokens[0]?.wrapped.address, chain: 'haust_testnet' }))
    }
  }, [navigate, tokens, isPool])

  const [truncateAddress, setTruncateAddress] = useState<false | 'start' | 'both'>(false)
  const onTextRender = useCallback(
    (textRef: HTMLElement) => {
      if (textRef) {
        const hasOverflow = textRef.clientWidth < textRef.scrollWidth
        if (hasOverflow) {
          setTruncateAddress((prev) => (prev ? 'both' : 'start'))
        }
      }
    },
    // This callback must run after it sets truncateAddress to 'start' to see if it needs to 'both'.
    // It checks if the textRef has overflow, and sets truncateAddress accordingly to avoid it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [truncateAddress],
  )

  if (loading || !address) {
    return (
      <Row gap="8px" padding="6px 0px">
        <SmallDetailBubble />
        <DetailBubble $width={117} />
      </Row>
    )
  }

  return (
    <Row align="space-between">
      <TokenTextWrapper
        data-testid={
          isPool ? `pdp-pool-logo-${tokens[0]?.symbol}-${tokens[1]?.symbol}` : `pdp-token-logo-${tokens[0]?.symbol}`
        }
        isClickable={!isPool}
        onClick={handleTokenTextClick}
        ref={onTextRender}
      >
        {isPool ? (
          <PortfolioLogo currencies={tokens} size='20px' chainId={SupportedChainId.HAUST_TESTNET} />
        ) : (
          <CurrencyLogo currency={currency} size="20px" />
        )}
        <TokenName>{isPool ? 'Pool' : tokens[0]?.name}</TokenName>
        <SymbolText>
          {isPool ? (
            `${tokens[0]?.symbol} / ${tokens[1]?.symbol}`
          ) : (
            <Row gap="4px">
              {tokens[0]?.symbol} <ChevronRight size={16} color={theme.accentAction} />
            </Row>
          )}
        </SymbolText>
      </TokenTextWrapper>
      <ButtonsRow>
        {!isNative && (
          // <MouseoverTooltip
          //   disableHover
          //   show={showCopiedTooltip}
          //   placement="bottom"
          //   text="Copied"
          //   zIndex={1000}
          // >
            <CopyAddress data-testid={`copy-address-${address}`} onClick={copy}>
              {shortenAddress(address, truncateAddress ? 2 : undefined)}
              <StyledCopyIcon />
            </CopyAddress>
          // </MouseoverTooltip>
        )}
        {explorerUrl && (
          <ExternalLink href={explorerUrl} data-testid={`explorer-url-${explorerUrl}`}>
            <ExplorerWrapper>
              <EtherscanLogo width="16px" height="16px" fill={theme.accentAction} />
            </ExplorerWrapper>
          </ExternalLink>
        )}
      </ButtonsRow>
    </Row>
  )
}
