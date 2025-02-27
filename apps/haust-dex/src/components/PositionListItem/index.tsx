import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { Currency, Percent, Price, Token } from '@uniswap/sdk-core'
import { Pool, Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import RangeBadge from 'components/Badge/RangeBadge'
import { LiquidityPositionRangeChart } from 'components/ChartsV2/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Icons/LoadingSpinner'
import { Flex } from 'components/layout/Flex'
import { RowBetween } from 'components/Row'
import { Text } from 'components/Text/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { formatNumber, formatUSDPrice } from 'conedison/format'
import { SupportedChainId } from 'constants/chains'
import {
  WRAPPED_NATIVE_CURRENCY,
} from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { PositionStatus } from 'pages/Pool/PositionHeader'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import styled, { useTheme } from 'styled-components/macro'
import { HideSmall, MEDIA_WIDTHS, SmallOnly, ThemedText } from 'theme'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'
import { hasURL } from 'utils/urlChecks'

const LinkRow = styled(Link)`
  align-items: center;
  display: flex;
  cursor: pointer;
  user-select: none;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.textPrimary};
  text-decoration: none;
  font-weight: 500;

  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.hoverDefault};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 8px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  width: 100%;
`

const DoubleArrow = styled.span`
  font-size: 12px;
  margin: 0 2px;
  color: ${({ theme }) => theme.textTertiary};
`

const RangeText = styled(ThemedText.Caption)`
  font-size: 12px !important;
  word-break: break-word;
  padding: 0.25rem 0.25rem;
  border-radius: 8px;
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
const ExtentsText = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.textSecondary};
  display: inline-block;
  line-height: 16px;
  margin-right: 4px !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  > * {
    margin-right: 8px;
  }
`

const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`

const PrimaryText = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.textPrimary};
`

const SecondaryText = styled(Text)`
  font-size: 14px;
  color: ${({ theme }) => theme.textSecondary};
`

const FeeStat = styled(Flex)`
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const ChartAndRangeContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  width: 100%;
  gap: 24px;
`

const InfoContainer = styled.div`
  flex: 1;
  min-width: 200px;
`

const ChartContainer = styled.div`
  flex: 2;
  max-width: 220px;
`

const PriceRangeContainer = styled(Flex)`
  min-width: 224px;
  align-self: flex-start;
  width: fit-content;
`

const PriceContainer = styled(Flex)`
  flex-direction: row;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
`

const Wrapper = styled.div`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.borderSecondary};
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.01), 0 4px 8px rgba(0, 0, 0, 0.04), 0 16px 24px rgba(0, 0, 0, 0.04),
    0 24px 32px rgba(0, 0, 0, 0.01);
`

interface PositionListItemProps {
  token0: string
  token1: string
  tokenId: BigNumber
  fee: number
  liquidity: BigNumber
  tickLower: number
  tickUpper: number
  formattedUsdValue?: string
  formattedUsdFees?: string
  apr?: number
  filterStatus?: PositionStatus[]
}

export function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY)]
  if (bases.some((base) => base && base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

export default function PositionListItem({
  token0: token0Address,
  token1: token1Address,
  tokenId,
  fee: feeAmount,
  liquidity,
  tickLower,
  tickUpper,
  formattedUsdValue,
  formattedUsdFees,
  apr,
  filterStatus
}: PositionListItemProps) {
  const { chainId } = useWeb3React()
  const theme = useTheme()
  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined
  // construct Position from details returned
  const [, pool, poolAddress] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  // prices
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)

  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, tokenId)
  // Calculate fees value in USD
  const feesTotalUSD = useMemo(() => {
    if (!feeValue0 || !feeValue1 || !pool?.token0Price || !pool?.token1Price) return undefined

    const fee0USD = parseFloat(feeValue0.toSignificant(6)) * parseFloat(pool?.token0Price.toSignificant(6))
    const fee1USD = parseFloat(feeValue1.toSignificant(6)) * parseFloat(pool?.token1Price.toSignificant(6))

    return fee0USD + fee1USD
  }, [feeValue0, feeValue1, pool?.token0Price, pool?.token1Price])

  const formattedFeesUSD = useMemo(() => {
    if (!feesTotalUSD) return undefined
    return formatUSDPrice(feesTotalUSD)
  }, [feesTotalUSD])

  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)

  // check if price is within range
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false

  const positionSummaryLink = '/pools/' + tokenId

  const removed = liquidity?.eq(0)

  const shouldHidePosition = hasURL(token0?.symbol) || hasURL(token1?.symbol)

  // Add new state for price inversion
  const [pricesInverted, setPricesInverted] = useState(false)


  const positionTotalUSD = useMemo(() => {
    if (!position || !pool?.token0Price || !pool?.token1Price) return undefined

    const amount0 = parseFloat(position.amount0.toSignificant(6))
    const amount1 = parseFloat(position.amount1.toSignificant(6))

    const token0ValueUSD = amount0 * parseFloat(pool?.token0Price.toSignificant(6))
    const token1ValueUSD = amount1 * parseFloat(pool?.token1Price.toSignificant(6))
    
    return token0ValueUSD + token1ValueUSD
  }, [position, pool?.token0Price, pool?.token1Price])

  const formattedPositionUSD = useMemo(() => {
    if (!positionTotalUSD) return undefined
    return formatUSDPrice(positionTotalUSD)
  }, [positionTotalUSD])

  // Calculate APR using fees and position value
  const aprData = useMemo(() => {
    if (!feesTotalUSD || !positionTotalUSD || positionTotalUSD === 0) return undefined

    // Calculate daily average fees by dividing total fees by number of days position has been active
    // For this example, we'll use the current fees as daily fees
    const dailyFees = feesTotalUSD

    // APR = (Daily Fees / TVL) × 365 × 100%
    const calculatedApr = (dailyFees / positionTotalUSD) * 365 * 100

    // Cap the APR at 1000000% to avoid displaying unrealistic values
    return Math.min(calculatedApr, 1000000)
  }, [feesTotalUSD, positionTotalUSD])

  // Format APR for display
  const formattedApr = useMemo(() => {
    if (!aprData) return '-'
    return (aprData.toFixed(2)) + '%'
  }, [aprData])

  if (shouldHidePosition) {
    return null
  }

  if (filterStatus?.length) {
      if (removed && !filterStatus.includes(PositionStatus.CLOSED)) {
        return null
      }

      if (!removed) {
        const matchesInRange = filterStatus.includes(PositionStatus.IN_RANGE) && !outOfRange
        const matchesOutOfRange = filterStatus.includes(PositionStatus.OUT_OF_RANGE) && outOfRange

        if (!matchesInRange && !matchesOutOfRange) {
          return null
        }
      }
  }

  return (
    <Wrapper>
      <LinkRow to={positionSummaryLink}>
        <StatsContainer>
          <ChartAndRangeContainer>
            <InfoContainer>
              <RowBetween>
                <PrimaryPositionIdData>
                  <PortfolioLogo chainId={chainId as SupportedChainId} currencies={[currencyQuote, currencyBase]} size="44px" />
                  <VerticalContainer>
                    <ThemedText.SubHeader>
                      {currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
                    </ThemedText.SubHeader>
                    <RangeBadge removed={removed} inRange={!outOfRange} />
                  </VerticalContainer>
                  <FeeTierText>
                    <Trans>{new Percent(feeAmount, 1_000_000).toSignificant()}%</Trans>
                  </FeeTierText>
                </PrimaryPositionIdData>
              </RowBetween>
            </InfoContainer>

            <ChartContainer>
              <LiquidityPositionRangeChart
                chainId={chainId as SupportedChainId}
                currency0={
                  pricesInverted ? currencyQuote as Currency : currencyBase as Currency
                }
                currency1={
                  pricesInverted ? currencyQuote as Currency : currencyBase as Currency
                }
                width={220}
                positionStatus={removed ? PositionStatus.CLOSED : outOfRange ? PositionStatus.OUT_OF_RANGE : PositionStatus.IN_RANGE}
                poolAddressOrId={poolAddress ?? ''}
                priceOrdering={{
                  base: pricesInverted ? currencyQuote as Currency : currencyBase as Currency,
                  priceLower,
                  priceUpper,
                }}
                
              />
            </ChartContainer>
          </ChartAndRangeContainer>

          <Flex
            row
            style={{
              backgroundColor: theme.accentTextLightSecondary,
              padding: '16px 24px',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              gap: '20px'
            }}
          >
            <Flex 
              row 
              style={{
                justifyContent: 'space-between',
                width: '90%',
                marginRight: '40px',
                gap: '20px'
              }}
            >
              <FeeStat>
                {formattedPositionUSD ? (
                  <PrimaryText color={theme.textPrimary}>{formattedPositionUSD}</PrimaryText>
                ) : (
                  <MouseoverTooltip text={<Trans>Position value unavailable</Trans>} placement="top">
                    <PrimaryText color={theme.textPrimary}>-</PrimaryText>
                  </MouseoverTooltip>
                )}
                <SecondaryText color={theme.textSecondary}>Position</SecondaryText>
              </FeeStat>
              <FeeStat>
                <PrimaryText color={theme.textPrimary}>{formattedFeesUSD ?? '-'}</PrimaryText>
                <SecondaryText color={theme.textSecondary}>Fees</SecondaryText>
              </FeeStat>
              <FeeStat>
                <PrimaryText color={theme.textPrimary}>{formattedApr}</PrimaryText>
                <SecondaryText color={theme.textSecondary}>APR</SecondaryText>
              </FeeStat>
            </Flex>
            
            <PriceRangeContainer>
              {priceLower && priceUpper && !outOfRange && !tickAtLimit.LOWER && !tickAtLimit.UPPER ? (
                <Flex gap="4px">
                  <PriceContainer>
                    <SecondaryText color={theme.textSecondary}>
                      <Trans>Min</Trans>
                    </SecondaryText>
                    <SecondaryText color={theme.textPrimary}>
                      {formatTickPrice({
                        price: priceLower,
                        atLimit: tickAtLimit,
                        direction: Bound.LOWER,
                      })}{' '}
                      {currencyQuote?.symbol} / {currencyBase?.symbol}
                    </SecondaryText>
                  </PriceContainer>
                  <PriceContainer>
                    <SecondaryText color={theme.textSecondary}>
                      <Trans>Max</Trans>
                    </SecondaryText>
                    <SecondaryText color={theme.textPrimary}>
                      {formatTickPrice({
                        price: priceUpper,
                        atLimit: tickAtLimit,
                        direction: Bound.UPPER,
                      })}{' '}
                      {currencyQuote?.symbol} / {currencyBase?.symbol}
                    </SecondaryText>
                  </PriceContainer>
                </Flex>
              ) : (
                <SecondaryText style={{ color: theme.textSecondary }}>
                  <Trans>Full Range</Trans>
                </SecondaryText>
              )}
            </PriceRangeContainer>
          </Flex>
        </StatsContainer>
      </LinkRow>
    </Wrapper>
  )
}
