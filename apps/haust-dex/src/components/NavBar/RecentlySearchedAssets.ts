import { Chain } from "api/util";
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback } from 'react'

type RecentlySearchedAsset = {
  isNft?: boolean
  address: string
  chain: Chain
}

const recentlySearchedAssetsAtom = atomWithStorage<RecentlySearchedAsset[]>('recentlySearchedAssets', [])

export function useAddRecentlySearchedAsset() {
  const [searchHistory, updateSearchHistory] = useAtom(recentlySearchedAssetsAtom)

  return useCallback(
    (asset: RecentlySearchedAsset) => {
      // Removes the new asset if it was already in the array
      const newHistory = searchHistory.filter(
        (oldAsset) => !(oldAsset.address === asset.address && oldAsset.chain === asset.chain)
      )
      newHistory.unshift(asset)
      updateSearchHistory(newHistory)
    },
    [searchHistory, updateSearchHistory]
  )
}

