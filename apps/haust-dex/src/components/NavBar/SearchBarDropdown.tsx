import { Trans } from '@lingui/macro'
import { TokenData } from 'graphql/thegraph/TopTokensQuery';
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { subheadSmall } from 'nft/css/common.css'
import { GenieCollection } from 'nft/types'
import { ReactNode, useEffect, useState } from 'react'
import { TrendingUp } from 'react-feather';
import { useLocation } from 'react-router-dom'

import {colors} from "../../theme/colors";
import * as styles from './SearchBar.css'
import { SkeletonRow, TokenRow } from './SuggestionRow'

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: (GenieCollection | TokenData)[]
  header: JSX.Element
  headerIcon?: JSX.Element
  hoveredIndex: number | undefined
  startingIndex: number
  setHoveredIndex: (index: number | undefined) => void
  isLoading?: boolean
  eventProperties: Record<string, unknown>
}

const SearchBarDropdownSection = ({
  toggleOpen,
  suggestions,
  header,
  headerIcon = undefined,
  hoveredIndex,
  startingIndex,
  setHoveredIndex,
  isLoading,
  eventProperties,
}: SearchBarDropdownSectionProps) => {
  return (
    <Column data-cy="searchbar-dropdown">
      <Row paddingX="16" paddingY="4" gap="8" className={subheadSmall} style={{ lineHeight: '20px', color: colors.neutralLightest }}>
        {headerIcon ? headerIcon : null}
        <Box>{header}</Box>
      </Row>
      <Column>
        {suggestions.map((suggestion, index) =>
          isLoading ? (
            <SkeletonRow key={index} />
          ) : (
            <TokenRow
              key={suggestion.address}
              token={suggestion as TokenData}
              isHovered={hoveredIndex === index + startingIndex}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              index={index + startingIndex}
              eventProperties={{
                position: index + startingIndex,
                selected_search_result_name: suggestion.name,
                selected_search_result_address: suggestion.address,
                ...eventProperties,
              }}
            />
          )
        )}
      </Column>
    </Column>
  )
}

interface SearchBarDropdownProps {
  toggleOpen: () => void
  tokens: TokenData[]
  queryText: string
  hasInput: boolean
  isLoading: boolean
}

export const SearchBarDropdown = ({ toggleOpen, tokens, queryText, hasInput, isLoading }: SearchBarDropdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)
  const [displayedTokens, setDisplayedTokens] = useState<TokenData[]>(tokens)

  const { pathname } = useLocation()
  const isNFTPage = useIsNftPage()
  const isTokenPage = pathname.includes('/tokens')
  const [resultsState, setResultsState] = useState<ReactNode>()

  useEffect(() => {
    setDisplayedTokens(tokens)
  }, [tokens])

  useEffect(() => {
    if (!isLoading) {      
      const tokenSearchResults =
        !hasInput ? (
          <SearchBarDropdownSection
            hoveredIndex={hoveredIndex}
            startingIndex={0}
            setHoveredIndex={setHoveredIndex}
            toggleOpen={toggleOpen}
            suggestions={displayedTokens}
            eventProperties={{
              suggestion_type: null
            }}
            header={<div>Popular tokens</div>}
            headerIcon={<TrendingUp width={20} height={20} />}
            isLoading={isLoading}
          />
        ) : displayedTokens && displayedTokens.length > 0 ? (
          <SearchBarDropdownSection
            hoveredIndex={hoveredIndex}
            startingIndex={0}
            setHoveredIndex={setHoveredIndex}
            toggleOpen={toggleOpen}
            suggestions={displayedTokens}
            eventProperties={{
              suggestion_type: null
            }}
            header={<Trans>Tokens</Trans>}
            isLoading={isLoading}
          />
        ) : (
          <Box className={styles.notFoundContainer}>
             No tokens found.
          </Box>
        )

      const currentState = () =>
        hasInput ? (
          <Column gap="20">{tokenSearchResults}</Column>
        ) : (
          <Column gap="20">
            {tokenSearchResults}
          </Column>
        )

      setResultsState(currentState)
    }
  }, [
    isLoading,
    displayedTokens,
    hoveredIndex,
    toggleOpen,
    hasInput,
    isNFTPage,
    isTokenPage,
    queryText,
  ])

  return (
    <Box className={styles.searchBarDropdownNft}>
      <Box opacity={isLoading ? '0.3' : '1'} transition="125">
        {
        resultsState
        }
      </Box>
    </Box>
  )
}
