import { SupportedChainId } from 'constants/chains'
import useHttpLocations from 'hooks/useHttpLocations'
import { useMemo } from 'react'
import { isAddress } from 'utils'

import HaustLogo from '../../assets/images/haust.svg'
import { NATIVE_CHAIN_ID } from '../../constants/tokens'

type Network = 'haust_mainnet' | 'haust_testnet'

export function chainIdToNetworkName(networkId: SupportedChainId): Network {
  switch (networkId) {
    case SupportedChainId.HAUST:
      return 'haust_mainnet'
    case SupportedChainId.HAUST_TESTNET:
      return 'haust_testnet'
    default:
      return 'haust_mainnet'
  }
}

export function getNativeLogoURI(chainId: SupportedChainId = SupportedChainId.HAUST): string {
  switch (chainId) {
    case SupportedChainId.HAUST:
    case SupportedChainId.HAUST_TESTNET:
      return HaustLogo
    default:
      return HaustLogo
  }
}

function getTokenLogoURI(address: string, chainId: SupportedChainId = SupportedChainId.HAUST): string | void {
  const networkName = chainIdToNetworkName(chainId)
  const networksWithUrls: SupportedChainId[] = []
  if (networksWithUrls.includes(chainId)) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${address}/logo.png`
  }
}

export default function useCurrencyLogoURIs(
  currency:
    | {
        isNative?: boolean
        isToken?: boolean
        address?: string
        chainId: number
        logoURI?: string | null
      }
    | null
    | undefined
): string[] {
  const locations = useHttpLocations(currency?.logoURI)
  return useMemo(() => {
    const logoURIs = [...locations]
    if (currency) {
      if (currency.isNative || currency.address === NATIVE_CHAIN_ID) {
        logoURIs.push(getNativeLogoURI(currency.chainId))
      } else if (currency.isToken || currency.address) {
        const checksummedAddress = isAddress(currency.address)
        const logoURI = checksummedAddress && getTokenLogoURI(checksummedAddress, currency.chainId)
        if (logoURI) {
          logoURIs.push(logoURI)
        }
      }
    }
    return logoURIs
  }, [currency, locations])
}
