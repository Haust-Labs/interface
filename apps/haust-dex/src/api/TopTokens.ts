import {Chain} from "api/util";
import {Nullish} from "types/common";


export enum Duration {
  hour = 'hour',
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
}
interface MarketData {
  duration: Duration;
  pricePercentChange: string;
  hourlyPriceChange: string;
  volume: Nullish<string>;
}
export interface TopTokenApi {
  address: string;
  name: string;
  priceUsd: string;
  symbol: string;
  totalValueLockedUsd: Nullish<string>;
  totalSupply: string;
  decimals: number;
  chain: Chain;
  marketData: MarketData;
}

