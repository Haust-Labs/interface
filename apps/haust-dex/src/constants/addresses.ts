import { SupportedChainId } from 'constants/chains'

type AddressMap = { [chainId: number]: string }

export const V2_FACTORY_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST]: '',
  [SupportedChainId.HAUST_TESTNET]: ''
}
export const V2_ROUTER_ADDRESS: AddressMap = {
  [SupportedChainId.HAUST]: '0xf8aa5032fB61793b3C322aA85e101A5568Df78c7',
  [SupportedChainId.HAUST_TESTNET]: '0xf8aa5032fB61793b3C322aA85e101A5568Df78c7',
}

export const PERMIT2_ADDRESS: AddressMap = {
  [SupportedChainId.HAUST]: '',
  [SupportedChainId.HAUST_TESTNET]: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
}

// HAUST Testnet addresses
const HAUST_TESTNET_V3_CORE_FACTORY_ADDRESSES = '0x88cf8F52E4c4E9C248Ee65b867827F010bC751d8'
const HAUST_TESTNET_V3_MIGRATOR_ADDRESSES = '0x1064578AA9ed014C4146ba34D8DB2e2E52CFfa34'
const HAUST_TESTNET_MULTICALL_ADDRESS = '0x2DBf14aBD3ACDEB655f75e982641174A4E4D36b8'
const HAUST_TESTNET_QUOTER_ADDRESSES = '0x19eA1a7438048BA3B14519Aa0a21749486EC52Ed'
const HAUST_TESTNET_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = '0xD1DE31Ab67E23b35Ba5b3D5012F0006fA7210d19'
const HAUST_TESTNET_TICK_LENS_ADDRESSES = '0xE978eB70d75e84ee06142D38F1CA1f880Db5197A'
const HAUST_TESTNET_POOL_DEPLOYER = '0xbBf50bcbd1439385637FAE13bF1Be84F04C7366b'
const HAUST_TESTNET_UNIVERSAL_ROUTER_ADDRESS = '0x00f30BFC18145BCdfce81A22Db25e4C6eAF68296'
const HAUST_TESTNET_V3_INIT_POOL_CODE_HASH = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'


// HAUST addresses
const BSC_V3_CORE_FACTORY_ADDRESSES = ''
const BSC_V3_MIGRATOR_ADDRESSES = ''
const BSC_MULTICALL_ADDRESS = ''
const BSC_QUOTER_ADDRESSES = ''
const BSC_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = ''
const BSC_TICK_LENS_ADDRESSES = ''
const BSC_POOL_DEPLOYER = ''
const BSC_UNIVERSAL_ROUTER_ADDRESS = ''

/* V3 Contract Addresses */
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_V3_CORE_FACTORY_ADDRESSES,
  [SupportedChainId.HAUST]: BSC_V3_CORE_FACTORY_ADDRESSES,
}

export const V3_MIGRATOR_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_V3_MIGRATOR_ADDRESSES,
  [SupportedChainId.HAUST]: BSC_V3_MIGRATOR_ADDRESSES,
}

export const MULTICALL_ADDRESS: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_MULTICALL_ADDRESS,
  [SupportedChainId.HAUST]: BSC_MULTICALL_ADDRESS,
}

export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {}

export const QUOTER_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_QUOTER_ADDRESSES,
  [SupportedChainId.HAUST]: BSC_QUOTER_ADDRESSES,
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  [SupportedChainId.HAUST]: BSC_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
}

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {}

export const TICK_LENS_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_TICK_LENS_ADDRESSES,
  [SupportedChainId.HAUST]: BSC_TICK_LENS_ADDRESSES,
}

export const POOL_DEPLOYER_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_POOL_DEPLOYER,
  [SupportedChainId.HAUST]: BSC_POOL_DEPLOYER,
}

export const UNIVERSAL_ROUTER_ADDRESS: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_UNIVERSAL_ROUTER_ADDRESS,
  [SupportedChainId.HAUST]: BSC_UNIVERSAL_ROUTER_ADDRESS,
}

export const V3_INIT_POOL_CODE_HASH: AddressMap = {
  [SupportedChainId.HAUST_TESTNET]: HAUST_TESTNET_V3_INIT_POOL_CODE_HASH
}
