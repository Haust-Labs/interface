import { Trans } from '@lingui/macro'
import { ParentSize } from '@visx/responsive'
import {TopTokenApi} from "api/TopTokens";
import {CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL, validateUrlChainParam} from "api/util";
import SparklineChart from 'components/Charts/SparklineChart'
import { MouseoverTooltip } from 'components/Tooltip'
import { formatNumber, formatUSDPrice, NumberType } from 'conedison/format'
import { SparklineMap } from 'graphql/data/TopTokens'
import { useAtomValue } from 'jotai/utils'
import {noop} from "lodash";
import { ForwardedRef, forwardRef } from 'react'
import { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components/macro'
import { ClickableStyle, ThemedText } from 'theme'

import AssetLogo from "../../Logo/AssetLogo";
import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from '../constants'
import { LoadingBubble } from '../loading'
import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TransactionSortMethod,
  useSetSortMethod,
} from '../state'
import { ArrowCell, DeltaText, formatDelta, getDeltaArrow } from '../TransactionDetails/PriceChart'
import { useCurrency } from 'hooks/Tokens';
import CurrencyLogo from 'components/Logo/CurrencyLogo';
import useTokenDayPrices from 'graphql/thegraph/TokenDayPriceQuery';
import useTokenHourPrices from 'graphql/thegraph/TokenHourPriceQuery';
import { DeltaArrow } from '../Delta';
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo';
import { SupportedChainId } from 'constants/chains';
import { Percent } from '@uniswap/sdk-core';
import { useWeb3React } from '@web3-react/core';
import useNativeCurrency from 'lib/hooks/useNativeCurrency';
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink';
import { TOKEN_ADDRESSES } from 'constants/tokens';

const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`
const StyledTokenRow = styled.div<{
  first?: boolean
  last?: boolean
  loading?: boolean
}>`
  background-color: ${({ theme }) => theme.background};
  display: grid;
  font-size: 16px;
  grid-template-columns: 1fr 3fr 2fr 2fr 2fr 2fr;
  line-height: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  ${({ first, last }) => css`
    height: ${first || last ? '72px' : '64px'};
    padding-bottom: ${last ? '8px' : '0px'};
    border-bottom-left-radius: ${last ? '20px' : '0px'};
    border-bottom-right-radius: ${last ? '20px' : '0px'};
  `}
  padding-left: 12px;
  padding-right: 12px;
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
  width: 100%;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    ${({ loading, theme }) =>
      !loading &&
      css`
        background-color: ${theme.buttonDisabled};
        opacity: 0.7;
      `}
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 6.5fr 4.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
    column-gap: 24px;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 10fr 5fr 5fr 1.2fr;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 2fr 3fr;
    min-width: unset;
    border-bottom: 0.5px solid ${({ theme }) => theme.backgroundModule};

    :last-of-type {
      border-bottom: none;
    }
  }
`

const ClickableContent = styled.div`
  display: flex;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  align-items: center;
  cursor: pointer;
`
const ClickableName = styled(ClickableContent)`
  gap: 8px;
  max-width: 100%;
`
const StyledHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr 2fr 2fr 2fr 2fr;
  background: ${({ theme }) => theme.backgroundModule};
  border-bottom: 1px solid ${({ theme }) => theme.borderSecondary};
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  height: 48px;
  line-height: 16px;
  padding: 0 12px;
  width: 100%;
  justify-content: center;
  align-items: center;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  
  &:hover {
    background-color: ${({ theme }) => theme.backgroundModule};
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 6.5fr 4.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
    column-gap: 24px;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 10fr 5fr 5fr 1.2fr;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 2fr 3fr;
    min-width: unset;
    justify-content: space-between;
  }
`

const ListNumberCell = styled(Cell)<{ header: boolean }>`
  color: ${({ theme }) => theme.textSecondary};
  min-width: 32px;
  font-size: 14px;
  justify-content: flex-start;
  padding: 0 8px;
  text-align: left;
  direction: ltr;

  ${({ header }) => !header && `
    display: flex;
    align-items: center;
    gap: 8px;
  `}

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const DataCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  user-select: ${({ sortable }) => (sortable ? 'none' : 'unset')};
  text-align: right;
  direction: ltr;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
`
const TvlCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0 8px;
  min-width: 240px;
  gap: 8px;
  text-align: left;
  direction: ltr;
