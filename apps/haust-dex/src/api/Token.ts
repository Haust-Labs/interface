import {TokenApi} from "api/types";
import {DEFAULT_ERC20_DECIMALS} from "constants/tokens";
import {Chain} from "graphql/data/__generated__/types-and-hooks";
import {CHAIN_NAME_TO_CHAIN_ID} from "graphql/data/util";
import {WrappedTokenInfo} from "state/lists/wrappedTokenInfo";


export class QueryToken extends WrappedTokenInfo {
  constructor(address: string, chain: Chain, data: NonNullable<TokenApi>) {
    super({
      chainId: CHAIN_NAME_TO_CHAIN_ID[chain],
      address,
      decimals: +data.decimals ?? DEFAULT_ERC20_DECIMALS,
      symbol: data.symbol ?? '',
      name: data.name ?? '',
    })
  }
}
