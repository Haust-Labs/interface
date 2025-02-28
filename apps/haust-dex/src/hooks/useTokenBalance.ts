import { Contract } from "@ethersproject/contracts";
import { formatUnits } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import ERC20_ABI from "abis/erc20.json";
import useBalanceMidnightForToken from "graphql/thegraph/BalanceMidnightForTokenQuery";
import useCurrentTokenPrice from "graphql/thegraph/CurrentPriceTokensQuery";
import useCurrencyLogoURIs from "lib/hooks/useCurrencyLogoURIs";
import { useCallback, useEffect, useState } from "react";

export interface TokenBalance {
  balance: number;
  balanceUSD: number;
  priceChange: number;
}

export function useTokenBalance(token: any) {
  const { account, provider } = useWeb3React();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: tokenPriceData } = useCurrentTokenPrice(
    token.wrapped.address,
    1000
  );
  const { data: midnightData } = useBalanceMidnightForToken(
    token.wrapped.address,
    1000
  );

  const getBalance = useCallback(async () => {
    if (!account || !provider || !token) return;

    try {
      // Get token balance with error handling
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
      }

      // Calculate token price using ethPriceUSD and derivedETH
      let tokenPrice = 0;
      if (
        tokenPriceData?.bundle?.ethPriceUSD &&
        tokenPriceData?.token?.derivedETH
      ) {
        tokenPrice =
          Number(tokenPriceData.bundle.ethPriceUSD) *
          Number(tokenPriceData.token.derivedETH);
      }

      // Calculate price change using midnight data
      let priceChange = 0;
      const midnightPrice = Number(
        midnightData?.token?.tokenDayData[0]?.priceUSD || 0
      );

      if (midnightPrice > 0 && tokenPrice > 0) {
        priceChange = ((tokenPrice - midnightPrice) / midnightPrice) * 100;
      }

      setBalance({
        balance: Number(tokenBalance),
        balanceUSD: parseFloat(tokenBalance) * tokenPrice,
        priceChange,
      });
    } catch (error) {
      console.error("Error in getBalance:", error);
      // Set default values in case of error
      setBalance({
        balance: 0,
        balanceUSD: 0,
        priceChange: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [account, provider, token, tokenPriceData, midnightData]);

  // Expose refetch function
  const refetch = useCallback(() => {
    getBalance();
  }, [getBalance]);

  useEffect(() => {
    getBalance();
  }, [getBalance]);

  return { balance, loading, refetch };
}
