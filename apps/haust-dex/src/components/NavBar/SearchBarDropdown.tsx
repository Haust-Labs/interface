import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import {TokenApi} from "api/types";
import { SearchToken } from 'graphql/data/SearchTokens'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import {ClockIcon} from "nft/components/icons";
import { subheadSmall } from 'nft/css/common.css'
import { GenieCollection } from 'nft/types'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import {colors} from "../../theme/colors";
import { useRecentlySearchedAssets } from './RecentlySearchedAssets'
import * as styles from './SearchBar.css'
import { SkeletonRow, TokenRow } from './SuggestionRow'

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: (GenieCollection | TokenApi)[]
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
    <Column gap="12" data-cy="searchbar-dropdown">
      <Row paddingX="16" paddingY="4" gap="8" className={subheadSmall} style={{ lineHeight: '20px', color: colors.neutralLightest }}>
        {headerIcon ? headerIcon : null}
        <Box>{header}</Box>
      </Row>
      <Column gap="12">
        {suggestions.map((suggestion, index) =>
          isLoading || !suggestion ? (
            <SkeletonRow key={index} />
          ) : (
            <TokenRow
              key={suggestion.address}
              token={suggestion as TokenApi}
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
  tokens: TokenApi[]
  queryText: string
  hasInput: boolean
  isLoading: boolean
}

export const SearchBarDropdown = ({ toggleOpen, tokens, queryText, hasInput, isLoading }: SearchBarDropdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)

  const { data: searchHistory } = useRecentlySearchedAssets()
  const shortenedHistory = useMemo(() => searchHistory?.slice(0, 2) ?? [...Array<SearchToken>(2)], [searchHistory])

  const { pathname } = useLocation()
  const { chainId } = useWeb3React()
  const isNFTPage = useIsNftPage()
  const isTokenPage = pathname.includes('/tokens')
  const [resultsState, setResultsState] = useState<ReactNode>()

  // const { data: trendingTokenData } = useTrendingTokens(useWeb3React().chainId)

  // const trendingTokensLength = isTokenPage ? 3 : 2
  // const trendingTokens = useMemo(
  //   () => trendingTokenData?.slice(0, trendingTokensLength) ?? [...Array<SearchToken>(trendingTokensLength)],
  //   [trendingTokenData, trendingTokensLength]
  // )

  // const totalSuggestions = hasInput
  //   ? tokens.length
  //   : Math.min(shortenedHistory.length, 2) + (isTokenPage || !isNFTPage ? trendingTokens?.length ?? 0 : 0)

  // Navigate search results via arrow keys
  // useEffect(() => {
  //   const keyDownHandler = (event: KeyboardEvent) => {
  //     if (event.key === 'ArrowUp') {
  //       event.preventDefault()
  //       if (!hoveredIndex) {
  //         setHoveredIndex(totalSuggestions - 1)
  //       } else {
  //         setHoveredIndex(hoveredIndex - 1)
  //       }
  //     } else if (event.key === 'ArrowDown') {
  //       event.preventDefault()
  //       if (hoveredIndex && hoveredIndex === totalSuggestions - 1) {
  //         setHoveredIndex(0)
  //       } else {
  //         setHoveredIndex((hoveredIndex ?? -1) + 1)
  //       }
  //     }
  //   }
  //
  //   document.addEventListener('keydown', keyDownHandler)
  //
  //   return () => {
  //     document.removeEventListener('keydown', keyDownHandler)
  //   }
  // }, [toggleOpen, hoveredIndex, totalSuggestions])

  useEffect(() => {
    if (!isLoading) {
      const tokenSearchResults =
        tokens && tokens.length > 0 ? (
          <SearchBarDropdownSection
            hoveredIndex={hoveredIndex}
            startingIndex={0}
            setHoveredIndex={setHoveredIndex}
            toggleOpen={toggleOpen}
            suggestions={tokens}
            eventProperties={{
              suggestion_type: null
            }}
            header={<Trans>Tokens</Trans>}
          />
        ) : (
          <Box className={styles.notFoundContainer}>
            <Trans>No tokens found.</Trans>
          </Box>
        )

      const currentState = () =>
        hasInput ? (
          // Empty or Up to 8 combined tokens
          <Column gap="20">{tokenSearchResults}</Column>
        ) : (
          // Recent Searches
          <Column gap="20">
            {shortenedHistory.length > 0 && (
              <SearchBarDropdownSection
                hoveredIndex={hoveredIndex}
                startingIndex={0}
                setHoveredIndex={setHoveredIndex}
                toggleOpen={toggleOpen}
                suggestions={shortenedHistory}
                eventProperties={{
                  suggestion_type: null,
                }}
                header={<Trans>Recent searches</Trans>}
                headerIcon={<ClockIcon color={colors.neutralLightest} />}
                isLoading={!searchHistory}
              />
            )}
          </Column>
        )

      setResultsState(currentState)
    }
  }, [
    isLoading,
    tokens,
    hoveredIndex,
    toggleOpen,
    shortenedHistory,
    hasInput,
    isNFTPage,
    isTokenPage,
    queryText,
    searchHistory,
  ])

  return (
    <Box className={styles.searchBarDropdownNft}>
      <Box opacity={isLoading ? '0.3' : '1'} transition="125">
        {resultsState}
      </Box>
    </Box>
  )
}
