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
import { ClickableStyle } from 'theme'

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
  TokenSortMethod,
  useSetSortMethod,
} from '../state'
import { ArrowCell, DeltaText, formatDelta, getDeltaArrow } from '../TokenDetails/PriceChart'
import CurrencyLogo from 'components/Logo/CurrencyLogo';
import useTokenDayPrices from 'graphql/thegraph/TokenDayPriceQuery';
import useTokenHourPrices from 'graphql/thegraph/TokenHourPriceQuery';
import { DeltaArrow } from '../Delta';
import useNativeCurrency from 'lib/hooks/useNativeCurrency';
import { useCurrency } from 'hooks/Tokens';
import { isGqlSupportedChain } from 'graphql/data/util';
import { CHAIN_IDS_TO_NAMES, SupportedChainId } from 'constants/chains';
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink';

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
  grid-template-columns: 1fr 4fr 3fr 3fr 3fr 3fr 2fr 3fr;
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
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 10fr 5fr 5fr 1.2fr;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr;
    min-width: unset;
    border-bottom: 0.5px solid ${({ theme }) => theme.backgroundModule};
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
  grid-template-columns: 1fr 4fr 3fr 3fr 3fr 3fr 2fr 3fr;
  background: ${({ theme }) => theme.backgroundModule};
  border-bottom: 1px solid ${({ theme }) => theme.borderSecondary};
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  font-weight: 500;
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
    grid-template-columns: 1fr;
    min-width: unset;
  }
`

const ListNumberCell = styled(Cell)<{ header?: boolean }>`
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
const PriceCell = styled(DataCell)`
  padding-right: 8px;
  
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
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
  display: flex;
  justify-content: flex-end;
  min-width: 100px;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    display: none;
  }
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

const InfoIconContainer = styled.div`
  margin-left: 2px;
  display: flex;
  align-items: center;
  cursor: help;
