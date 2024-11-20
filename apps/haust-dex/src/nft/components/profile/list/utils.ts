import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import ms from 'ms.macro'
import { SetPriceMethod, WarningType } from 'nft/components/profile/list/shared'
import { Listing, ListingMarket, WalletAsset } from 'nft/types'
import { LOOKS_RARE_CREATOR_BASIS_POINTS } from 'nft/utils/listNfts'
import { Dispatch, useEffect } from 'react'

export const getTotalEthValue = (sellAssets: WalletAsset[]) => {
  const total = sellAssets.reduce((total, asset: WalletAsset) => {
    if (asset.newListings?.length) {
      const maxListing = asset.newListings.reduce((a, b) => ((a.price ?? 0) > (b.price ?? 0) ? a : b))
      // LooksRare is a unique case where creator royalties are a flat 0.5% or 50 basis points
      const maxFee =
        maxListing.marketplace.fee +
        (maxListing.marketplace.name === 'LooksRare' ? LOOKS_RARE_CREATOR_BASIS_POINTS : asset?.basisPoints ?? 0) / 100
      return total + (maxListing.price ?? 0) - (maxListing.price ?? 0) * (maxFee / 100)
    }
    return total
  }, 0)
  return total ? Math.round(total * 10000 + Number.EPSILON) / 10000 : 0
}

export function useHandleGlobalPriceToggle(
  globalOverride: boolean,
  setListPrice: Dispatch<number | undefined>,
  setPrice: (price?: number) => void,
  listPrice?: number,
  globalPrice?: number
) {
  useEffect(() => {
    let price: number | undefined
    if (globalOverride) {
      if (!listPrice) setListPrice(globalPrice)
      price = globalPrice
    } else {
      price = listPrice
    }
    setPrice(price)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalOverride])
}

export function useSyncPriceWithGlobalMethod(
  asset: WalletAsset,
  setListPrice: Dispatch<number | undefined>,
  setGlobalPrice: Dispatch<number | undefined>,
  setGlobalOverride: Dispatch<boolean>,
  listPrice?: number,
  globalPrice?: number,
  globalPriceMethod?: SetPriceMethod
) {
  useEffect(() => {
    if (globalPriceMethod === SetPriceMethod.FLOOR_PRICE) {
      setListPrice(asset?.floorPrice)
      setGlobalPrice(asset.floorPrice)
    } else if (globalPriceMethod === SetPriceMethod.LAST_PRICE) {
      setListPrice(asset.lastPrice)
      setGlobalPrice(asset.lastPrice)
    } else if (globalPriceMethod === SetPriceMethod.SAME_PRICE)
      listPrice && !globalPrice ? setGlobalPrice(listPrice) : setListPrice(globalPrice)

    setGlobalOverride(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalPriceMethod])
}

export function useUpdateInputAndWarnings(
  setWarningType: Dispatch<WarningType>,
  inputRef: React.MutableRefObject<HTMLInputElement>,
  asset: WalletAsset,
  listPrice?: number
) {
  useEffect(() => {
    setWarningType(WarningType.NONE)
    const price = listPrice ?? 0
    inputRef.current.value = `${price}`
    if (price < (asset?.floorPrice ?? 0) && price > 0) setWarningType(WarningType.BELOW_FLOOR)
    else if (
      asset.floor_sell_order_price &&
      price >= asset.floor_sell_order_price &&
      asset.asset_contract.tokenType !== NftStandard.Erc1155
    )
      setWarningType(WarningType.ALREADY_LISTED)
  }, [
    asset.asset_contract.tokenType,
    asset?.floorPrice,
    asset.floor_sell_order_price,
    inputRef,
    listPrice,
    setWarningType,
  ])
}

export const getRoyalty = (listingMarket: ListingMarket, asset: WalletAsset) => {
  // LooksRare is a unique case where royalties for creators are a flat 0.5% or 50 basis points if royalty is set
  const baseFee =
    listingMarket.name === 'LooksRare'
      ? asset.basisPoints
        ? LOOKS_RARE_CREATOR_BASIS_POINTS
        : 0
      : asset.basisPoints ?? 0

  return baseFee * 0.01
}

// OpenSea has a 0.5% fee for all assets that do not have a royalty set
export const getMarketplaceFee = (listingMarket: ListingMarket, asset: WalletAsset) => {
  return listingMarket.name === 'OpenSea' && !asset.basisPoints ? 0.5 : listingMarket.fee
}

const BELOW_FLOOR_PRICE_THRESHOLD = 0.8

export const findListingIssues = (sellAssets: WalletAsset[]) => {
  const missingExpiration = sellAssets.some((asset) => {
    return (
      asset.expirationTime != null &&
      (isNaN(asset.expirationTime) || asset.expirationTime * 1000 - Date.now() < ms`60 seconds`)
    )
  })
  const overMaxExpiration = sellAssets.some((asset) => {
    return asset.expirationTime != null && asset.expirationTime * 1000 - Date.now() > ms`180 days`
  })

  const listingsMissingPrice: [WalletAsset, Listing][] = []
  const listingsBelowFloor: [WalletAsset, Listing][] = []
  const listingsAboveSellOrderFloor: [WalletAsset, Listing][] = []
  for (const asset of sellAssets) {
    if (asset.newListings) {
      for (const listing of asset.newListings) {
        if (!listing.price) listingsMissingPrice.push([asset, listing])
        else if (listing.price < (asset?.floorPrice ?? 0) * BELOW_FLOOR_PRICE_THRESHOLD && !listing.overrideFloorPrice)
          listingsBelowFloor.push([asset, listing])
        else if (
          asset.floor_sell_order_price &&
          listing.price >= asset.floor_sell_order_price &&
          asset.asset_contract.tokenType !== NftStandard.Erc1155
        )
          listingsAboveSellOrderFloor.push([asset, listing])
      }
    }
  }
  return {
    missingExpiration,
    overMaxExpiration,
    listingsMissingPrice,
    listingsBelowFloor,
    listingsAboveSellOrderFloor,
  }
}
