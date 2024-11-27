import { Trans } from '@lingui/macro'
import { SmallButtonPrimary } from 'components/Button'
import { useIsMobile } from 'nft/hooks'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Header = styled(Container)`
  gap: 30px;
`

const PageWrapper = styled(Container)`
  flex: 1;
  justify-content: center;
  gap: 50px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    justify-content: space-between;
    padding-top: 64px;
  }
`

export default function NotFound() {
  const isMobile = useIsMobile()

  const Title = isMobile ? ThemedText.LargeHeader : ThemedText.Hero
  const Paragraph = isMobile ? ThemedText.HeadlineMedium : ThemedText.HeadlineLarge

  return (
    <PageWrapper>
      <Header>
        <Container>
          <Title>404</Title>
          <Paragraph color="textSecondary">
            <Trans>Page not found!</Trans>
          </Paragraph>
        </Container>
      </Header>
      <SmallButtonPrimary as={Link} to="/">
        <Trans>Oops, take me back to Swap</Trans>
      </SmallButtonPrimary>
    </PageWrapper>
  )
}
