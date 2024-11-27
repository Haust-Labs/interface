import {Chain} from "api/util";
import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod
} from "components/Tokens/state";
import {SupportedChainId} from "constants/chains";
import {
  isPricePoint, PricePoint,
  toHistoryDuration, unwrapToken
} from "graphql/data/util";
import {useAtomValue} from "jotai/utils";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Nullish} from "types/common";

import {api} from "./axios";

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
  volume: Nullish<string>;
}
export interface TopTokenApi {
  address: string;
  name: string;
  priceUsd: string;
  symbol: string;
  totalValueLockedUsd: Nullish<string>;
  decimals: number;
  chain: Chain;
  marketData: MarketData;
}

export type SparklineMap = { [key: string]: PricePoint[] | undefined }
interface UseTopTokensReturnValue {
  tokens: TopTokenApi[];
  tokenSortRank: Record<string, number>
  loadingTokens: boolean
  sparklines: SparklineMap
}
interface TopTokenSparklineApi {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  priceUsd: string;
  chain: Chain;
  priceHistory: PricePoint[];
}

function useTopTokensQuery(duration: Duration): { data: TopTokenApi[], loading: boolean }  {
  const [topTokensData, setTopTokensData] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = useCallback(
      async () => {
        setLoading(true);
        try {
          const { data } = await api.get('/tokens/top_tokens_100/', { params: { duration } });
          setTopTokensData(data)
        } catch (e) {
          console.log(e);
        } finally {
          setLoading(false);
        }
      },
    [duration],
  );

  useEffect(() => {
    query();
  }, [query]);

  return { data: topTokensData, loading };
}

function useTopTokensSparklineQuery(duration: Duration): { data: TopTokenSparklineApi[] | undefined } {
  const [topTokensSparklineData, setTopTokensSparklineData] = useState(undefined);
  const query = useCallback(
    async () => {
      try {
        const { data } = await api.get('/tokens/top_tokens_sparkline/', { params: { duration } });
        setTopTokensSparklineData(data)
      } catch (e) {
        console.log(e);
      }
    },
    [duration],
  );

  useEffect(() => {
    query();
  }, [query]);

  return { data: topTokensSparklineData };
}

function useSortedTokens(tokens: TopTokenApi[]) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    if (!tokens) return []
    let tokenArray = Array.from(tokens)
    switch (sortMethod) {
      case TokenSortMethod.PRICE:
        tokenArray = tokenArray.sort((a, b) => (+b?.priceUsd ?? 0) - (+a?.priceUsd ?? 0))
        break
      case TokenSortMethod.PERCENT_CHANGE:
        tokenArray = tokenArray.sort(
          (a, b) => (+b?.marketData.pricePercentChange ?? 0) - (+a?.marketData.pricePercentChange ?? 0)
        )
        break
      case TokenSortMethod.TOTAL_VALUE_LOCKED:
        tokenArray = tokenArray.sort(
          (a, b) => (+b.totalValueLockedUsd! ?? 0) - (+a.totalValueLockedUsd! ?? 0)
        )
        break
      case TokenSortMethod.VOLUME:
        tokenArray = tokenArray.sort((a, b) => (+b.marketData.volume! ?? 0) - (+a.marketData.volume! ?? 0))
        break
    }

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: TopTokenApi[]) {
  const filterString = useAtomValue(filterStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) return []
    let returnTokens = tokens
    if (lowercaseFilterString) {
      returnTokens = returnTokens?.filter((token) => {
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
        return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
      })
    }
    return returnTokens
  }, [tokens, lowercaseFilterString])
}

export function useTopTokensApi(): UseTopTokensReturnValue {
  // const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))

  const { data: sparklineQuery } = useTopTokensSparklineQuery(duration.toLowerCase() as Duration)
  const { data, loading: loadingTokens } = useTopTokensQuery(duration.toLowerCase() as Duration);

  const sparklines = useMemo(() => {
    const unwrappedTokens = sparklineQuery?.map((topToken) => unwrapToken(SupportedChainId.HAUST, topToken))
    const map: SparklineMap = {}
    unwrappedTokens?.forEach(
      (current) => current?.address && (map[current.address] = current?.priceHistory?.filter(isPricePoint))
    )
    return map
  }, [sparklineQuery])

  const unwrappedTokens = useMemo(() => data?.map((token) => unwrapToken(SupportedChainId.HAUST, token)), [data])
  const sortedTokens = useSortedTokens(unwrappedTokens)

  const tokenSortRank = useMemo(
    () =>
      sortedTokens?.reduce((acc, cur, i) => {
        if (!cur.address) return acc
        return {
          ...acc,
          [cur.address]: i + 1,
        }
      }, {}) ?? {},
    [sortedTokens]
  )
  const filteredTokens = useFilteredTokens(sortedTokens)
  return useMemo(
    () => ({ tokens: filteredTokens, tokenSortRank, loadingTokens, sparklines }),
    [filteredTokens, tokenSortRank, loadingTokens, sparklines]
  )
}
