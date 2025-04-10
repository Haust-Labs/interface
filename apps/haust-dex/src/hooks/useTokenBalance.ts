import { Contract } from "@ethersproject/contracts";
import { formatUnits } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import ERC20_ABI from "abis/erc20.json";
import useBalanceMidnightForToken from "graphql/thegraph/BalanceMidnightForTokenQuery";
import useCurrentTokenPrice from "graphql/thegraph/CurrentPriceTokensQuery";
import { useCallback, useEffect, useState, useRef } from "react";

const balanceCache = new Map<
  string,
  {
    balance: TokenBalance;
    timestamp: number;
  }
>();

const CACHE_DURATION = 30 * 1000;
const POLLING_INTERVAL = 15 * 1000;
const DEBOUNCE_DELAY = 500;

export interface TokenBalance {
  balance: number;
  balanceUSD: number;
  priceChange: number;
}

export function useTokenBalance(token: any) {
  const { account, provider } = useWeb3React();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { data: tokenPriceData } = useCurrentTokenPrice(
    token?.wrapped?.address,
    1000
  );
  const { data: midnightData } = useBalanceMidnightForToken(
    token?.wrapped?.address,
    1000
  );

  const pollingInterval = useRef<NodeJS.Timeout>();
  const debounceTimer = useRef<NodeJS.Timeout>();

  const getCacheKey = useCallback(() => {
    return `${account}-${token?.address}`;
  }, [account, token]);

  const getBalance = useCallback(
    async (skipCache = false) => {
      if (!account || !provider || !token) return;

      const cacheKey = getCacheKey();

      if (!skipCache) {
        const cached = balanceCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setBalance(cached.balance);
          setLoading(false);
          return;
        }
      }

      try {
        setError(null);

        let tokenBalance = "0";
        try {
          if (token.isNative) {
            const nativeBalance = await provider.getBalance(account);
            tokenBalance = formatUnits(nativeBalance, token.decimals);
          } else {
            const contract = new Contract(token.address, ERC20_ABI, provider);
            const rawBalance = await contract.balanceOf(account);
            tokenBalance = formatUnits(rawBalance, token.decimals);
          }
        } catch (error) {
          console.error("Error fetching token balance:", error);
          throw error;
        }

        let tokenPrice = 0;
        if (
          tokenPriceData?.bundle?.ethPriceUSD &&
          tokenPriceData?.token?.derivedETH
        ) {
          tokenPrice =
            Number(tokenPriceData.bundle.ethPriceUSD) *
            Number(tokenPriceData.token.derivedETH);
        }

        let priceChange = 0;
        const midnightPrice = Number(
          midnightData?.token?.tokenDayData[0]?.priceUSD || 0
        );

        if (midnightPrice > 0 && tokenPrice > 0) {
          priceChange = ((tokenPrice - midnightPrice) / midnightPrice) * 100;
        }

        const newBalance = {
          balance: Number(tokenBalance),
          balanceUSD: parseFloat(tokenBalance) * tokenPrice,
          priceChange,
        };

        balanceCache.set(cacheKey, {
          balance: newBalance,
          timestamp: Date.now(),
        });

        setBalance(newBalance);
      } catch (error) {
        console.error("Error in getBalance:", error);
        setError(error as Error);
        setBalance({
          balance: 0,
          balanceUSD: 0,
          priceChange: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [account, provider, token, tokenPriceData, midnightData, getCacheKey]
  );

  const debouncedGetBalance = useCallback(
    (skipCache = false) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        getBalance(skipCache);
      }, DEBOUNCE_DELAY);
    },
    [getBalance]
  );

  const refetch = useCallback(() => {
    getBalance(true);
  }, [getBalance]);

  useEffect(() => {
    debouncedGetBalance();

    pollingInterval.current = setInterval(() => {
      debouncedGetBalance();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [debouncedGetBalance]);

  return { balance, loading, error, refetch };
}
