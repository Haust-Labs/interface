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
import { filterStringAtom, sortMethodAtom, sortAscendingAtom, TokenSortMethod } from '../state'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'
import useTopTokensQuery from 'graphql/thegraph/TopTokensQuery';
import ms from 'ms.macro';
import { CornerLeftUp } from 'react-feather'

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

export default function TokenTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { tokenSortRank, loadingTokens } = useTopTokensApi();
  const { isLoading, error, data } = useTopTokensQuery(ms`30s`)
  const searchFilter = useAtomValue(filterStringAtom)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  
  // Define allowed token IDs
  const allowedTokenIds = ['0x6c25c1cb4b8677982791328471be1bfb187687c1',
    "0x87054392461F52a513d83EF2e06af50f4e2F6614", // USDT
    "0x1AfB500AFfBBc8a7FC8aB0f5C4D06c59AC87B111", // USDC
    "0x48C3C36CE1DF7d5852FB4cda746015a9971A882E", // WETH
    "0x595BC82909f2311Cf19E865bc82e7930b103540C",
    '0x6c25c1cb4b8677982791328471be1bfb187687c1_haust' // WBTC
] // Replace with your actual token IDs
  console.log("data1", data)
  // Filter and process tokens data
  const processedData = React.useMemo(() => {
    if (!data?.tokens) return { tokens: [], sparklines: {} }
    
    let filteredTokens = data.tokens.filter((token: any) => 
      allowedTokenIds.map(id => id.toLowerCase()).includes(token.address.toLowerCase())
    )
    
    // Apply search filter
    if (searchFilter) {
      const searchTerm = searchFilter.toLowerCase()
      filteredTokens = filteredTokens.filter((token: any) => 
        token.name.toLowerCase().includes(searchTerm) || 
        token.symbol.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    filteredTokens.sort((a, b) => {
      let compareValue = 0
      
      switch (sortMethod) {
        case TokenSortMethod.PRICE:
          compareValue = Number(a.priceUsd) - Number(b.priceUsd)
          break
        case TokenSortMethod.ONE_HOUR:
          compareValue = Number(a.marketData.hourlyPriceChange) - Number(b.marketData.hourlyPriceChange)
          break
        case TokenSortMethod.ONE_DAY:
          compareValue = Number(a.marketData.pricePercentChange) - Number(b.marketData.pricePercentChange)
          break
        case TokenSortMethod.TOTAL_VALUE_LOCKED:
          compareValue = Number(a.totalValueLockedUsd) - Number(b.totalValueLockedUsd)
          break
        case TokenSortMethod.VOLUME:
          compareValue = Number(a.marketData.volume) - Number(b.marketData.volume)
          break
        default:
          compareValue = 0
      }

      return sortAscending ? compareValue : -compareValue
    })
    
    return {
      tokens: filteredTokens,
      sparklines: data.sparklines
    }
  }, [data, searchFilter, sortMethod, sortAscending])

  const { tokens, sparklines }: { tokens: any, sparklines: any } = processedData ?? {}
  const headerHeight = 72
  const [showReturn, setShowReturn] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowReturn(window.scrollY >= 600)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loadingTokens && !tokens) {
    return <LoadingTokenTable rowCount={PAGE_SIZE} />
  } else if (!tokens) {
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
  } else if (tokens?.length === 0) {
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
            {tokens.map(
              (token: any, index: number) =>
                token?.id && (
                  <LoadedRow
                    key={token.id}
                    tokenListIndex={index}
                    tokenListLength={tokens.length}
                    token={token}
                    sparklineMap={sparklines}
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