`

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.ONE_HOUR]: undefined,
  [TokenSortMethod.ONE_DAY]: undefined,
  [TokenSortMethod.TOTAL_VALUE_LOCKED]: (
    <Trans>
      Total value locked (TVL) is the aggregate amount of the asset available across all Haust DEX v3 liquidity pools.
    </Trans>
  ),
  [TokenSortMethod.VOLUME]: (
    <Trans>Volume is the amount of the asset that has been traded on Haust DEX v3 during the selected time frame.</Trans>
  ),
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
}: {
  category: TokenSortMethod // TODO: change this to make it work for trans
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
function TokenRow({
  header,
  listNumber,
  tokenInfo,
  price,
  percentChangeOneHour,
  percentChangeOneDay,
  tvl,
  volume,
  sparkLine,
  ...rest
}: {
  first?: boolean
  header: boolean
  listNumber: ReactNode
  loading?: boolean
  tvl: ReactNode
  price: ReactNode
  percentChangeOneHour: ReactNode
  percentChangeOneDay: ReactNode
  sparkLine?: ReactNode
  tokenInfo: ReactNode
  volume: ReactNode
  last?: boolean
  style?: CSSProperties
}) {
  const rowCells = (
    <>
      <ListNumberCell header={header}>{listNumber}</ListNumberCell>
      <NameCell data-testid="name-cell">{tokenInfo}</NameCell>
      <PriceCell data-testid="price-cell" sortable={header}>
        {price}
      </PriceCell>
      <PercentChangeCell data-testid="percent-change-cell" sortable={header}>
        {percentChangeOneHour}
      </PercentChangeCell>
      <PercentChangeCell data-testid="percent-change-cell" sortable={header}>
        {percentChangeOneDay}
      </PercentChangeCell>
      <TvlCell data-testid="tvl-cell" sortable={header}>
        {tvl}
      </TvlCell>
      <VolumeCell data-testid="volume-cell" sortable={header}>
        {volume}
      </VolumeCell>
      <SparkLineCell>{sparkLine}</SparkLineCell>
    </>
  )
  if (header) return <StyledHeaderRow data-testid="header-row">{rowCells}</StyledHeaderRow>
  return <StyledTokenRow {...rest}>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <TokenRow
      header={true}
      listNumber="#"
      tokenInfo={<Trans>Token name</Trans>}
      price={<HeaderCell category={TokenSortMethod.PRICE} />}
      percentChangeOneHour={<HeaderCell category={TokenSortMethod.ONE_HOUR} />}
      percentChangeOneDay={<HeaderCell category={TokenSortMethod.ONE_DAY} />}
      tvl={<HeaderCell category={TokenSortMethod.TOTAL_VALUE_LOCKED} />}
      volume={<HeaderCell category={TokenSortMethod.VOLUME} />}
      sparkLine={null}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow(props: { first?: boolean; last?: boolean }) {
  return (
    <TokenRow
      header={false}
      listNumber={<SmallLoadingBubble />}
      tokenInfo={
        <>
          <IconLoadingBubble />
          <MediumLoadingBubble />
        </>
      }
      price={<MediumLoadingBubble />}
      percentChangeOneHour={<LoadingBubble />}
      percentChangeOneDay={<LoadingBubble />}
      tvl={<LoadingBubble />}
      volume={<LoadingBubble />}
      sparkLine={<SparkLineLoadingBubble />}
      {...props}
    />
  )
}

interface LoadedRowProps {
  chainId?: number
  tokenListIndex: number
  tokenListLength: number
  token: NonNullable<TopTokenApi>
  sparklineMap: SparklineMap
  sortRank: number
}

const getTokenLink = (chainId: SupportedChainId, address: string) => {
  if (address.toLowerCase().includes('_haust')) {
    // Don't include address in URL for _haust tokens
    const chainName = CHAIN_IDS_TO_NAMES[chainId as keyof typeof CHAIN_IDS_TO_NAMES]
    return `${window.location.origin}/explore/token/${chainName}/NATIVE`
  }
  
  if (isGqlSupportedChain(chainId)) {
    const chainName = CHAIN_IDS_TO_NAMES[chainId as keyof typeof CHAIN_IDS_TO_NAMES]
    return `${window.location.origin}/explore/token/${chainName}/${address}`
  } else {
    return getExplorerLink(chainId, address, ExplorerDataType.TOKEN)
  }
}

/* Loaded State: row component with token information */
export const LoadedRow = forwardRef((props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { tokenListIndex, tokenListLength, token, sortRank } = props
  const filterString = useAtomValue(filterStringAtom)

  const filterNetwork = validateUrlChainParam(useParams<{ chainName?: string }>().chainName?.toUpperCase())
  
  const dayDelta = Number(token.marketData.pricePercentChange)
  const hourDelta = Number(token.marketData.hourlyPriceChange)

  const smallDayArrow = getDeltaArrow(dayDelta, 14)
  const formattedDayDelta = formatDelta(dayDelta)
  const formattedHourDelta = formatDelta(hourDelta)

  const nativeCurrency = useNativeCurrency()
  const tokenCurrency = useCurrency(token.address)
  const currency = token.symbol === 'HAUST' ? nativeCurrency : tokenCurrency


  return (
    <div ref={ref} data-testid={`token-table-row-${token.symbol}`}>
      <StyledLink
        to={getTokenLink(props.chainId as SupportedChainId, token.address)}
        onClick={noop}
      >
        <TokenRow
          header={false}
          listNumber={sortRank}
          tokenInfo={
            <ClickableName>
              <CurrencyLogo currency={currency} />
              <TokenInfoCell>
                <TokenName data-cy="token-name">{token.name}</TokenName>
                <TokenSymbol>{token.symbol}</TokenSymbol>
              </TokenInfoCell>
            </ClickableName>
          }
          price={
            <ClickableContent>
              <PriceInfoCell>
                {formatUSDPrice(Number(token.priceUsd))}
                <PercentChangeInfoCell>
                  <ArrowCell>{smallDayArrow}</ArrowCell>
                  <DeltaText delta={dayDelta}>{formattedDayDelta}</DeltaText>
                </PercentChangeInfoCell>
              </PriceInfoCell>
            </ClickableContent>
          }
          percentChangeOneHour={
            <ClickableContent>
              <DeltaArrow delta={hourDelta} size={16} />
              <DeltaText delta={hourDelta}>{formattedHourDelta}</DeltaText>
            </ClickableContent>
          }
          percentChangeOneDay={
            <ClickableContent>
              <DeltaArrow delta={dayDelta} size={16} />
              <DeltaText delta={dayDelta}>{formattedDayDelta}</DeltaText>
            </ClickableContent>
          }
          tvl={
            <ClickableContent>
              {formatUSDPrice((Number(token.totalSupply) * Number(token.priceUsd)), NumberType.FiatTokenStats)}
            </ClickableContent>
          }
          volume={
            <ClickableContent>
              {formatUSDPrice(Number(token.marketData.volume), NumberType.FiatTokenStats)}
            </ClickableContent>
          }
          sparkLine={
            <SparkLine>
              <ParentSize>
                {({ width, height }) =>
                  props.sparklineMap && (
                    <SparklineChart
                      width={width}
                      height={height}
                      tokenData={token}
                      pricePercentChange={Number(token.marketData.pricePercentChange)}
                      sparklineMap={props.sparklineMap}
                    />
                  )
                }
              </ParentSize>
            </SparkLine>
          }
          first={tokenListIndex === 0}
          last={tokenListIndex === tokenListLength - 1}
        />
      </StyledLink>
    </div>
  )
})

LoadedRow.displayName = 'LoadedRow'