`
const AprCell = styled(DataCell)`
  padding-right: 8px;
`
const PercentChangeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const PercentChangeInfoCell = styled(Cell)`
  display: none;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: flex;
    justify-content: flex-end;
    color: ${({ theme }) => theme.textSecondary};
    font-size: 12px;
    line-height: 16px;
  }
`
const PriceInfoCell = styled(Cell)`
  justify-content: flex-end;
  flex: 1;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    align-items: flex-end;
  }
`

const HeaderCellWrapper = styled.span<{ onClick?: () => void; leftAlign?: boolean }>`
  align-items: center;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  gap: 4px;
  justify-content: ${({ leftAlign }) => (leftAlign ? 'flex-start' : 'flex-end')};
  width: 100%;

  &:hover {
    ${ClickableStyle}
  }
`
const SparkLineCell = styled(Cell)`
  min-width: 120px;
`
const SparkLine = styled(Cell)`
  width: 124px;
  height: 42px;
`
const StyledLink = styled(Link)`
  text-decoration: none;
`
const TokenInfoCell = styled(Cell)`
  gap: 8px;
  line-height: 24px;
  font-size: 16px;
  max-width: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  direction: ltr;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    justify-content: flex-start;
    flex-direction: column;
    gap: 0;
    width: max-content;
    font-weight: 500;
  }
`
const TokenName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  direction: ltr;
`
const TokenSymbol = styled(Cell)`
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    font-size: 12px;
    height: 16px;
    justify-content: flex-start;
    width: 100%;
  }
`
const VolumeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const SmallLoadingBubble = styled(LoadingBubble)`
  width: 25%;
`
const MediumLoadingBubble = styled(LoadingBubble)`
  width: 65%;
`
const LongLoadingBubble = styled(LoadingBubble)`
  width: 90%;
`
const IconLoadingBubble = styled(LoadingBubble)`
  border-radius: 50%;
  width: 24px;
`
export const SparkLineLoadingBubble = styled(LongLoadingBubble)`
  height: 4px;
`
const FeeTierText = styled(ThemedText.UtilityBadge)`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-size: 10px !important;
  background-color: ${({ theme }) => theme.neutralBorder};
  color: ${({ theme }) => theme.textLightGray};
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px !important;
  align-self: flex-start;
`

const InfoIconContainer = styled.div`
  margin-left: 2px;
  display: flex;
  align-items: center;
  cursor: help;
`

const ExplorerLink = styled.a`
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  
  &:hover {
    color: ${({ theme }) => theme.accentAction};
    cursor: pointer;
  }
`

const WalletCell = styled(DataCell)`
  &:hover {
    color: ${({ theme }) => theme.accentAction};
    cursor: pointer;
  }
`

export const HEADER_DESCRIPTIONS: Record<TransactionSortMethod, ReactNode | undefined> = {
  [TransactionSortMethod.TIME]: undefined,
  [TransactionSortMethod.TRANSACTION_INFO]: undefined,
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
  leftAlign,
}: {
  category: TransactionSortMethod
  leftAlign?: boolean
}) {
  const theme = useTheme()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const handleSortCategory = useSetSortMethod(category)
  const sortMethod = useAtomValue(sortMethodAtom)

  const description = HEADER_DESCRIPTIONS[category]

  return (
    <HeaderCellWrapper onClick={handleSortCategory} leftAlign={leftAlign}>
      {category === TransactionSortMethod.TIME || category === TransactionSortMethod.TRANSACTION_INFO ? (
        <div style={{ textAlign: 'left', direction: 'ltr' }}>
          {category}
        </div>
      ) : (
        <div style={{ textAlign: 'right', direction: 'ltr' }}>
          {category}
        </div>
      )}
      {sortMethod === category && (
        <>
          {sortAscending ? (
            <ArrowUp size={20} strokeWidth={1.8} color={theme.accentActive} />
          ) : (
            <ArrowDown size={20} strokeWidth={1.8} color={theme.accentActive} />
          )}
        </>
      )}
      {description && (
        <MouseoverTooltip text={description} placement="right">
          <InfoIconContainer>
            <Info size={14} />
          </InfoIconContainer>
        </MouseoverTooltip>
      )}
    </HeaderCellWrapper>
  )
}

