import { t } from '@lingui/macro'
import { Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import RangeBadge from 'components/Badge/RangeBadge'
import Row from 'components/Row'
import { SupportedChainId } from 'constants/chains'
import { useToken } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import { useV3Positions } from 'hooks/useV3Positions'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme'
import { PositionDetails } from 'types/position'
import { unwrappedToken } from 'utils/unwrappedToken'
import { hasURL } from 'utils/urlChecks'

import { ExpandoRow } from '../ExpandoRow'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

export default function Pools({ account }: { account: string }) {
  const { positions, loading: positionsLoading } = useV3Positions(account)
  const [showClosed, toggleShowClosed] = useReducer((showClosed) => !showClosed, false)

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const toggleWalletDrawer = useToggleAccountDrawer()

  if (positionsLoading) {
    return <PortfolioSkeleton />
  }

  if (!positions) {
    return <EmptyWalletModule type="pool" onNavigateClick={toggleWalletDrawer} />
  }

  return (
    <PortfolioTabWrapper>
      {openPositions.map((positionInfo) => (
        <PositionListItem
          key={positionInfo.tokenId.toString()}
          positionInfo={positionInfo}
        />
      ))}
      <ExpandoRow
        title={t`Closed Positions`}
        isExpanded={showClosed}
        toggle={toggleShowClosed}
        numItems={closedPositions.length}
      >
        {closedPositions.map((positionInfo) => (
          <PositionListItem
            key={positionInfo.tokenId.toString()}
            positionInfo={positionInfo}
          />
        ))}
      </ExpandoRow>
    </PortfolioTabWrapper>
  )
}

function calculcateLiquidityValue(price0: number | undefined, price1: number | undefined, position: Position) {
  if (!price0 || !price1) return undefined

  const value0 = parseFloat(position.amount0.toExact()) * price0
  const value1 = parseFloat(position.amount1.toExact()) * price1
  return value0 + value1
}

function PositionListItem({ positionInfo }: { positionInfo: PositionDetails }) {
  const {   token0: token0Address,
    token1: token1Address,
    tokenId,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper, } = positionInfo
    const { chainId } = useWeb3React()

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const onClick = useCallback(async () => {
    toggleWalletDrawer()
    navigate('/pool/' + tokenId)
  }, [toggleWalletDrawer, navigate, tokenId])

  const shouldHidePosition = hasURL(token0?.symbol) || hasURL(token1?.symbol)

  if (shouldHidePosition) {
    return null
  }

  return (
    <PortfolioRow
      onClick={onClick}
      left={<PortfolioLogo chainId={chainId as SupportedChainId} currencies={[currency0, currency1]} />}
      title={
        <Row>
          <ThemedText.SubHeader fontWeight={500}>
            {token0?.symbol} / {token1?.symbol}
          </ThemedText.SubHeader>
        </Row>
      }
      descriptor={<ThemedText.Caption>{`${feeAmount / 10000}%`}</ThemedText.Caption>}
      right={<RangeBadge removed={liquidity?.eq(0)} inRange={!outOfRange} />}
    />
  )
}
