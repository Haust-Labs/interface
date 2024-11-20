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
  '0xB9FdFAD79cD511bf5aD103174B396818cfD88F46',
  18,
  'USDT',
  'Tether'
)

export const USDC_HAUST_TESTNET = new Token(
  SupportedChainId.HAUST_TESTNET,
  '0x94a8EFd7344Cd4eb8DDbCa213CB2BC4Ee9Fa5d91',
  18,
  'USDC',
  'USD Coin'
)

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  [SupportedChainId.HAUST]: new Token(
    SupportedChainId.HAUST,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'WBNB',
    'Wrapped BNB'
  ),
  [SupportedChainId.HAUST_TESTNET]: new Token(
    SupportedChainId.HAUST_TESTNET,
    '0x845e4145F7de2822d16FE233Ecd0181c61f1d65F',
    18,
    'WETH',
    'Wrapped ETH'
  ),
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
    super(chainId, 18, 'HAUST', 'Haust Token')
  }
}

class ExtendedEther extends Ether {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) return wrapped
    throw new Error(`Unsupported chain ID: ${this.chainId}`)
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
