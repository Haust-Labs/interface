import { Flex } from "components/layout/Flex"
import { Text } from "components/Text/Text"
import { MouseoverTooltip } from "components/Tooltip"
import { useTDPContext } from "pages/TokenDetails/TDPContext"
import styled, { useTheme } from "styled-components/macro"
import { ExternalLink } from "theme"
import { getTokenDescription } from './description'
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink"
import { SupportedChainId } from "constants/chains"
import { EtherscanLogo } from "components/Icons/Etherscan"
import { Globe } from "components/Icons/Globe"
import { TwitterXLogo } from "components/Icons/TwitterX"
import { Currency } from "@uniswap/sdk-core"
import { useReducer } from "react"

const TokenInfoSection = styled(Flex)`
  gap: 16px;
  width: 100%;
  
  ${({ theme }) => theme.breakpoint.xl} {
    gap: 24px;
  }
`

const TokenNameRow = styled(Flex)`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
`

const TokenButtonRow = styled(TokenNameRow)`
  flex-wrap: wrap;
`

const TokenInfoButton = styled(Text)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  width: max-content;
  color: ${({ theme }) => theme.textSecondary};
`

const TokenDescriptionContainer = styled.div`
  color: ${({ theme }) => theme.white};
  max-width: 100%;
  max-height: fit-content;
  white-space: pre-wrap;
  line-height: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const DescriptionVisibilityWrapper = styled(Text)<{ visible: boolean }>`
  font-weight: normal;
  display: ${({ visible }) => visible ? 'inline' : 'none'};
  color: ${({ theme }) => theme.white};
`

export const NoInfoAvailable = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 485;
  font-size: 16px;
`

export const truncateDescription = (desc: string, maxCharacterCount = TRUNCATE_CHARACTER_COUNT) => {
  //trim the string to the maximum length
  let tokenDescriptionTruncated = desc.slice(0, maxCharacterCount)
  //re-trim if we are in the middle of a word
  tokenDescriptionTruncated = `${tokenDescriptionTruncated.slice(
    0,
    Math.min(tokenDescriptionTruncated.length, tokenDescriptionTruncated.lastIndexOf(' ')),
  )}...`
  return tokenDescriptionTruncated
}

export const TRUNCATE_CHARACTER_COUNT = 200

const ShowMoreButton = styled(Text)`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 485;
  font-size: 16px;
  margin-top: 8px;
  cursor: pointer;
`

export function TokenDescription({ currency }: { currency: Currency }) {
  const { white, textSecondary } = useTheme()

  const tokenDescription = getTokenDescription(currency?.symbol ?? '')
  const { homepageUrl, twitterName, description } = tokenDescription ?? {}
  const explorerUrl = currency?.isNative 
    ? getExplorerLink(SupportedChainId.HAUST_TESTNET, currency.wrapped.address)
    : getExplorerLink(SupportedChainId.HAUST_TESTNET, currency?.wrapped.address, ExplorerDataType.TOKEN)

  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const truncatedDescription = truncateDescription(description ?? '', TRUNCATE_CHARACTER_COUNT)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT
  const showTruncatedDescription = shouldTruncate && isDescriptionTruncated

  return (
    <TokenInfoSection data-testid="token-details-info-section">
      <Text color="textPrimary" variant="heading3">
        Info
      </Text>
      <TokenButtonRow data-testid="token-details-info-links">
        <ExternalLink href={explorerUrl} color="textSecondary">
          <TokenInfoButton>
            <EtherscanLogo width="18px" height="18px" fill={white} />
            <Text style={{ color: white, fontWeight: 500 }}>Explorer</Text>
          </TokenInfoButton>
        </ExternalLink> 
        {homepageUrl && (
          <ExternalLink href={homepageUrl} color="textSecondary">
            <TokenInfoButton>
              <Globe width="18px" height="18px" fill={white} />
              <Text style={{ color: white, fontWeight: 500 }}>Website</Text>
            </TokenInfoButton>
          </ExternalLink>
        )}
        {twitterName && (
          <ExternalLink href={`https://x.com/${twitterName}`} color="textSecondary">
            <TokenInfoButton>
              <TwitterXLogo width="18px" height="18px" fill={white} />
              <Text style={{ color: white, fontWeight: 500 }}>Twitter</Text>
            </TokenInfoButton>
          </ExternalLink>
        )}
      </TokenButtonRow>
      <TokenDescriptionContainer>
        {!description && (
          <NoInfoAvailable>
            No token information avaliable
          </NoInfoAvailable>
        )}
        {description && (
          <>
            <DescriptionVisibilityWrapper style={{ color: white, fontWeight: 485, fontSize: 14, lineHeight: '24px' }} data-testid="token-description-full" visible={!showTruncatedDescription}>
              {description}
            </DescriptionVisibilityWrapper>
            <DescriptionVisibilityWrapper style={{ color: white, fontWeight: 485, fontSize: 14, lineHeight: '24px' }} data-testid="token-description-truncated" visible={showTruncatedDescription}>
              {truncatedDescription}
            </DescriptionVisibilityWrapper>
          </>
        )}
        {shouldTruncate && (
          <ShowMoreButton style={{ color: textSecondary, fontWeight: 485, fontSize: 16, marginTop: '8px' }}
            onClick={toggleIsDescriptionTruncated}
            data-testid="token-description-show-more-button"
          >
            {isDescriptionTruncated ? 'Show more' : 'Hide'}
          </ShowMoreButton>
        )}
      </TokenDescriptionContainer>
    </TokenInfoSection>
  )
}
