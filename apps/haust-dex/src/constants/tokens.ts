import {Currency, Ether, NativeCurrency, Token} from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import invariant from "tiny-invariant";

export const NATIVE_CHAIN_ID = 'NATIVE'

// When decimals are not specified for an ERC20 token
// use default ERC20 token decimals as specified here:
// https://docs.openzeppelin.com/contracts/3.x/erc20
export const DEFAULT_ERC20_DECIMALS = 18
//TODO
export const USDT_HAUST_TESTNET = new Token(
  SupportedChainId.HAUST_TESTNET,
  '0x1e4a5963abfd975d8c9021ce480b42188849d41d',
  6,
  'USDT',
  'Tether'
)

export const MYR_HAUST_TESTNET = new Token(
  SupportedChainId.HAUST_TESTNET,
  '0x07607F6cccd147660cC2D78EA2c6fc8b9d918601',
  18,
  'MYR',
  'Malaysian ringgit'
)

export const USDC_HAUST_TESTNET = new Token(
  SupportedChainId.HAUST_TESTNET,
  '0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035',
  6,
  'USDC',
  'USD Coin'
)

export const WETH_HAUST_TESTNET = new Token(
  SupportedChainId.HAUST_TESTNET,
  '0x5a77f1443d16ee5761d310e38b62f77f726bc71c',
  18,
  'WETH',
  'Wrapped ETH'
)

export const WBTC_HAUST_TESTNET = new Token(
  SupportedChainId.HAUST_TESTNET,
  '0xea034fb02eb1808c2cc3adbc15f447b93cbe08e1',
  8,
  'WBTC',
  'Wrapped BTC'
)


export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  [SupportedChainId.HAUST]: new Token(
    SupportedChainId.HAUST,
    '0x6c25c1cb4b8677982791328471be1bfb187687c1',
    18,
    'WBNB',
    'Wrapped BNB'
  ),
  [SupportedChainId.HAUST_TESTNET]: new Token(
    SupportedChainId.HAUST_TESTNET,
    '0x6c25c1cb4b8677982791328471be1bfb187687c1',
    18,
    'WHAUST',
    'Wrapped Haust'
  ),
}

export const TOKEN_ADDRESSES = {
  'WETH': WETH_HAUST_TESTNET,
  'USDT': USDT_HAUST_TESTNET,
  'USDC': USDC_HAUST_TESTNET,
  'WBTC': WBTC_HAUST_TESTNET,
  'WHAUST': WRAPPED_NATIVE_CURRENCY[SupportedChainId.HAUST_TESTNET],
  'MYR': MYR_HAUST_TESTNET
}

function isHaust(chainId: number): chainId is SupportedChainId.HAUST {
  return chainId === SupportedChainId.HAUST
}

class HaustNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isHaust(this.chainId)) throw new Error('Not haust')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isHaust(chainId)) throw new Error('Not haust')
    super(chainId, 18, 'HST', 'HAUST')
  }
}

function isHaustTestnet(chainId: number): chainId is SupportedChainId.HAUST_TESTNET {
  return chainId === SupportedChainId.HAUST_TESTNET
}

class HaustTestnetNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isHaustTestnet(this.chainId)) throw new Error('Not haust testnet')
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isHaustTestnet(chainId)) throw new Error('Not haust testnet')
    super(chainId, 18, 'HAUST', 'Haust')
  }
}

class ExtendedEther extends Ether {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) return wrapped
    return new Token(this.chainId, '0x6c25c1cb4b8677982791328471be1bfb187687c1', 18, 'WHAUST', 'Wrapped Haust')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  let nativeCurrency: NativeCurrency | Token
  if (isHaust(chainId)) {
    nativeCurrency = new HaustNativeCurrency(chainId)
  } else if (isHaustTestnet(chainId)) {
    nativeCurrency = new HaustTestnetNativeCurrency(chainId)
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId)
  }
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}

export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in SupportedChainId]?: string } } = {
  USDC: {
    [SupportedChainId.HAUST_TESTNET]: USDC_HAUST_TESTNET.address,
  },
  USDT: {
    [SupportedChainId.HAUST_TESTNET]: USDT_HAUST_TESTNET.address,
  }
}
