import { TokenInfo } from '@uniswap/token-lists'

import store from '../state'
import { DEFAULT_ACTIVE_LIST_URLS, UNSUPPORTED_LIST_URLS} from './lists'
import brokenTokenList from './tokenLists/broken.tokenlist.json'
import { NATIVE_CHAIN_ID } from './tokens'

export enum TOKEN_LIST_TYPES {
  HAUST_DEX_TOKENLIST = 1,
  UNI_EXTENDED,
  UNKNOWN,
  BLOCKED,
  BROKEN,
}

class TokenSafetyLookupTable {
  dict: { [key: string]: TOKEN_LIST_TYPES } | null = null

  createMap() {
    const dict: { [key: string]: TOKEN_LIST_TYPES } = {}

    // TODO: Figure out if this list is still relevant
    brokenTokenList.tokens.forEach((token) => {
      dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BROKEN
    })

    DEFAULT_ACTIVE_LIST_URLS.map((url) => store.getState().lists.byUrl[url].current?.tokens)
      .filter((x): x is TokenInfo[] => !!x)
      .flat(1)
      .forEach((token) => {
        dict[token?.address.toLowerCase()] = TOKEN_LIST_TYPES.HAUST_DEX_TOKENLIST
      })
    // Initialize blocked tokens from all urls included
    UNSUPPORTED_LIST_URLS.map((url) => store.getState().lists.byUrl[url].current?.tokens)
      .filter((x): x is TokenInfo[] => !!x)
      .flat(1)
      .forEach((token) => {
        dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
      })
    return dict
  }

  checkToken(address: string) {
    if (!this.dict) {
      this.dict = this.createMap()
    }
    if (address === NATIVE_CHAIN_ID.toLowerCase()) {
      return TOKEN_LIST_TYPES.HAUST_DEX_TOKENLIST
    }
    return this.dict[address] ?? TOKEN_LIST_TYPES.UNKNOWN
  }
}

export default new TokenSafetyLookupTable()
