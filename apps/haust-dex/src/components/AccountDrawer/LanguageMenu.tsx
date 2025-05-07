import { Trans } from "@lingui/macro"
import { SlideOutMenu } from "./SlideOutMenu"
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from "constants/locales"
import { useLocationLinkProps } from "hooks/useLocationLinkProps";
import styled, { useTheme } from "styled-components/macro";
import { Link } from "react-router-dom";
import { Check } from "react-feather";
import { useActiveLocale } from "hooks/useActiveLocale";
import { BREAKPOINTS, ClickableStyle, ThemedText } from "theme";
import Column from "components/Column";

const InternalLinkMenuItem = styled(Link)`
  ${ClickableStyle}
  flex: 1;
  color: ${({ theme }) => theme.textTertiary};
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`
export const MenuColumn = styled(Column)`
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    padding-bottom: 14px;
  }
`

function LanguageMenuItem({ locale, isActive }: { locale: SupportedLocale; isActive: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <ThemedText.BodySmall data-testid="wallet-language-item">{LOCALE_LABEL[locale]}</ThemedText.BodySmall>
      {isActive && <Check color={theme.accentActive} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}

export default function LanguageMenu({ onClose }: { onClose: () => void }) {
  const activeLocale = useActiveLocale()

  return (
    <SlideOutMenu title={<Trans>Language</Trans>} onClose={onClose}>
      <MenuColumn>
      {SUPPORTED_LOCALES.map((locale) => (
        <LanguageMenuItem locale={locale} isActive={activeLocale === locale} key={locale} />
      ))}
      </MenuColumn>
    </SlideOutMenu>
  )
}
