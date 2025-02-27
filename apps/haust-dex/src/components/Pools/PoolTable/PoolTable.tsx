import { Trans } from '@lingui/macro'
import {useTopTokensApi} from 'api/TopTokens';
import {validateUrlChainParam} from "api/util";
import { PAGE_SIZE, useTopTokens } from 'graphql/data/TopTokens'
import { ReactNode } from 'react'
import { AlertTriangle, ArrowUp } from 'react-feather'
import {useParams} from "react-router-dom";
import styled from 'styled-components/macro'
import { useState, useEffect } from 'react'
import React from 'react'
import { useAtomValue } from 'jotai/utils'
import { sortMethodAtom, sortAscendingAtom, PoolSortMethod } from '../state'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './PoolRow'
import useTopTokensQuery from 'graphql/thegraph/TopTokensQuery';
import ms from 'ms.macro';
import { CornerLeftUp } from 'react-feather'
import usePollsData from 'graphql/thegraph/PollsDataQuery';
import { TOKEN_ADDRESSES } from 'constants/tokens';
import { filterStringAtom } from 'components/Tokens/state';

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: transparent;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.borderSecondary};
`

const TableHead = styled.div<{ $top: number }>`
  position: sticky;
  top: ${({ $top }) => $top + 20}px;
  z-index: 3;
  width: 100%;

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: -1px;
    right: -1px;
    height: 20px;
    background: ${({ theme }) => theme.background};
  }
`

const TableBodyContainer = styled.div`
  overflow-y: auto;
  width: 100%;
`

const TokenDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  width: 100%;
`

const NoTokenDisplay = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 500;
  align-items: center;
  padding: 0px 28px;
  gap: 8px;
`

const ReturnButtonContainer = styled.div<{ top: number }>`
  position: absolute;
  top: ${({ top }) => top + 40}px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  width: auto;
  pointer-events: none;
  z-index: 4;
`

const ReturnButton = styled.div`
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 20px;
  background: ${({ theme }) => theme.accentWarning};
  backdrop-filter: blur(10px);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  color: ${({ theme }) => theme.accentAction};

  &:hover {
  background: ${({ theme }) => theme.accentWarning};
  backdrop-filter: blur(10px);
  }
`

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <TableContainer>
      <TableHead $top={0}>
        <HeaderRow />
      </TableHead>
      <TableBodyContainer>
        <TokenDataContainer>
          <NoTokenDisplay>{message}</NoTokenDisplay>
        </TokenDataContainer>
      </TableBodyContainer>
    </TableContainer>
  )
}

const LoadingRows = ({ rowCount }: { rowCount: number }) => (
  <>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} first={index === 0} last={index === rowCount - 1} />
      })}
  </>
)

function LoadingTokenTable({ rowCount = PAGE_SIZE }: { rowCount?: number }) {
  return (
    <TableContainer>
      <TableHead $top={0}>
        <HeaderRow />
      </TableHead>
      <TableBodyContainer>
        <TokenDataContainer>
          <LoadingRows rowCount={rowCount} />
        </TokenDataContainer>
      </TableBodyContainer>
    </TableContainer>
  )
}

export default function PoolTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { isLoading, error, data } = usePollsData(ms`30s`)
  const searchFilter = useAtomValue(filterStringAtom)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const { pools }: { pools: any } = data ?? {}
  
  const headerHeight = 72
  const [showReturn, setShowReturn] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowReturn(window.scrollY >= 600)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isValidToken = (address: string) => {
    return Object.values(TOKEN_ADDRESSES).some(
      tokenAddress => tokenAddress?.address?.toLowerCase() === address.toLowerCase()
    )
  }

  const filteredPools = pools?.filter((pool: any) => {
    const hasValidTokens = pool?.token0?.id && 
      pool?.token1?.id && 
      isValidToken(pool.token0.id) && 
      isValidToken(pool.token1.id);

    if (!hasValidTokens) return false;
    
    if (!searchFilter) return true;

    const searchTerm = searchFilter.toLowerCase();
    
    const pairString = `${pool.token0.symbol.toUpperCase()} / ${pool.token1.symbol.toUpperCase()}`;
    
    if (searchTerm.includes('/')) {
      const [token0Search, token1Search] = searchTerm.split('/').map(term => term.trim());
      
      if (token1Search) {
        return pool.token0.symbol.toLowerCase().startsWith(token0Search) &&
               pool.token1.symbol.toLowerCase().startsWith(token1Search);
      }
      
      return pool.token0.symbol.toLowerCase().startsWith(token0Search);
    }
    
    return pairString.toLowerCase().includes(searchTerm);
  });
  
  if (isLoading && !pools) {
    return <LoadingTokenTable rowCount={PAGE_SIZE} />
  } else if (!filteredPools) {
    return (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading tokens. Please try again.</Trans>
          </>
        }
      />
    )
  } else if (filteredPools?.length === 0) {
    return <NoTokensState message={<Trans>No tokens found</Trans>} />
  } else {
    return (
      <TableContainer>
        <TableHead $top={headerHeight}>
          <HeaderRow />
          {showReturn && (
            <ReturnButtonContainer top={20}>
              <ReturnButton
                onClick={() => {
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  })
                }}
              >
                <CornerLeftUp size={14} />
                <Trans>Return to top</Trans>
              </ReturnButton>
            </ReturnButtonContainer>
          )}
        </TableHead>
        <TableBodyContainer>
          <TokenDataContainer>
            {filteredPools.map(
              (pool: any, index: number) =>
                pool?.id && (
                  <LoadedRow
                    key={pool.id}
                    poolListIndex={index}
                    poolListLength={filteredPools.length}
                    pool={pool}
                    sortRank={index+1}
                  />
                )
            )}
          </TokenDataContainer>
        </TableBodyContainer>
      </TableContainer>
    )
  }
}
