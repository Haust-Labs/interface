import {Chain, CHAIN_NAME_TO_CHAIN_ID} from "api/util";
import { nativeOnChain } from 'constants/tokens'

export function getNativeTokenDBAddress(chain: Chain): string | undefined {
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  if (pageChainId === undefined) {
    return undefined
  }
  switch (chain) {
    case Chain.HAUST:
    case Chain.HAUST_TESTNET:
      return nativeOnChain(pageChainId).wrapped.address
    default:
      return undefined
  }
}
