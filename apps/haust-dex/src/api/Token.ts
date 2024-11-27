import {api} from "api/axios";
import {TokenApi} from "api/types";
import {DEFAULT_ERC20_DECIMALS} from "constants/tokens";
import {Chain, HistoryDuration} from "graphql/data/__generated__/types-and-hooks";
import {CHAIN_NAME_TO_CHAIN_ID, PricePoint} from "graphql/data/util";
import {useCallback, useEffect, useState} from "react";
import {WrappedTokenInfo} from "state/lists/wrappedTokenInfo";

interface TokenSparklineApi {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  priceUsd: string;
  chain: Chain;
  priceHistory: PricePoint[];
}

interface UseTokenReturnValue {
  data: TokenApi | undefined;
  tokenPriceQuery: TokenSparklineApi | undefined;
  loadingToken: boolean;
}

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

function useTokenQuery(address: string | undefined) {
  const [tokenData, setTokenData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const query = useCallback(
    async () => {
      setLoading(true);
      try {
        if (address) {
          const { data } = await api.get('/tokens/token/', { params: { address } });
          setTokenData(data)
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    },
    [address],
  );

  useEffect(() => {
    query();
  }, [query]);

  return { data: tokenData, loading };
}
function useTokenSparklineQuery(address: string | undefined, duration = HistoryDuration.Day) {
  const [tokenSparklineData, setTokenSparklineData] = useState(undefined);
  const query = useCallback(
    async () => {
      try {
        if (address) {
          const { data } = await api.get('/tokens/token_sparkline/',
            {
              params: {
                address,
                duration: duration.toLowerCase()
              }
            });
          setTokenSparklineData(data)
        }
      } catch (e) {
        console.log(e);
      }
    },
    [address, duration],
  );

  useEffect(() => {
    query();
  }, [query]);

  return { data: tokenSparklineData };
}

export const useTokenApi = (tokenAddress: string | undefined, duration: HistoryDuration): UseTokenReturnValue => {
  const { data, loading: loadingToken } = useTokenQuery(tokenAddress);
  const { data: tokenPriceQuery } = useTokenSparklineQuery(tokenAddress, duration);
  return { data, tokenPriceQuery, loadingToken }
}
