import { EnvelopeHeartIcon } from "components/Icons/EnvelopeHeart"
import Row from "components/Row"
import { Text } from "components/Text/Text"
import { uniswapUrls } from "constants/urls"
import styled from "styled-components/macro"
import { ExternalLink } from "theme"
import { colors } from "theme/colors"

const StyledExternalLink = styled(ExternalLink)`
  width: fit-content;
  border-radius: 16px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 485;
  line-height: 20px;
  background: ${({ theme }) => theme.backgroundGray};
  color: ${({ theme }) => theme.textSecondary};
  :hover {
    background: ${({ theme }) => theme.backgroundOutline};
    color: ${({ theme }) => theme.textPrimary};
    path {
      fill: ${({ theme }) => theme.textPrimary};
    }
    opacity: unset;
  }
  stroke: none;
`

const StyledText = styled(Text).attrs({
  style: {
    color: colors.gray450,
    fontWeight: 500
  }
})`
  ${StyledExternalLink}:hover & {
    color: ${({ theme }) => theme.textPrimary} !important;
  }
`

export default function GetHelp({ url }: { url?: string }) {
  return (
    <StyledExternalLink href={url ?? uniswapUrls.helpUrl}>
      <Row gap="4px">
        <EnvelopeHeartIcon />
        <StyledText>Get Help</StyledText>
      </Row>
    </StyledExternalLink>
  )
}
