import {SupportedChainId} from "constants/chains";
import {NATIVE_CHAIN_ID} from "constants/tokens";
import {CHAIN_ID_TO_BACKEND_NAME} from "graphql/data/util";

export enum Chain {
  HAUST = 'HAUST',
  HAUST_TESTNET = 'HAUST_TESTNET',
  UnknownChain = 'UNKNOWN_CHAIN'
}

export const CHAIN_NAME_TO_CHAIN_ID: { [key in Chain]: SupportedChainId } = {
  [Chain.HAUST]: SupportedChainId.HAUST,
  [Chain.HAUST_TESTNET]: SupportedChainId.HAUST_TESTNET,
  [Chain.UnknownChain]: SupportedChainId.HAUST,
}

const URL_CHAIN_PARAM_TO_BACKEND: { [key: string]: Chain } = {
  haust_mainnet: Chain.HAUST,
  haust_testnet: Chain.HAUST_TESTNET,
}

export function chainIdToBackendName(chainId: number | undefined) {
  return chainId && CHAIN_ID_TO_BACKEND_NAME[chainId]
    ? CHAIN_ID_TO_BACKEND_NAME[chainId]
    : CHAIN_ID_TO_BACKEND_NAME[SupportedChainId.HAUST]
}

export function validateUrlChainParam(chainName: string | undefined) {
  return chainName && URL_CHAIN_PARAM_TO_BACKEND[chainName] ? URL_CHAIN_PARAM_TO_BACKEND[chainName] : Chain.HAUST
}

export function getTokenDetailsURL({
   address,
   chain,
   inputAddress,
 }: {
  address?: string | null
  chain: Chain
  inputAddress?: string | null
}) {
  const chainName = chain.toLowerCase()
  const tokenAddress = address ?? NATIVE_CHAIN_ID
  const inputAddressSuffix = inputAddress ? `?inputCurrency=${inputAddress}` : ''
  return `/tokens/${chainName}/${tokenAddress}${inputAddressSuffix}`
}
