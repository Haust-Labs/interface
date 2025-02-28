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
import { sortMethodAtom, sortAscendingAtom, TransactionSortMethod } from '../state'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import useTopTokensQuery from 'graphql/thegraph/TopTokensQuery';
import ms from 'ms.macro';
import { CornerLeftUp } from 'react-feather'
import usePollsData from 'graphql/thegraph/PollsDataQuery';
import { TOKEN_ADDRESSES } from 'constants/tokens';
import { filterStringAtom } from 'components/Tokens/state';
import useTransactionHistory from 'graphql/thegraph/TransactionHistoryQuery';
import { HeaderRow, LoadedRow, LoadingRow, ColumnVisibility, GridConfig, DEFAULT_COLUMN_VISIBILITY } from './TransactionRow';

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

// Default grid configuration
export const DEFAULT_GRID_CONFIG: GridConfig = {
  desktop: '1fr 3fr 2fr 2fr 2fr 2fr', // 6 columns
  laptop: '1fr 3fr 2fr 2fr 2fr',
  tablet: '1fr 3fr 2fr 2fr',
  mobile: '1fr 2fr'
}

function NoTokensState({ 
  message, 
  columnVisibility,
  gridConfig 
}: { 
  message: ReactNode
  columnVisibility: ColumnVisibility
  gridConfig: GridConfig 
}) {
  return (
    <TableContainer>
      <TableHead $top={0}>
        <HeaderRow columnVisibility={columnVisibility} gridConfig={gridConfig} />
      </TableHead>
      <TableBodyContainer>
        <TokenDataContainer>
          <NoTokenDisplay>{message}</NoTokenDisplay>
        </TokenDataContainer>
      </TableBodyContainer>
    </TableContainer>
  )
}

const LoadingRows = ({ 
  rowCount,
  columnVisibility,
  gridConfig 
}: { 
  rowCount: number
  columnVisibility: ColumnVisibility
  gridConfig: GridConfig 
}) => (
  <>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return (
          <LoadingRow 
            key={index} 
            first={index === 0} 
            last={index === rowCount - 1}
            columnVisibility={columnVisibility}
            gridConfig={gridConfig}
          />
        )
      })}
  </>
)

function LoadingTokenTable({ 
  rowCount = PAGE_SIZE,
  columnVisibility,
  gridConfig 
}: { 
  rowCount?: number
  columnVisibility: ColumnVisibility
  gridConfig: GridConfig 
}) {
  return (
    <TableContainer>
      <TableHead $top={0}>
        <HeaderRow columnVisibility={columnVisibility} gridConfig={gridConfig} />
      </TableHead>
      <TableBodyContainer>
        <TokenDataContainer>
          <LoadingRows 
            rowCount={rowCount} 
            columnVisibility={columnVisibility}
            gridConfig={gridConfig}
          />
        </TokenDataContainer>
      </TableBodyContainer>
    </TableContainer>
  )
}

export default function TransactionTable({ 
  referenceToken,
  columnVisibility = DEFAULT_COLUMN_VISIBILITY,
  gridConfig = DEFAULT_GRID_CONFIG
}: { 
  referenceToken?: string
  columnVisibility?: ColumnVisibility
  gridConfig?: GridConfig
}) {
  const { isLoading, error, data } = useTransactionHistory(ms`10s`)
  const searchFilter = useAtomValue(filterStringAtom)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const { transactions }: { transactions: any } = data ?? {}
  
  const headerHeight = 72
  const [showReturn, setShowReturn] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowReturn(window.scrollY >= 600)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  if (isLoading && !transactions) {
    return <LoadingTokenTable 
      rowCount={PAGE_SIZE} 
      columnVisibility={columnVisibility}
      gridConfig={gridConfig}
    />
  } else if (!transactions) {
    return (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading tokens. Please try again.</Trans>
          </>
        }
        columnVisibility={columnVisibility}
        gridConfig={gridConfig}
      />
    )
  } else if (transactions?.length === 0) {
    return (
      <NoTokensState 
        message={<Trans>No tokens found</Trans>}
        columnVisibility={columnVisibility}
        gridConfig={gridConfig}
      />
    )
  } else {
    return (
      <TableContainer>
        <TableHead $top={headerHeight}>
          <HeaderRow columnVisibility={columnVisibility} gridConfig={gridConfig} />
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
            {transactions.map(
              (transaction: any, index: number) =>
                transaction?.id && (
                  <LoadedRow
                    key={transaction.id}
                    transactionListIndex={index}
                    transactionListLength={transactions.length}
                    transaction={transaction}
                    sortRank={transaction.timestamp}
                    referenceToken={referenceToken}
                    columnVisibility={columnVisibility}
                    gridConfig={gridConfig}
                  />
                )
            )}
          </TokenDataContainer>
        </TableBodyContainer>
      </TableContainer>
    )
  }
}
