/* eslint-disable @typescript-eslint/no-restricted-imports */
import { useWeb3React } from "@web3-react/core";
import ERC20_ABI from "abis/erc20.json";
import { ethers } from "ethers";
import useBalancesMidnight from "graphql/thegraph/BalancesMidnightQuery";
import useCurrentTokensPrice from "graphql/thegraph/CurrentPricesTokensQuery";
import { useCallback, useEffect, useState } from "react";

export function useWalletBalance() {
  const { account, provider } = useWeb3React();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [absoluteChange, setAbsoluteChange] = useState<number>(0);
  const [percentChange, setPercentChange] = useState<number>(0);
  const { data: tokenPriceData } = useCurrentTokensPrice(1000);
  const { data: midnightData } = useBalancesMidnight(1000);

  const getBalances = useCallback(async () => {
    if (!account || !provider) return;

    try {
      setLoading(true);
      const prices = tokenPriceData?.tokens || [];
      const midnightPrices = midnightData?.tokens || [];

      if (!midnightPrices.length || !prices.length) {
        setPercentChange(0);
        setAbsoluteChange(0);
      } else {
        let totalPercentChange = 0;
        let totalAbsoluteChange = 0;
        let validTokenCount = 0;
        let total = 0;

        // Get native balance
        const nativeBalance = await provider.getBalance(account);
        const nativeAmount = Number(ethers.utils.formatEther(nativeBalance));

        // Find WHAUST price data (will be used for native token)
        const whaustToken = midnightPrices.find(
          (t) =>
            t.id.toLowerCase() ===
            "0x6c25c1cb4b8677982791328471be1bfb187687c1".toLowerCase()
        );
        const whaustCurrentPrice = prices.find(
          (p) =>
            p.id.toLowerCase() ===
            "0x6c25c1cb4b8677982791328471be1bfb187687c1".toLowerCase()
        );

        // Calculate native token changes using WHAUST prices
        if (whaustToken && whaustCurrentPrice) {
          const midnightPrice = Number(
            whaustToken.tokenDayData[0]?.priceUSD || 0
          );
          const currentPrice =
            Number(whaustCurrentPrice.derivedETH) *
            Number(tokenPriceData?.bundle?.ethPriceUSD);

          if (midnightPrice > 0) {
            const midnightValue = nativeAmount * midnightPrice;
            const currentValue = nativeAmount * currentPrice;
            const tokenAbsoluteChange = currentValue - midnightValue;

            totalAbsoluteChange += tokenAbsoluteChange;
            totalPercentChange +=
              ((currentPrice - midnightPrice) / midnightPrice) * 100;
            total += currentValue;
            validTokenCount++;
          }
        }

        const tokenAddresses = [
          "0x6c25c1cb4b8677982791328471be1bfb187687c1", // WHAUST
          "0x87054392461F52a513d83EF2e06af50f4e2F6614", // USDT
          "0x1AfB500AFfBBc8a7FC8aB0f5C4D06c59AC87B111", // USDC
          "0x48C3C36CE1DF7d5852FB4cda746015a9971A882E", // WETH
          "0x595BC82909f2311Cf19E865bc82e7930b103540C", // WBTC
        ];

        for (const tokenAddress of tokenAddresses) {
          const token = midnightPrices.find(
            (t) => t.id.toLowerCase() === tokenAddress.toLowerCase()
          );
          const currentPriceData = prices.find(
            (p) => p.id.toLowerCase() === tokenAddress.toLowerCase()
          );

          if (token && currentPriceData) {
            const midnightPrice = Number(token.tokenDayData[0]?.priceUSD || 0);
            const currentPrice =
              Number(currentPriceData.derivedETH) *
              Number(tokenPriceData?.bundle?.ethPriceUSD);

            if (midnightPrice > 0) {
              const contract = new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                provider
              );
              const balance = await contract.balanceOf(account);
              const decimals = await contract.decimals();
              const amount = Number(
                ethers.utils.formatUnits(balance, decimals)
              );

              const midnightValue = amount * midnightPrice;
              const currentValue = amount * currentPrice;
              const tokenAbsoluteChange = currentValue - midnightValue;

              totalAbsoluteChange += tokenAbsoluteChange;
              totalPercentChange +=
                ((currentPrice - midnightPrice) / midnightPrice) * 100;
              total += currentValue;
              validTokenCount++;
            }
          }
        }

        const averagePercentChange =
          validTokenCount > 0 ? totalPercentChange / validTokenCount : 0;
        setPercentChange(averagePercentChange);
        setAbsoluteChange(totalAbsoluteChange);
        setTotalBalance(total);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setLoading(false);
    }
  }, [account, provider, tokenPriceData, midnightData]);

  // Expose refetch function
  const refetch = useCallback(() => {
    getBalances();
  }, [getBalances]);

  useEffect(() => {
    getBalances();
  }, [getBalances]);

  return {
    totalBalance,
    loading,
    refetch,
    absoluteChange,
    percentChange,
  };
}
