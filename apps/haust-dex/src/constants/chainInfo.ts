import haustLogo from 'assets/svg/haust-logo.svg'
import { SupportedChainId } from 'constants/chains'
import ms from 'ms.macro'

import { SupportedL1ChainId, SupportedL2ChainId } from './chains'

export const AVERAGE_L1_BLOCK_TIME = ms`12s`

export enum NetworkType {
  L1,
  L2,
}
interface BaseChainInfo {
  readonly networkType: NetworkType
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly bridge?: string
  readonly explorer: string
  readonly infoLink: string
  readonly logoUrl: string
  readonly circleLogoUrl?: string
  readonly squareLogoUrl?: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly nativeCurrency: {
    name: string // e.g. 'Goerli ETH',
    symbol: string // e.g. 'gorETH',
    decimals: number // e.g. 18,
  }
}

interface L1ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L1
  readonly defaultListUrl?: string
}

export interface L2ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L2
  readonly bridge: string
  readonly statusPage?: string
  readonly defaultListUrl: string
}

type ChainInfoMap = { readonly [chainId: number]: L1ChainInfo | L2ChainInfo } & {
  readonly [chainId in SupportedL2ChainId]: L2ChainInfo
} & { readonly [chainId in SupportedL1ChainId]: L1ChainInfo }

const CHAIN_INFO: ChainInfoMap = {
  [SupportedChainId.HAUST_TESTNET]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: '',
    docs: 'https://haust.network/',
    explorer: 'https://haust-testnet-blockscout.eu-north-2.gateway.fm/',
    infoLink: '',
    label: 'HAUST Testnet',
    logoUrl: haustLogo,
    circleLogoUrl: haustLogo,
    squareLogoUrl: haustLogo,
    nativeCurrency: { name: 'HAUST', symbol: 'HAUST', decimals: 18 },
  },
  [SupportedChainId.HAUST]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://cbridge.celer.network/1/56',
    docs: 'https://docs.bnbchain.org/',
    explorer: 'https://bscscan.com/',
    infoLink: '',
    label: 'HAUST Mainnet',
    logoUrl: haustLogo,
    circleLogoUrl: haustLogo,
    squareLogoUrl: haustLogo,
    nativeCurrency: { name: 'HAUST', symbol: 'HST', decimals: 18 },
  },
}

export function getChainInfo(chainId: SupportedL1ChainId): L1ChainInfo
export function getChainInfo(chainId: SupportedL2ChainId): L2ChainInfo
export function getChainInfo(chainId: SupportedChainId): L1ChainInfo | L2ChainInfo
export function getChainInfo(
  chainId: SupportedChainId | SupportedL1ChainId | SupportedL2ChainId | number | undefined
): L1ChainInfo | L2ChainInfo | undefined

/**
 * Overloaded method for returning ChainInfo given a chainID
 * Return type varies depending on input type:
 * number | undefined -> returns chaininfo | undefined
 * SupportedChainId -> returns L1ChainInfo | L2ChainInfo
 * SupportedL1ChainId -> returns L1ChainInfo
 * SupportedL2ChainId -> returns L2ChainInfo
 */
export function getChainInfo(chainId: any): any {
  if (chainId) {
    return CHAIN_INFO[chainId] ?? undefined
  }
  return undefined
}

const MAINNET_INFO = CHAIN_INFO[SupportedChainId.HAUST]
export function getChainInfoOrDefault(chainId: number | undefined) {
  return getChainInfo(chainId) ?? MAINNET_INFO
}
