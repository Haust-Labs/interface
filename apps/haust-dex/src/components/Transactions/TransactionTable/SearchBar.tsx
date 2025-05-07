import { Trans } from '@lingui/macro'
import searchIcon from 'assets/svg/search.svg'
import useDebounce from 'hooks/useDebounce'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import styled, { useTheme } from 'styled-components/macro'
import { Search as SearchIcon } from 'react-feather'
import { useEffect, useState } from 'react'
import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { filterStringAtom } from '../state'


const SearchBarContainer = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  border: ${({ $isExpanded, theme }) => ($isExpanded ? `1.5px solid ${theme.accentActive}` : `1px solid ${theme.neutralBorder}`)};
  border-radius: 12px;
  padding:${({ $isExpanded }) => ($isExpanded ? '8px 11px' : '8px 11px')};
  width: ${({ $isExpanded }) => ($isExpanded ? '200px' : '44px')};
  transition: width 0.2s ease-in-out;
  overflow: hidden;
  height: 40px;
  position: relative;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    width: ${({ $isExpanded }) => ($isExpanded ? '100%' : '44px')};
  }

  :hover {
    background-color: ${({ theme }) => (theme.backgroundSurface)};
  }
`
const SearchIconStyled = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: url(${searchIcon}) no-repeat center;
  background-size: contain;
  filter: ${({ theme }) => theme.darkMode ? 'brightness(0) invert(1)' : 'none'};
`
const SearchInput = styled.input<{ $isExpanded: boolean }>`
  background: none;
  border-radius: 12px;
  border: none;
  height: 100%;
  width: min(200px, 100%);
  margin: 0 !important;
  padding: 8px 40px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  opacity: ${({ $isExpanded }) => ($isExpanded ? '1' : '0')};
  cursor: ${({ $isExpanded }) => ($isExpanded ? 'text' : 'pointer')};
  position: absolute;
  left: 0;
  top: 0;

  :focus {
    outline: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.textTertiary};
  }
  ::-webkit-search-cancel-button {
    -webkit-appearance: none;
    display: none;
  }
`

export default function SearchBar() {
  const currentString = useAtomValue(filterStringAtom)
  const [localFilterString, setLocalFilterString] = useState(currentString)
  const setFilterString = useUpdateAtom(filterStringAtom)
  const debouncedLocalFilterString = useDebounce(localFilterString, 300)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    setLocalFilterString(currentString)
  }, [currentString])

  useEffect(() => {
    setFilterString(debouncedLocalFilterString)
  }, [debouncedLocalFilterString, setFilterString])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container')
      if (isExpanded && searchContainer && !searchContainer.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  useEffect(() => {
    if (isExpanded) {
      document.getElementById('searchBar')?.focus()
    }
  }, [isExpanded])

  const theme = useTheme()

  return (
    <SearchBarContainer className="search-container" $isExpanded={isExpanded}>
      {!isExpanded ? (
        <SearchIcon 
          onClick={() => setIsExpanded(true)} 
          size={20} 
          style={{ cursor: 'pointer', color: theme.textPrimary }}
        />
      ) : (
        <>
          <SearchIconStyled />
          <Trans
            render={({ translation }) => (
              <SearchInput
                data-cy="explore-tokens-search-input"
                type="search"
                placeholder={`${translation}`}
                id="searchBar"
                autoComplete="off"
                value={localFilterString}
                onChange={({ target: { value } }) => setLocalFilterString(value)}
                $isExpanded={isExpanded}
              />
            )}
          >
            Search tokens
          </Trans>
        </>
      )}
    </SearchBarContainer>
  )
}
