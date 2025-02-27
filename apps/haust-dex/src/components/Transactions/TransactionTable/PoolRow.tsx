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
  PoolSortMethod,
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
  grid-template-columns: 1fr 6fr 3fr 3fr 3fr 3fr 3fr;
  line-height: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  ${({ first, last }) => css`
    height: ${first || last ? '72px' : '64px'};
    padding-top: ${first ? '8px' : '0px'};
    padding-bottom: ${last ? '8px' : '0px'};
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
  border-radius: 20px;

  &:hover {
    ${({ loading, theme }) =>
      !loading &&
      css`
        background-color: ${theme.buttonSecondaryHover};
      `}
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 6.5fr 4.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
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
  grid-template-columns: 1fr 6fr 3fr 3fr 3fr 3fr 3fr;
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

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const DataCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  user-select: ${({ sortable }) => (sortable ? 'none' : 'unset')};
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

const HeaderCellWrapper = styled.span<{ onClick?: () => void }>`
  align-items: center;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  gap: 4px;
  justify-content: flex-end;
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

export const HEADER_DESCRIPTIONS: Record<PoolSortMethod, ReactNode | undefined> = {
  [PoolSortMethod.APR]: undefined,
  [PoolSortMethod.ONE_DAY_VOLUME]: undefined,
  [PoolSortMethod.THIRTY_DAY_VOLUME]: undefined,
  [PoolSortMethod.TOTAL_VALUE_LOCKED]: (
    <Trans>
      Total value locked (TVL) is the aggregate amount of the asset available across all Haust DEX v3 liquidity pools.
    </Trans>
  ),
  [PoolSortMethod.ONE_DAY_VOLUME_TO_TVL]: (
    <Trans>Volume is the amount of the asset that has been traded on Haust DEX v3 during the selected time frame.</Trans>
  ),
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
}: {
  category: PoolSortMethod // TODO: change this to make it work for trans
}) {
  const theme = useTheme()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const handleSortCategory = useSetSortMethod(category)
  const sortMethod = useAtomValue(sortMethodAtom)

  const description = HEADER_DESCRIPTIONS[category]

  return (
    <HeaderCellWrapper onClick={handleSortCategory}>
      {sortMethod === category && (
        <>
          {sortAscending ? (
            <ArrowUp size={20} strokeWidth={1.8} color={theme.accentActive} />
          ) : (
            <ArrowDown size={20} strokeWidth={1.8} color={theme.accentActive} />
          )}
        </>
      )}
      {category}
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
function PoolRow({
  header,
  listNumber,
  poolInfo,
  apr,
  oneDayVolume,
  thirtyDayVolume,
  tvl,
  oneDayVolumeToTvl,
  ...rest
}: {
  first?: boolean
  header: boolean
  listNumber: ReactNode
  loading?: boolean
  tvl: ReactNode
  apr: ReactNode
  oneDayVolume: ReactNode
  thirtyDayVolume: ReactNode
  poolInfo: ReactNode
  oneDayVolumeToTvl: ReactNode
  last?: boolean
  style?: CSSProperties
}) {
  const rowCells = (
    <>
      <ListNumberCell header={header}>{listNumber}</ListNumberCell>
      <NameCell data-testid="name-cell">{poolInfo}</NameCell>
      <TvlCell data-testid="tvl-cell" sortable={header}>
        {tvl}
      </TvlCell>
      <AprCell data-testid="apr-cell" sortable={header}>
        {apr}
      </AprCell>
      <PercentChangeCell data-testid="percent-change-cell" sortable={header}>
        {oneDayVolume}
      </PercentChangeCell>
      <PercentChangeCell data-testid="percent-change-cell" sortable={header}>
        {thirtyDayVolume}
      </PercentChangeCell>
      <VolumeCell data-testid="volume-cell" sortable={header}>
        {oneDayVolumeToTvl}
      </VolumeCell>
    </>
  )
  if (header) return <StyledHeaderRow data-testid="header-row">{rowCells}</StyledHeaderRow>
  return <StyledTokenRow {...rest}>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <PoolRow
      header={true}
      listNumber="#"
      poolInfo={<Trans>Pool</Trans>}
      tvl={<HeaderCell category={PoolSortMethod.TOTAL_VALUE_LOCKED} />}
      apr={<HeaderCell category={PoolSortMethod.APR} />}
      oneDayVolume={<HeaderCell category={PoolSortMethod.ONE_DAY_VOLUME} />}
      thirtyDayVolume={<HeaderCell category={PoolSortMethod.THIRTY_DAY_VOLUME} />}
      oneDayVolumeToTvl={<HeaderCell category={PoolSortMethod.ONE_DAY_VOLUME_TO_TVL} />}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow(props: { first?: boolean; last?: boolean }) {
  return (
    <PoolRow
      header={false}
      listNumber={<SmallLoadingBubble />}
      poolInfo={
        <>
          <IconLoadingBubble />
          <MediumLoadingBubble />
        </>
      }
      apr={<MediumLoadingBubble />}
      oneDayVolume={<LoadingBubble />}
      thirtyDayVolume={<LoadingBubble />}
      oneDayVolumeToTvl={<LoadingBubble />}
      tvl={<LoadingBubble />}
      {...props}
    />
  )
}

interface LoadedRowProps {
  poolListIndex: number
  poolListLength: number
  pool: NonNullable<any>
  sortRank: number
}

/* Loaded State: row component with token information */
export const LoadedRow = forwardRef((props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { chainId } = useWeb3React()
  const { poolListIndex, poolListLength, pool, sortRank } = props
  const filterString = useAtomValue(filterStringAtom)
  const nativeToken = useNativeCurrency()
  const token0Currency = useCurrency(pool.token0.id)
  const token1Currency = useCurrency(pool.token1.id)

  const filterNetwork = validateUrlChainParam(useParams<{ chainName?: string }>().chainName?.toUpperCase())
  const timePeriod = useAtomValue(filterTimeAtom)
  
  const currencyQuote = pool.token0.symbol.toUpperCase() === 'WHAUST' 
    ? nativeToken 
    : token0Currency
  const currencyBase = pool.token1.symbol.toUpperCase() === 'WHAUST'
    ? nativeToken
    : token1Currency
console.log(pool, Number(pool.feeTier), Number(pool.totalValueLockedUSD), 'apr');

  return (
    <div ref={ref} data-testid={`pool-table-row-${pool.token0.symbol}`}>
      <StyledLink
        to={getTokenDetailsURL({address: pool.token0.address})}
        onClick={noop}
      >
        <PoolRow
          header={false}
          listNumber={sortRank}
          poolInfo={
            <ClickableName>
              <PortfolioLogo chainId={chainId as SupportedChainId} currencies={[currencyQuote!, currencyBase!]} size="44px" />
              <TokenInfoCell>
                <TokenName data-cy="pool-name">{currencyQuote?.symbol?.toUpperCase()}&nbsp;/&nbsp;{currencyBase?.symbol?.toUpperCase()}</TokenName>
                <FeeTierText>
                  <Trans>{pool.feeTier / 10000}%</Trans>
                </FeeTierText>
              </TokenInfoCell>
            </ClickableName>
          }
          apr={
            <ClickableContent>
              <PriceInfoCell>
              {(Number(pool.poolDayData[0].feesUSD) / Number(pool.totalValueLockedUSD) * 365 * 100).toFixed(2)}%
              </PriceInfoCell>
            </ClickableContent>
          }
          oneDayVolume={
            <ClickableContent>
              {formatNumber(Number(Number(pool?.poolDayData[0]?.volumeUSD).toFixed(2)), NumberType.FiatTokenStats)}
            </ClickableContent>
          }
          thirtyDayVolume={
            <ClickableContent>
                {formatNumber(
                    pool.poolDayData.slice(0, 30).reduce((sum: number, day: any) => sum + Number(day.volumeUSD), 0),
                    NumberType.FiatTokenStats
                  )}
            </ClickableContent>
          }
          tvl={
            <ClickableContent>
              {formatUSDPrice(Number(pool.totalValueLockedUSD), NumberType.FiatTokenStats)}
            </ClickableContent>
          }
          oneDayVolumeToTvl={
            <ClickableContent>
              {formatNumber(
                Number(pool?.poolDayData[0]?.volumeUSD) / Number(pool.totalValueLockedUSD)
                
              )}
            </ClickableContent>
          }
          first={poolListIndex === 0}
          last={poolListIndex === poolListLength - 1}
        />
      </StyledLink>
    </div>
  )
})

LoadedRow.displayName = 'LoadedRow'
