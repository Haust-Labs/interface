/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { NonfungiblePositionManager, Pool, Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
// import { sendEvent } from 'components/analytics'
import Badge from 'components/Badge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import Toggle from 'components/Toggle'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { formatPrice, NumberType } from 'conedison/format'
import { CHAIN_IDS_TO_NAMES, isSupportedChain } from 'constants/chains'
import {BigNumber as BN } from 'ethers';
import { isGqlSupportedChain } from 'graphql/data/util'
import { useToken } from 'hooks/Tokens'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { PoolState, usePool } from 'hooks/usePools'
import { useV3Incentive } from 'hooks/useV3Incentive'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { useSingleCallResult } from 'lib/hooks/multicall'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useCallback, useEffect,useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, HideExtraSmall, ThemedText } from 'theme'
import { currencyId } from 'utils/currencyId'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'

import RangeBadge from '../../components/Badge/RangeBadge'
import { SmallButtonPrimary } from '../../components/Button'
import { getPriceOrderingFromPositionForUI } from '../../components/PositionListItem'
import RateToggle from '../../components/RateToggle'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { usePositionTokenURI } from '../../hooks/usePositionTokenURI'
import { TransactionType } from '../../state/transactions/types'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { RewardInfo } from './RewardInfo'
import { LoadingRows } from './styleds'

const getTokenLink = (chainId: any, address: string) => {
  if (isGqlSupportedChain(chainId)) {
    const chainName = CHAIN_IDS_TO_NAMES[chainId]
    return `${window.location.origin}/#/explore/tokens/${chainName}/${address}`
  } else {
    return getExplorerLink(chainId, address, ExplorerDataType.TOKEN)
  }
}

const PositionPageButtonPrimary = styled(ButtonPrimary)`
  width: 228px;
  height: 40px;
  font-size: 16px;
  line-height: 20px;
  border-radius: 12px;
`

const PageWrapper = styled.div`
  padding: 68px 16px 16px 16px;

  min-width: 800px;
  max-width: 960px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    min-width: 100%;
    padding: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    min-width: 100%;
    padding: 16px;
  }
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <ThemedText.DeprecatedLabel {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
  font-weight: 500;
`

const HoverText = styled(ThemedText.DeprecatedMain)`
  text-decoration: none;
  color: ${({ theme }) => theme.textSecondary};
  :hover {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none;
  }
`

const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.textTertiary};
  margin: 0 1rem;
`
export const ResponsiveRow = styled(RowBetween)`
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%;
  }
`

const ActionButtonResponsiveRow = styled(ResponsiveRow)`
  width: 50%;
  justify-content: flex-end;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
    flex-direction: row;
    * {
      width: 100%;
    }
  }
`

const ResponsiveButtonConfirmed = styled(ButtonConfirmed)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  font-size: 16px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    width: fit-content;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: fit-content;
  }
`

const NFTGrid = styled.div<{ $minHeight?: number }>`
  display: grid;
  grid-template: 'overlap';
  min-height: ${({ $minHeight }) => ($minHeight ? `${$minHeight}px` : '400px')};
`

const NFTCanvas = styled.canvas`
  grid-area: overlap;
`

const NFTImage = styled.img`
  grid-area: overlap;
  height: 400px;
  /* Ensures SVG appears on top of canvas. */
  z-index: 1;
`

export const NFTContainer = styled.div`
  margin-right: 12px;
  width: 100%;
  
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    margin-right: 0;
  }
`

function CurrentPriceCard({
  inverted,
  pool,
  currencyQuote,
  currencyBase,
}: {
  inverted?: boolean
  pool?: Pool | null
  currencyQuote?: Currency
  currencyBase?: Currency
}) {
  if (!pool || !currencyQuote || !currencyBase) {
    return null
  }

  return (
    <LightCard padding="12px">
      <AutoColumn gap="sm" justify="center">
        <ExtentsText>
          <Trans>Current price</Trans>
        </ExtentsText>
        <ThemedText.DeprecatedMediumHeader textAlign="center">
          {formatPrice(inverted ? pool.token1Price : pool.token0Price, NumberType.TokenTx)}
        </ThemedText.DeprecatedMediumHeader>
        <ExtentsText>
          <Trans>
            {currencyQuote?.symbol} per {currencyBase?.symbol}
          </Trans>
        </ExtentsText>
      </AutoColumn>
    </LightCard>
  )
}

