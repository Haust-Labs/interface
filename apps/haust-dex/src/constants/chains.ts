import { NETWORK } from 'constants/network'

export enum SupportedChainId {
  // The live chain of this build: Haust devnet or mainnet, depending on REACT_APP_NETWORK.
  HAUST_TESTNET = NETWORK.chainId,
  // Placeholder, never connected to.
  HAUST = 0,
}

export const CHAIN_IDS_TO_NAMES = {
  [SupportedChainId.HAUST_TESTNET]: NETWORK.slug,
  [SupportedChainId.HAUST]: NETWORK.placeholderSlug,
}

/**
 * Array of all the supported chain IDs
 */
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(SupportedChainId).filter(
  (id) => typeof id === 'number'
) as SupportedChainId[]

export function isSupportedChain(chainId: number | null | undefined): chainId is SupportedChainId {
  return !!chainId && !!SupportedChainId[chainId]
}

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [SupportedChainId.HAUST] as const

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [SupportedChainId.HAUST, SupportedChainId.HAUST_TESTNET] as const

export type SupportedL1ChainId = (typeof L1_CHAIN_IDS)[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [] as const

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number]