/* Token Row: skeleton row component */
function TransactionRow({
  header,
  timestamp,
  transactionInfo,
  usd,
  token0,
  token1,
  wallet,
  ...rest
}: {
  first?: boolean
  header: boolean
  timestamp: ReactNode
  loading?: boolean
  usd: ReactNode
  token0: ReactNode
  token1: ReactNode
  wallet: ReactNode
  transactionInfo: ReactNode
  last?: boolean
  style?: CSSProperties
}) {
  const rowCells = (
    <>
      <ListNumberCell header={header}>
        {header ? timestamp : <ClickableContent>{timestamp}</ClickableContent>}
      </ListNumberCell>
      <NameCell data-testid="name-cell">{transactionInfo}</NameCell>
      <TvlCell data-testid="tvl-cell" sortable={header}>
        {usd}
      </TvlCell>
      <AprCell data-testid="apr-cell" sortable={header}>
        {token0}
      </AprCell>
      <PercentChangeCell data-testid="percent-change-cell" sortable={header}>
        {token1}
      </PercentChangeCell>
      <PercentChangeCell data-testid="percent-change-cell" sortable={header}>
        {wallet}
      </PercentChangeCell>
    </>
  )
  if (header) return <StyledHeaderRow data-testid="header-row">{rowCells}</StyledHeaderRow>
  return <StyledTokenRow {...rest}>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <TransactionRow
      header={true}
      timestamp={
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowDown size={16} />
          <Trans>Time</Trans>
        </div>
      }
      transactionInfo={<Trans>Type</Trans>}
      usd={<Trans>USD</Trans>}
      token0={<Trans>Token amount</Trans>}
      token1={<Trans>Token amount</Trans>}
      wallet={<Trans>Wallet</Trans>}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow(props: { first?: boolean; last?: boolean }) {
  return (
    <TransactionRow
      header={false}
      timestamp={<SmallLoadingBubble />}
      transactionInfo={
        <>
          <IconLoadingBubble />
          <MediumLoadingBubble />
        </>
      }
      usd={<MediumLoadingBubble />}
      token0={<LoadingBubble />}
      token1={<LoadingBubble />}
      wallet={<LoadingBubble />}
      {...props}
    />
  )
}

interface LoadedRowProps {
  transactionListIndex: number
  transactionListLength: number
  transaction: NonNullable<any>
  sortRank: number
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

/* Loaded State: row component with token information */
export const LoadedRow = forwardRef((props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { chainId } = useWeb3React()
  const { transactionListIndex, transactionListLength, transaction, sortRank } = props
  const filterString = useAtomValue(filterStringAtom)
  const nativeToken = useNativeCurrency()

  const isValidToken = (address: string) => {
    return Object.values(TOKEN_ADDRESSES).some(
      tokenAddress => tokenAddress?.address?.toLowerCase() === address.toLowerCase()
    )
  };

  const token0Id = transaction.swaps.length > 0 
    ? transaction.swaps[0].token0.id
    : transaction.burns.length > 0
    ? transaction.burns[0].token0.id
    : transaction.mints.length > 0
    ? transaction.mints[0].token0.id
    : ''

  const token1Id = transaction.swaps.length > 0 
    ? transaction.swaps[0].token1.id
    : transaction.burns.length > 0
    ? transaction.burns[0].token1.id
    : transaction.mints.length > 0
    ? transaction.mints[0].token1.id
    : ''


  const token0= isValidToken(token0Id)
  const token1 = isValidToken(token1Id)

  if(!token0 || !token1) {
    return null
  }

  const token0Currency = useCurrency(token0Id)
  const token1Currency = useCurrency(token1Id)
  
  const currencyQuote = token0Currency

  const currencyBase = token1Currency

  const getWalletAddress = () => {
    if (transaction.swaps.length > 0) return transaction.swaps[0].recipient
    if (transaction.burns.length > 0) return transaction.burns[0].origin
    if (transaction.mints.length > 0) return transaction.mints[0].origin
    return ''
  }

  const walletAddress = getWalletAddress()
  const walletExplorerLink = getExplorerLink(chainId ?? SupportedChainId.HAUST_TESTNET, walletAddress, ExplorerDataType.ADDRESS)
  const transactionExplorerLink = getExplorerLink(chainId ?? SupportedChainId.HAUST_TESTNET, transaction.id, ExplorerDataType.TRANSACTION)

  return (
    <div ref={ref} data-testid={`pool-table-row-${transaction.id}`}>
      <ExplorerLink
        href={transactionExplorerLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <TransactionRow
          header={false}
          timestamp={getTimeAgo(transaction.timestamp)}
          transactionInfo={
            <ClickableName>
              <TokenInfoCell>
                <TokenName data-cy="pool-name">
                  {transaction.swaps.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Swap <CurrencyLogo currency={currencyQuote} size="16px" style={{ margin: '0 4px' }} /> {currencyQuote?.symbol?.toUpperCase()} for{' '}
                      <CurrencyLogo currency={currencyBase} size="16px" style={{ margin: '0 4px' }} /> {currencyBase?.symbol?.toUpperCase()}
                    </div>
                  )}
                  {transaction.burns.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Remove <CurrencyLogo currency={currencyQuote} size="16px" style={{ margin: '0 4px' }} /> {currencyQuote?.symbol?.toUpperCase()} and{' '}
                      <CurrencyLogo currency={currencyBase} size="16px" style={{ margin: '0 4px' }} /> {currencyBase?.symbol?.toUpperCase()}
                    </div>
                  )}
                  {transaction.mints.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Add <CurrencyLogo currency={currencyQuote} size="16px" style={{ margin: '0 4px' }} /> {currencyQuote?.symbol?.toUpperCase()} and{' '}
                      <CurrencyLogo currency={currencyBase} size="16px" style={{ margin: '0 4px' }} /> {currencyBase?.symbol?.toUpperCase()}
                    </div>
                  )}
                </TokenName>
              </TokenInfoCell>
            </ClickableName>
          }
          usd={
            <ClickableContent>
              <PriceInfoCell>
                {transaction.swaps.length > 0 && formatUSDPrice(Number(transaction.swaps[0].amountUSD), NumberType.FiatTokenStats)}
                {transaction.burns.length > 0 && formatUSDPrice(Number(transaction.burns[0].amountUSD), NumberType.FiatTokenStats)}
                {transaction.mints.length > 0 && formatUSDPrice(Number(transaction.mints[0].amountUSD), NumberType.FiatTokenStats)}
              </PriceInfoCell>
            </ClickableContent>
          }
          token0={
            <ClickableContent>
              {transaction.swaps.length > 0 && `${formatNumber(Number(transaction.swaps[0].amount0), NumberType.TokenNonTx)} ${currencyQuote?.symbol}`}
              {transaction.burns.length > 0 && `${formatNumber(Number(transaction.burns[0].amount0), NumberType.TokenNonTx)} ${currencyQuote?.symbol}`}
              {transaction.mints.length > 0 && `${formatNumber(Number(transaction.mints[0].amount0), NumberType.TokenNonTx)} ${currencyQuote?.symbol}`}
            </ClickableContent>
          }
          token1={
            <ClickableContent>
              {transaction.swaps.length > 0 && `${formatNumber(Number(transaction.swaps[0].amount1), NumberType.TokenNonTx)} ${currencyBase?.symbol}`}
              {transaction.burns.length > 0 && `${formatNumber(Number(transaction.burns[0].amount1), NumberType.TokenNonTx)} ${currencyBase?.symbol}`}
              {transaction.mints.length > 0 && `${formatNumber(Number(transaction.mints[0].amount1), NumberType.TokenNonTx)} ${currencyBase?.symbol}`}
            </ClickableContent>
          }
          wallet={
            <ExplorerLink 
              href={walletExplorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-cell"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
            </ExplorerLink>
          }
          first={transactionListIndex === 0}
          last={transactionListIndex === transactionListLength - 1}
        />
      </ExplorerLink>
    </div>
  )
})

LoadedRow.displayName = 'LoadedRow'
