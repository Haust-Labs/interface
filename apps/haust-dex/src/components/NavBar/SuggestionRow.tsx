import {Chain, getTokenDetailsURL} from "api/util";
import clsx from 'clsx'
import { formatUSDPrice } from 'conedison/format'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { vars } from 'nft/css/sprinkles.css'
import { GenieCollection } from 'nft/types'
import { ethNumberStandardFormatter } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { DeltaText } from '../Tokens/TokenDetails/PriceChart'
import { useAddRecentlySearchedAsset } from './RecentlySearchedAssets'
import * as styles from './SearchBar.css'
import CurrencyLogo from "components/Logo/CurrencyLogo";
import { useCurrency } from "hooks/Tokens";
import { DeltaArrow } from "components/Tokens/Delta";
import useNativeCurrency from "lib/hooks/useNativeCurrency";
import { TokenData } from "graphql/thegraph/TopTokensQuery";

const PriceChangeContainer = styled.div`
  display: flex;
  align-items: center;
`

interface CollectionRowProps {
  collection: GenieCollection
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
  eventProperties: Record<string, unknown>
}

export const CollectionRow = ({
  collection,
  isHovered,
  setHoveredIndex,
  toggleOpen,
  index,
  eventProperties,
}: CollectionRowProps) => {
  const [brokenImage, setBrokenImage] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const addRecentlySearchedAsset = useAddRecentlySearchedAsset()
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    addRecentlySearchedAsset({ ...collection, isNft: true, chain: Chain.HAUST })
    toggleOpen()
  }, [addRecentlySearchedAsset, collection, toggleOpen, eventProperties])

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isHovered) {
        event.preventDefault()
        navigate(`/nfts/collection/${collection.address}`)
        handleClick()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [toggleOpen, isHovered, collection, navigate, handleClick])

  return (
    <Link
      to={`/nfts/collection/${collection.address}`}
      onClick={handleClick}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      className={styles.suggestionRow}
      style={{ background: isHovered ? vars.color.lightGrayOverlay : 'none' }}
    >
      <Row style={{ width: '60%' }}>
        {!brokenImage && collection.imageUrl ? (
          <Box
            as="img"
            src={collection.imageUrl}
            alt={collection.name}
            className={clsx(loaded ? styles.suggestionImage : styles.imageHolder)}
            onError={() => setBrokenImage(true)}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <Box className={styles.imageHolder} />
        )}
        <Column className={styles.suggestionPrimaryContainer}>
          <Row gap="4" width="full">
            <Box className={styles.primaryText}>{collection.name}</Box>
            {collection.isVerified && <VerifiedIcon className={styles.suggestionIcon} />}
          </Row>
          <Box className={styles.secondaryText}>{putCommas(collection?.stats?.total_supply ?? 0)} items</Box>
        </Column>
      </Row>
      {collection.stats?.floor_price ? (
        <Column className={styles.suggestionSecondaryContainer}>
          <Row gap="4">
            <Box className={styles.primaryText}>{ethNumberStandardFormatter(collection.stats?.floor_price)} ETH</Box>
          </Row>
          <Box className={styles.secondaryText}>Floor</Box>
        </Column>
      ) : null}
    </Link>
  )
}

interface TokenRowProps {
  token: TokenData
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
  eventProperties: Record<string, unknown>
}

export const TokenRow = ({ token, isHovered, setHoveredIndex, toggleOpen, index, eventProperties }: TokenRowProps) => {
  const addRecentlySearchedAsset = useAddRecentlySearchedAsset()
  const navigate = useNavigate()
  const nativeCurrency = useNativeCurrency()
  const tokenCurrency = useCurrency(token.address)
  const currency = token.symbol === 'HAUST' ? nativeCurrency : tokenCurrency

  const handleClick = useCallback(() => {
    const address = token.address
    // @ts-ignore
    address && addRecentlySearchedAsset({ address, chain: token.chain })

    toggleOpen()
  }, [addRecentlySearchedAsset, token, toggleOpen, eventProperties])

  const tokenDetailsPath = token.address.toLowerCase().includes('_haust')
    ? `/explore/token/${token.chain}/NATIVE`
    : getTokenDetailsURL({address: token.address})

  // Close the modal on escape
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isHovered) {
        event.preventDefault()
        navigate(tokenDetailsPath)
        handleClick()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [toggleOpen, isHovered, token, navigate, handleClick, tokenDetailsPath])

  return (
    <Link
      data-cy={`searchbar-token-row-${token.symbol}`}
      to={tokenDetailsPath}
      onClick={handleClick}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      className={styles.suggestionRow}
      style={{ background: isHovered ? vars.color.lightGrayOverlay : 'none' }}
    >
      <Row gap="8" style={{ width: '65%' }}>
        <CurrencyLogo currency={currency} size="36px" />
        <Column gap="6">
          <ThemedText.BodyPrimary>{token.name}</ThemedText.BodyPrimary>
          <ThemedText.BodySecondary fontSize={13} fontWeight={485}>{token.symbol}</ThemedText.BodySecondary>
        </Column>
      </Row>

      <Column className={styles.suggestionSecondaryContainer}>
        {!!token.priceUsd && (
          <>
            <Row gap="6">
            <ThemedText.BodyPrimary>{formatUSDPrice(token.priceUsd)}</ThemedText.BodyPrimary>
            </Row>
            <PriceChangeContainer>
              <DeltaArrow delta={+token.marketData.pricePercentChange} />
              <ThemedText.BodySmall>
                <DeltaText delta={+token.marketData.pricePercentChange}>
                  {Math.abs(+token.marketData.pricePercentChange).toFixed(2)}%
                </DeltaText>
              </ThemedText.BodySmall>
            </PriceChangeContainer>
          </>
        )}
      </Column>
    </Link>
  )
}

export const SkeletonRow = () => {
  return (
    <Row className={styles.suggestionRow}>
      <Row width="full">
        <Box className={styles.imageHolder} />
        <Column gap="4" width="full">
          <Row justifyContent="space-between">
            <Box borderRadius="round" height="20" background="backgroundModule" style={{ width: '180px' }} />
            <Box borderRadius="round" height="20" width="48" background="backgroundModule" />
          </Row>

          <Row justifyContent="space-between">
            <Box borderRadius="round" height="16" width="120" background="backgroundModule" />
            <Box borderRadius="round" height="16" width="48" background="backgroundModule" />
          </Row>
        </Column>
      </Row>
    </Row>
  )
}
