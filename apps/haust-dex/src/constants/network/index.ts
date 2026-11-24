import devnet from './devnet.json'
import mainnet from './mainnet.json'

type NetworkConfig = typeof devnet & typeof mainnet

/**
 * The only Haust network this build talks to, selected with REACT_APP_NETWORK (see craco.config.cjs).
 * Everything that differs between devnet and mainnet belongs in the JSON files, so that branches never diverge.
 * The comparison must stay inline: it lets webpack drop the other network's config from the bundle.
 */
export const NETWORK: NetworkConfig = process.env.REACT_APP_NETWORK === 'mainnet' ? mainnet : devnet

export const TRACKED_TOKEN_ADDRESSES: string[] = [
  NETWORK.tokens.whaust,
  NETWORK.tokens.weth,
  NETWORK.tokens.wbtc,
  NETWORK.tokens.usdt,
  NETWORK.tokens.usdc,
]

// The token table lists native HAUST as a copy of the WHAUST row, identified by this suffix.
export const NATIVE_TOKEN_ROW_ID = `${NETWORK.tokens.whaust}_haust`
