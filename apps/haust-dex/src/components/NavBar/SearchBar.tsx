// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import {useSearchTokensApi} from "api/SearchTokens";
import clsx from 'clsx'
import { useNftGraphqlEnabled } from 'featureFlags/flags/nftlGraphql'
import { useCollectionSearch } from 'graphql/data/nft/CollectionSearch'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import {noop} from "lodash";
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { ChevronLeftIcon, MagnifyingGlassIcon, NavMagnifyingGlassIcon } from 'nft/components/icons'
import { magicalGradientOnHover } from 'nft/css/common.css'
import { useIsMobile, useIsTablet } from 'nft/hooks'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { ChangeEvent, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { colors } from 'theme/colors'

import { NavIcon } from './NavIcon'
import * as styles from './SearchBar.css'
import { SearchBarDropdown } from './SearchBarDropdown'
import useTopTokensQuery from 'graphql/thegraph/TopTokensQuery';

export const SearchBar = () => {
  const [isOpen, toggleOpen] = useReducer((state: boolean) => !state, false)
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isNavSearchInputVisible = useIsNavSearchInputVisible()
  const { data: topTokens, isLoading: topTokensAreLoading } = useTopTokensQuery(10000)
  useOnClickOutside(searchRef, () => {
    isOpen && toggleOpen()
  })

  const filteredTokens = useMemo(() => {
    if (!topTokens?.tokens) return []
    
    if (!debouncedSearchValue) {
      return topTokens.tokens
        .sort((a, b) => {
          const volumeA = Number(a.marketData?.volume ?? 0)
          const volumeB = Number(b.marketData?.volume ?? 0)
          return volumeB - volumeA
        })
        .slice(0, 3)
    }
    
    const searchLower = debouncedSearchValue.toLowerCase()
    return topTokens.tokens.filter(token => 
      token.name.toLowerCase().includes(searchLower) || 
      token.symbol.toLowerCase().includes(searchLower)
    )
  }, [topTokens?.tokens, debouncedSearchValue])

  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        toggleOpen()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [isOpen, toggleOpen])

  // clear searchbar when changing pages
  useEffect(() => {
    setSearchValue('')
  }, [pathname])

  // auto set cursor when searchbar is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const isMobileOrTablet = isMobile || isTablet || !isNavSearchInputVisible

  const placeholderText = useMemo(() => {
    return isMobileOrTablet ? t`Search` : t`Search tokens`
  }, [isMobileOrTablet])

  const handleKeyPress = useCallback(
    (event: any) => {
      const isInputField = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA';
      
      if (event.key === '/' && !isInputField) {
        event.preventDefault()
        !isOpen && toggleOpen()
      }
    },
    [isOpen]
  )

  useEffect(() => {
    const innerRef = inputRef.current

    if (innerRef !== null) {
      //only mount the listener when input available as ref
      document.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      if (innerRef !== null) {
        document.removeEventListener('keydown', handleKeyPress)
      }
    }
  }, [handleKeyPress, inputRef])

  return (
    <>
      <Box
        data-cy="search-bar"
        position={{ sm: 'fixed', md: 'absolute', xl: 'relative' }}
        width={{ sm: isOpen ? 'viewWidth' : 'auto', md: 'auto' }}
        ref={searchRef}
        className={styles.searchBarContainerNft}
        display={{ sm: isOpen ? 'inline-block' : 'none', xl: 'inline-block' }}
      >
        <Row
          className={clsx(
            styles.nftSearchBar,
            !isOpen && !isMobile && magicalGradientOnHover,
            isMobileOrTablet && (isOpen ? styles.visible : styles.hidden)
          )}
          borderRadius={isOpen || isMobileOrTablet ? undefined : '20'}
          borderTopRightRadius={isOpen && !isMobile ? '20' : undefined}
          borderTopLeftRadius={isOpen && !isMobile ? '20' : undefined}
          borderBottomWidth={isOpen || isMobileOrTablet ? '0px' : '1px'}
          onClick={() => !isOpen && toggleOpen()}
          gap="20"
          style={{
            background: isOpen ? colors.neutralBase : undefined
          }}
        >
          <Box className={styles.searchContentLeftAlign}>
            <Box display={{ sm: 'none', md: 'flex' }}>
              <MagnifyingGlassIcon color={colors.neutralLightest} />
            </Box>
            <Box display={{ sm: 'flex', md: 'none' }} color="textTertiary" onClick={toggleOpen}>
              <ChevronLeftIcon color={colors.neutralLightest} />
            </Box>
          </Box>
          <Trans
            id={placeholderText}
            render={({ translation }) => (
              <Box
                as="input"
                data-cy="search-bar-input"
                placeholder={translation as string}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  !isOpen && toggleOpen()
                  setSearchValue(event.target.value)
                }}
                onBlur={noop}
                className={`${styles.searchBarInput} ${styles.searchContentLeftAlign}`}
                value={searchValue}
                ref={inputRef}
                width="full"
              />
            )}
          />
        </Row>
        <Box className={clsx(isOpen ? styles.visible : styles.hidden)}>
          {isOpen && (
            <SearchBarDropdown
              toggleOpen={toggleOpen}
              tokens={filteredTokens}
              queryText={debouncedSearchValue}
              hasInput={searchValue.length > 0}
              isLoading={topTokensAreLoading}
            />
          )}
        </Box>
      </Box>
      {isMobileOrTablet && (
        <NavIcon onClick={toggleOpen} label={placeholderText}>
          <NavMagnifyingGlassIcon color={colors.neutralLighter} />
        </NavIcon>
      )}
    </>
  )
}