function LinkedCurrency({ chainId, currency }: { chainId?: number; currency?: Currency }) {
  const address = (currency as Token)?.address

  if (chainId && address) {
    return (
      <ExternalLink href={getTokenLink(chainId, address)}>
        <RowFixed>
          <CurrencyLogo currency={currency} size="20px" style={{ marginRight: '0.5rem' }} />
          <ThemedText.DeprecatedMain>{currency?.symbol} ↗</ThemedText.DeprecatedMain>
        </RowFixed>
      </ExternalLink>
    )
  }

  return (
    <RowFixed>
      <CurrencyLogo currency={currency} size="20px" style={{ marginRight: '0.5rem' }} />
      <ThemedText.DeprecatedMain>{currency?.symbol}</ThemedText.DeprecatedMain>
    </RowFixed>
  )
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>
) {
  try {
    if (!current.greaterThan(lower)) {
      return 100
    } else if (!current.lessThan(upper)) {
      return 0
    }

    const a = Number.parseFloat(lower.toSignificant(15))
    const b = Number.parseFloat(upper.toSignificant(15))
    const c = Number.parseFloat(current.toSignificant(15))

    const ratio = Math.floor((1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100)

    if (ratio < 0 || ratio > 100) {
      throw Error('Out of range')
    }

    return ratio
  } catch {
    return undefined
  }
}

// snapshots a src img into a canvas
function getSnapshot(src: HTMLImageElement, canvas: HTMLCanvasElement, targetHeight: number) {
  const context = canvas.getContext('2d')

  if (context) {
    let { width, height } = src

    // src may be hidden and not have the target dimensions
    const ratio = width / height
    height = targetHeight
    width = Math.round(ratio * targetHeight)

    // Ensure crispness at high DPIs
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    context.scale(devicePixelRatio, devicePixelRatio)

    context.clearRect(0, 0, width, height)
    context.drawImage(src, 0, 0, width, height)
  }
}

export function NFT({ 
  image, 
  height: targetHeight, 
  minHeight,
  disableHover = false
}: { 
  image: string; 
  height: number;
  minHeight?: number;
  disableHover?: boolean;
}) {
  const [animate, setAnimate] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imageLoaded && imageRef.current && canvasRef.current) {
      const timer = setTimeout(() => {
        getSnapshot(imageRef.current!, canvasRef.current!, targetHeight)
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [imageLoaded, targetHeight])

  return (
    <NFTGrid
      $minHeight={minHeight}
      onMouseEnter={() => {
        if (!disableHover) setAnimate(true)
      }}
      onMouseLeave={() => {
        if (!disableHover && imageRef.current && canvasRef.current) {
          getSnapshot(imageRef.current, canvasRef.current, targetHeight)
          setAnimate(false)
        }
      }}
    >
      <NFTCanvas ref={canvasRef} style={{ display: imageLoaded ? 'block' : 'none' }} />
      <NFTImage
        ref={imageRef}
        src={image}
        hidden={!animate && imageLoaded}
        style={{ display: !imageLoaded ? 'block' : animate ? 'block' : 'none' }}
        onLoad={() => {
          if (imageRef.current && canvasRef.current) {
            setImageLoaded(true)
          }
        }}
      />
    </NFTGrid>
  )
}

const useInverter = ({
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
  invert?: boolean
}): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} => {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

export function PositionPageUnsupportedContent() {
  return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <ThemedText.HeadlineLarge style={{ marginBottom: '8px' }}>
          <Trans>Position unavailable</Trans>
        </ThemedText.HeadlineLarge>
        <ThemedText.BodyPrimary style={{ marginBottom: '32px' }}>
          <Trans>To view a position, you must be connected to the network it belongs to.</Trans>
        </ThemedText.BodyPrimary>
        <PositionPageButtonPrimary as={Link} to="/pools" width="fit-content">
          <Trans>Back to Pools</Trans>
        </PositionPageButtonPrimary>
      </div>
    </PageWrapper>
  )
}

export default function PositionPage() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <PositionPageContent />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function PositionPageContent() {
  const { tokenId: tokenIdFromUrl } = useParams<{ tokenId?: string }>()
  const { chainId, account, provider } = useWeb3React()
  const theme = useTheme()
  const {incentiveEvents, loading: incentivesLoading} = useV3Incentive()
  
  const stakedInfo = incentiveEvents?.find(incentive => 
    incentive.tokenIds?.includes(Number(tokenIdFromUrl))
  )

  const parsedTokenId = tokenIdFromUrl ? BN.from(tokenIdFromUrl) : undefined
  const { loading, position: positionDetails } = useV3PositionFromTokenId(parsedTokenId)

  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
    tokenId,
  } = positionDetails || {}

  const removed = liquidity?.eq(0)

  const metadata = usePositionTokenURI(parsedTokenId)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)
  const nativeCurrency = useNativeCurrency()
  const nativeWrappedSymbol = nativeCurrency.wrapped.symbol

  // construct Position from details returned
  const [poolState, pool, poolAddress] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  
  const incentive = useMemo(() => {
    if (!incentiveEvents?.length || !poolAddress) return undefined;
    
    const now = Math.floor(Date.now() / 1000);
    return incentiveEvents.find(incentive => 
      incentive.pool.toLowerCase() === poolAddress.toLowerCase() && 
      Number(incentive.endTime) > now
    );
  }, [incentiveEvents, poolAddress]);

  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  const pricesFromPosition = getPriceOrderingFromPositionForUI(position)
  const [manuallyInverted, setManuallyInverted] = useState(false)

  // handle manual inversion
  const { priceLower, priceUpper, base } = useInverter({
    priceLower: pricesFromPosition.priceLower,
    priceUpper: pricesFromPosition.priceUpper,
    quote: pricesFromPosition.quote,
    base: pricesFromPosition.base,
    invert: manuallyInverted,
  })

  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

  const ratio = useMemo(() => {
    return priceLower && pool && priceUpper
      ? getRatio(
          inverted ? priceUpper.invert() : priceLower,
          pool.token0Price,
          inverted ? priceLower.invert() : priceUpper
        )
      : undefined
  }, [inverted, pool, priceLower, priceUpper])

  // fees
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, positionDetails?.tokenId, receiveWETH)

  // these currencies will match the feeValue{0,1} currencies for the purposes of fee collection
  const currency0ForFeeCollectionPurposes = pool ? (receiveWETH ? pool.token0 : unwrappedToken(pool.token0)) : undefined
  const currency1ForFeeCollectionPurposes = pool ? (receiveWETH ? pool.token1 : unwrappedToken(pool.token1)) : undefined

  const [collecting, setCollecting] = useState<boolean>(false)
  const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)
  const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)
  const [showConfirm, setShowConfirm] = useState(false)
  

  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const collect = useCallback(() => {
    if (
      !currency0ForFeeCollectionPurposes ||
      !currency1ForFeeCollectionPurposes ||
      !chainId ||
      !positionManager ||
      !account ||
      !tokenId ||
      !provider
    )
      return

    setCollecting(true)

    // we fall back to expecting 0 fees in case the fetch fails, which is safe in the
    // vast majority of cases
    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0 ?? CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0),
      expectedCurrencyOwed1: feeValue1 ?? CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0),
      recipient: account,
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    provider
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }

        return provider
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setCollectMigrationHash(response.hash)
            setCollecting(false)

            // sendEvent({
            //   category: 'Liquidity',
            //   action: 'CollectV3',
            //   label: [currency0ForFeeCollectionPurposes.symbol, currency1ForFeeCollectionPurposes.symbol].join('/'),
            // })

            addTransaction(response, {
              type: TransactionType.COLLECT_FEES,
              currencyId0: currencyId(currency0ForFeeCollectionPurposes),
              currencyId1: currencyId(currency1ForFeeCollectionPurposes),
              expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0).toExact(),
              expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0).toExact(),
            })
          })
      })
      .catch((error) => {
        setCollecting(false)
        console.error(error)
      })
  }, [
    chainId,
    feeValue0,
    feeValue1,
    currency0ForFeeCollectionPurposes,
    currency1ForFeeCollectionPurposes,
    positionManager,
    account,
    tokenId,
    addTransaction,
    provider,
  ])

  const owner = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]
  const ownsNFT = owner === account || positionDetails?.operator === account

  const feeValueUpper = inverted ? feeValue0 : feeValue1
  const feeValueLower = inverted ? feeValue1 : feeValue0

  // check if price is within range
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false

  const isPositionStaked = !!stakedInfo

  function modalHeader() {
    return (
      <AutoColumn gap="md" style={{ marginTop: '20px' }}>
        <LightCard padding="12px 16px">
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueUpper?.currency} size="20px" style={{ marginRight: '0.5rem' }} />
                <ThemedText.DeprecatedMain>
                  {feeValueUpper ? formatCurrencyAmount(feeValueUpper, 4) : '-'}
                </ThemedText.DeprecatedMain>
              </RowFixed>
              <ThemedText.DeprecatedMain>{feeValueUpper?.currency?.symbol}</ThemedText.DeprecatedMain>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueLower?.currency} size="20px" style={{ marginRight: '0.5rem' }} />
                <ThemedText.DeprecatedMain>
                  {feeValueLower ? formatCurrencyAmount(feeValueLower, 4) : '-'}
                </ThemedText.DeprecatedMain>
              </RowFixed>
              <ThemedText.DeprecatedMain>{feeValueLower?.currency?.symbol}</ThemedText.DeprecatedMain>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <ThemedText.DeprecatedItalic>
          <Trans>Collecting fees will withdraw currently available fees for you.</Trans>
        </ThemedText.DeprecatedItalic>
        <ButtonPrimary onClick={collect}>
          <Trans>Collect</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const showCollectAsWeth = Boolean(
    ownsNFT &&
      (feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0)) &&
      currency0 &&
      currency1 &&
      (currency0.isNative || currency1.isNative) &&
      !collectMigrationHash
  )

  if (!positionDetails && !loading) {
    return <PositionPageUnsupportedContent />
  }

  return loading || incentivesLoading || poolState === PoolState.LOADING || !feeAmount ? (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  ) : (
    <>
      <PageWrapper>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={() => setShowConfirm(false)}
          attemptingTxn={collecting}
          hash={collectMigrationHash ?? ''}
          content={() => (
            <ConfirmationModalContent
              title={<Trans>Claim fees</Trans>}
              onDismiss={() => setShowConfirm(false)}
              topContent={modalHeader}
            />
          )}
          pendingText={<Trans>Collecting fees</Trans>}
        />
        <AutoColumn gap="md">
          <AutoColumn gap="sm">
            <Link
              data-cy="visit-pool"
              style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }}
              to="/pools"
            >
              <HoverText>
                <Trans>← Back to Pools</Trans>
              </HoverText>
            </Link>
            <ResponsiveRow>
              <RowFixed>
                <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={24} margin={true} />
                <ThemedText.DeprecatedLabel fontSize="24px" mr="10px">
                  &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
                </ThemedText.DeprecatedLabel>
                <Badge style={{ marginRight: '8px' }}>
                  <BadgeText>
                    <Trans>{new Percent(feeAmount, 1_000_000).toSignificant()}%</Trans>
                  </BadgeText>
                </Badge>
                <RangeBadge removed={removed} inRange={inRange} staked={isPositionStaked} />
              </RowFixed>
                <ActionButtonResponsiveRow>
                  {currency0 && currency1 && feeAmount && tokenId ? (
                    isPositionStaked ? (
                      <SmallButtonPrimary
                        padding="6px 8px"
                        width="fit-content"
                        $borderRadius="12px"
                        style={{ marginRight: '8px', opacity: 0.5 }}
                        disabled
                      >
                        <Trans>Increase Liquidity</Trans>
                      </SmallButtonPrimary>
                    ) : (
                      <SmallButtonPrimary
                        as={Link}
                        to={`/increase/${currencyId(currency0)}/${currencyId(currency1)}/${feeAmount}/${tokenId}`}
                        padding="6px 8px"
                        width="fit-content"
                        $borderRadius="12px"
                        style={{ marginRight: '8px' }}
                      >
                        <Trans>Increase Liquidity</Trans>
                      </SmallButtonPrimary>
                    )
                  ) : null}
                  {tokenId && !removed ? (
                    isPositionStaked ? (
                      <SmallButtonPrimary
                        padding="6px 8px"
                        width="fit-content"
                        $borderRadius="12px"
                        style={{ opacity: 0.5 }}
                        disabled
                      >
                        <Trans>Remove Liquidity</Trans>
                      </SmallButtonPrimary>
                    ) : (
                      <SmallButtonPrimary
                        as={Link}
                        to={`/remove/${tokenId}`}
                        padding="6px 8px"
                        width="fit-content"
                        $borderRadius="12px"
                      >
                        <Trans>Remove Liquidity</Trans>
                      </SmallButtonPrimary>
                    )
                  ) : null}
                </ActionButtonResponsiveRow>
            </ResponsiveRow>
            <RowBetween></RowBetween>
          </AutoColumn>
          <ResponsiveRow align="flex-start">
            <NFTContainer>
              {'result' in metadata ? (
                <DarkCard
                  width="100%"
                  height="100%"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    height: isPositionStaked ? '510px' : '100%'
                  }}
                >
                  <NFT image={metadata.result.image} height={400} />
                </DarkCard>
              ) : (
                <DarkCard
                  width="100%"
                  height="100%"
                >
                  <Loader />
                </DarkCard>
              )}
            </NFTContainer>
            <AutoColumn gap="sm" style={{ width: '100%', height: '100%' }}>
              <DarkCard>
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <Label>
                      <Trans>Liquidity</Trans>
                    </Label>
                    {/* {fiatValueOfLiquidityApi?.gt('0') ? (
                      <ThemedText.DeprecatedLargeHeader fontSize="36px" fontWeight={500}>
                        <Trans>${fiatValueOfLiquidityApi?.toFormat(2)}</Trans>
                      </ThemedText.DeprecatedLargeHeader>
                    ) : (
                      <ThemedText.DeprecatedLargeHeader color={theme.textPrimary} fontSize="36px" fontWeight={500}>
                        <Trans>$-</Trans>
                      </ThemedText.DeprecatedLargeHeader>
                    )} */}
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <LinkedCurrency chainId={chainId} currency={currencyQuote} />
                        <RowFixed>
                          <ThemedText.DeprecatedMain>
                            {inverted ? position?.amount0.toSignificant(4) : position?.amount1.toSignificant(4)}
                          </ThemedText.DeprecatedMain>
                          {typeof ratio === 'number' && !removed ? (
                            <Badge style={{ marginLeft: '10px' }}>
                              <ThemedText.DeprecatedMain color={theme.textSecondary} fontSize={11}>
                                <Trans>{inverted ? ratio : 100 - ratio}%</Trans>
                              </ThemedText.DeprecatedMain>
                            </Badge>
                          ) : null}
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <LinkedCurrency chainId={chainId} currency={currencyBase} />
                        <RowFixed>
                          <ThemedText.DeprecatedMain>
                            {inverted ? position?.amount1.toSignificant(4) : position?.amount0.toSignificant(4)}
                          </ThemedText.DeprecatedMain>
                          {typeof ratio === 'number' && !removed ? (
                            <Badge style={{ marginLeft: '10px' }}>
                              <ThemedText.DeprecatedMain color={theme.textSecondary} fontSize={11}>
                                <Trans>{inverted ? 100 - ratio : ratio}%</Trans>
                              </ThemedText.DeprecatedMain>
                            </Badge>
                          ) : null}
                        </RowFixed>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                  {incentive && !removed && !isPositionStaked && (
                    <SmallButtonPrimary
                      as={Link}
                      to={`/stake/${tokenId}`}
                      padding="6px 8px"
                      width="fit-content"
                      $borderRadius="12px"
                    >
                      Stake Position
                    </SmallButtonPrimary>
                  )}
                  {incentive && !removed && isPositionStaked && (
                    <SmallButtonPrimary
                      as={Link}
                      to={`/unstake/${tokenId}`}
                      padding="6px 8px"
                      width="fit-content"
                      $borderRadius="12px"
                    >
                      Unstake position
                    </SmallButtonPrimary>
                  )}
                </AutoColumn>
              </DarkCard>
              {isPositionStaked && stakedInfo && tokenIdFromUrl && (
                <RewardInfo tokenId={tokenIdFromUrl} stakedInfo={stakedInfo} />
              )}
              <DarkCard>
                <AutoColumn gap="md" style={{ 
                  width: '100%',
                  opacity: isPositionStaked ? '0.3' : '1',
                  pointerEvents: isPositionStaked ? 'none' : 'auto'
                }}>
                  <AutoColumn gap="md">
                    <RowBetween style={{ alignItems: 'flex-start' }}>
                      <AutoColumn gap="md">
                        <Label>
                          <Trans>Unclaimed fees</Trans>
                        </Label>
                        {/* {fiatValueOfFeesApi?.gt('0') ? (
                          <ThemedText.DeprecatedLargeHeader
                            color={theme.accentSuccess}
                            fontSize="36px"
                            fontWeight={500}
                          >
                            <Trans>${fiatValueOfFeesApi?.toFormat(2)}</Trans>
                          </ThemedText.DeprecatedLargeHeader>
                        ) : (
                          <ThemedText.DeprecatedLargeHeader color={theme.textPrimary} fontSize="36px" fontWeight={500}>
                            <Trans>$-</Trans>
                          </ThemedText.DeprecatedLargeHeader>
                        )} */}
                      </AutoColumn>
                      {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || !!collectMigrationHash ? (
                        <ResponsiveButtonConfirmed
                          disabled={collecting || !!collectMigrationHash}
                          confirmed={!!collectMigrationHash && !isCollectPending}
                          width="fit-content"
                          style={{ borderRadius: '12px' }}
                          padding="4px 8px"
                          onClick={() => setShowConfirm(true)}
                        >
                              {!!collectMigrationHash && !isCollectPending ? (
                                <ThemedText.DeprecatedMain color={theme.textPrimary}>
                                  <Trans> Collected</Trans>
                                </ThemedText.DeprecatedMain>
                              ) : isCollectPending || collecting ? (
                                <ThemedText.DeprecatedMain color={theme.textPrimary}>
                                  {' '}
                                  <Dots>
                                    <Trans>Collecting</Trans>
                                  </Dots>
                                </ThemedText.DeprecatedMain>
                              ) : (
                                <>
                                  <ThemedText.DeprecatedMain color={theme.white}>
                                    <Trans>Collect fees</Trans>
                                  </ThemedText.DeprecatedMain>
                                </>
                              )}
                        </ResponsiveButtonConfirmed>
                      ) : null}
                    </RowBetween>
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <RowFixed>
                          <CurrencyLogo
                            currency={feeValueUpper?.currency}
                            size="20px"
                            style={{ marginRight: '0.5rem' }}
                          />
                          <ThemedText.DeprecatedMain>{feeValueUpper?.currency?.symbol}</ThemedText.DeprecatedMain>
                        </RowFixed>
                        <RowFixed>
                          <ThemedText.DeprecatedMain>
                            {feeValueUpper ? formatCurrencyAmount(feeValueUpper, 4) : '-'}
                          </ThemedText.DeprecatedMain>
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <CurrencyLogo
                            currency={feeValueLower?.currency}
                            size="20px"
                            style={{ marginRight: '0.5rem' }}
                          />
                          <ThemedText.DeprecatedMain>{feeValueLower?.currency?.symbol}</ThemedText.DeprecatedMain>
                        </RowFixed>
                        <RowFixed>
                          <ThemedText.DeprecatedMain>
                            {feeValueLower ? formatCurrencyAmount(feeValueLower, 4) : '-'}
                          </ThemedText.DeprecatedMain>
                        </RowFixed>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                  {showCollectAsWeth && (
                    <AutoColumn gap="md">
                      <RowBetween>
                        <ThemedText.DeprecatedMain>
                          <Trans>Collect as {nativeWrappedSymbol}</Trans>
                        </ThemedText.DeprecatedMain>
                        <Toggle
                          id="receive-as-weth"
                          isActive={receiveWETH}
                          toggle={() => setReceiveWETH((receiveWETH) => !receiveWETH)}
                        />
                      </RowBetween>
                    </AutoColumn>
                  )}
                </AutoColumn>
              </DarkCard>
            </AutoColumn>
          </ResponsiveRow>
          <DarkCard>
            <AutoColumn gap="md">
              <RowBetween>
                <RowFixed>
                  <Label display="flex" style={{ marginRight: '12px' }}>
                    <Trans>Price range</Trans>
                  </Label>
                  <HideExtraSmall>
                    <>
                      <RangeBadge removed={removed} inRange={inRange} />
                      <span style={{ width: '8px' }} />
                    </>
                  </HideExtraSmall>
                </RowFixed>
                <RowFixed>
                  {currencyBase && currencyQuote && (
                    <RateToggle
                      currencyA={currencyBase}
                      currencyB={currencyQuote}
                      handleRateToggle={() => setManuallyInverted(!manuallyInverted)}
                    />
                  )}
                </RowFixed>
              </RowBetween>

              <RowBetween>
                <LightCard padding="12px" width="100%">
                  <AutoColumn gap="sm" justify="center">
                    <ExtentsText>
                      <Trans>Min price</Trans>
                    </ExtentsText>
                    <ThemedText.DeprecatedMediumHeader textAlign="center">
                      {formatTickPrice({
                        price: priceLower,
                        atLimit: tickAtLimit,
                        direction: Bound.LOWER,
                        numberType: NumberType.TokenTx,
                      })}
                    </ThemedText.DeprecatedMediumHeader>
                    <ExtentsText>
                      {' '}
                      <Trans>
                        {currencyQuote?.symbol} per {currencyBase?.symbol}
                      </Trans>
                    </ExtentsText>

                    {inRange && (
                      <ThemedText.DeprecatedSmall color={theme.textTertiary}>
                        <Trans>Your position will be 100% {currencyBase?.symbol} at this price.</Trans>
                      </ThemedText.DeprecatedSmall>
                    )}
                  </AutoColumn>
                </LightCard>

                <DoubleArrow>⟷</DoubleArrow>
                <LightCard padding="12px" width="100%">
                  <AutoColumn gap="sm" justify="center">
                    <ExtentsText>
                      <Trans>Max price</Trans>
                    </ExtentsText>
                    <ThemedText.DeprecatedMediumHeader textAlign="center">
                      {formatTickPrice({
                        price: priceUpper,
                        atLimit: tickAtLimit,
                        direction: Bound.UPPER,
                        numberType: NumberType.TokenTx,
                      })}
                    </ThemedText.DeprecatedMediumHeader>
                    <ExtentsText>
                      {' '}
                      <Trans>
                        {currencyQuote?.symbol} per {currencyBase?.symbol}
                      </Trans>
                    </ExtentsText>

                    {inRange && (
                      <ThemedText.DeprecatedSmall color={theme.textTertiary}>
                        <Trans>Your position will be 100% {currencyQuote?.symbol} at this price.</Trans>
                      </ThemedText.DeprecatedSmall>
                    )}
                  </AutoColumn>
                </LightCard>
              </RowBetween>
              <CurrentPriceCard
                inverted={inverted}
                pool={pool}
                currencyQuote={currencyQuote}
                currencyBase={currencyBase}
              />
            </AutoColumn>
          </DarkCard>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
