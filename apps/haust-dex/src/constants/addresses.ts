import { SupportedChainId } from 'constants/chains'

type AddressMap = { [chainId: number]: string }

export const V2_FACTORY_ADDRESSES: AddressMap = {
  [SupportedChainId.HAUST]: '',
  [SupportedChainId.HAUST_TESTNET]: ''
}
export const V2_ROUTER_ADDRESS: AddressMap = {
  [SupportedChainId.HAUST]: '0x291021b87A248f03154Fbb4d928c9c693a8853A7',
  [SupportedChainId.HAUST_TESTNET]: '0x291021b87A248f03154Fbb4d928c9c693a8853A7',
}

export const PERMIT2_ADDRESS: AddressMap = {
  [SupportedChainId.HAUST]: '',
  [SupportedChainId.HAUST_TESTNET]: '0xD79572AdC8062E6833835CBD192c2eEf1DB592df',
}

// HAUST Testnet addresses
const HAUST_TESTNET_V3_CORE_FACTORY_ADDRESSES = '0xE270068748C499EC4E88fc609904e13C24A6C67B'
const HAUST_TESTNET_V3_MIGRATOR_ADDRESSES = '0xAf8BC8583851FDbcFBE0706aD019894C46735eeB'
const HAUST_TESTNET_MULTICALL_ADDRESS = '0x92c01EDc7C138b21640923F03211Ed3c8155c0AB'
const HAUST_TESTNET_QUOTER_ADDRESSES = '0x589E10967cE59Ce9642D9216f80EbCCB4A7E0A77'
const HAUST_TESTNET_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = '0x9c1D33eBB4F6A844a1e205daE88e7564bd4CFe8e'
const HAUST_TESTNET_TICK_LENS_ADDRESSES = '0x0e8D6151DF1Ebc563B6D9608a8368786D19b6a8c'
const HAUST_TESTNET_POOL_DEPLOYER = '0x9396b6b763a7E80CC6ae955e9a770f84aE7817b9'
const HAUST_TESTNET_UNIVERSAL_ROUTER_ADDRESS = '0x291021b87A248f03154Fbb4d928c9c693a8853A7'
const HAUST_TESTNET_V3_INIT_POOL_CODE_HASH = '0xa9cb11ffa1b1bf9a9a2b70b66f6a22db3e8328b37ec44e6ce602749081efdb6d'


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
