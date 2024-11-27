import {Chain} from "api/util";
import {Nullish} from "types/common";

interface MarketData {
  volume24H: string;
  priceHigh52W: string;
  priceLow52W: string;
  pricePercentChange: string;
}
export interface TokenApi {
  address: string;
  name: string;
  priceUsd: string;
  symbol: string;
  totalValueLockedUsd: Nullish<string>;
  decimals: number;
  chain: Chain;
  marketData: MarketData;
}