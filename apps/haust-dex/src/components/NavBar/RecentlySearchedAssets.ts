import { Chain, CHAIN_NAME_TO_CHAIN_ID } from "api/util";
import { SupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { NftCollection, useRecentlySearchedAssetsQuery } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { useAtom } from 'jotai'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { GenieCollection } from 'nft/types'
import { useCallback, useMemo } from 'react'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'
import {useSearchTokensApi} from "api/SearchTokens";

type RecentlySearchedAsset = {
  isNft?: boolean
  address: string
  chain: Chain
}

// Temporary measure used until backend supports addressing by "NATIVE"
const NATIVE_QUERY_ADDRESS_INPUT = null as unknown as string
function getQueryAddress(chain: Chain) {
  return getNativeTokenDBAddress(chain) ?? NATIVE_QUERY_ADDRESS_INPUT
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

export function useRecentlySearchedAssets() {
  const history = useAtomValue(recentlySearchedAssetsAtom)
  const shortenedHistory = useMemo(() => history.slice(0, 4), [history])
  const searchValue = shortenedHistory.map(u => u.address).join(',')
  const { data, loading } = useSearchTokensApi(searchValue);

  return { data, loading }
}
