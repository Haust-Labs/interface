import { Contract } from "@ethersproject/contracts";
import { formatUnits } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import ERC20_ABI from "abis/erc20.json";
import useTokensData from "graphql/thegraph/TokensDataQuery";
import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "state/hooks";

import { setLoading, TokenData, updateTokenPrices } from "./slice";

const WHAUST_ADDRESS = "0x2c990daddaf3b760443b512da9f001f721951438";
const HAUST_SYMBOL = "HAUST";
const CACHE_DURATION = 30000;
const POLLING_INTERVAL = 5000;

export function useTokensWithBalances() {
  const { account, provider } = useWeb3React();
  const dispatch = useAppDispatch();
  const { prices, midnightPrices, ethPrice, lastUpdated, isLoading } =
    useAppSelector((state) => state.tokens);

  const { data: tokensData, isLoading: isLoadingTokens } =
    useTokensData(POLLING_INTERVAL);

  const updateTokensData = useCallback(async () => {
    if (!account || !provider || !tokensData?.tokens) return;

    try {
      dispatch(setLoading(true));
      const processedTokens: TokenData[] = [];
      let total = 0;
      let totalAbsoluteChange = 0;
      let totalPercentChange = 0;
      let validTokenCount = 0;

      const nativeBalance = await provider.getBalance(account);
      const nativeAmount = Number(formatUnits(nativeBalance, 18));

      const whaustToken = tokensData.tokens.find(
        (t) => t.id.toLowerCase() === WHAUST_ADDRESS.toLowerCase()
      );

      if (whaustToken) {
        const midnightPrice = Number(
          whaustToken.tokenDayData[0]?.priceUSD || 0
        );
        const currentPrice =
          Number(whaustToken.derivedETH) *
          Number(tokensData.bundle.ethPriceUSD);

        if (midnightPrice > 0) {
          const haustMidnightValue = nativeAmount * midnightPrice;
          const haustCurrentValue = nativeAmount * currentPrice;
          const haustAbsoluteChange = haustCurrentValue - haustMidnightValue;

          processedTokens.push({
            id: "NATIVE",
            name: "Haust",
            symbol: HAUST_SYMBOL,
            balance: nativeAmount,
            balanceUSD: haustCurrentValue,
            priceUSD: currentPrice,
            priceChange: ((currentPrice - midnightPrice) / midnightPrice) * 100,
            derivedETH: whaustToken.derivedETH,
            decimals: 18,
            chainId: 1,
            address: "NATIVE",
            isNative: true,
          });

          // const contract = new Contract(WHAUST_ADDRESS, ERC20_ABI, provider);
          // const whaustBalance = await contract.balanceOf(account);
          // const whaustAmount = Number(
          //   formatUnits(whaustBalance, whaustToken.decimals)
          // );

          // const whaustMidnightValue = whaustAmount * midnightPrice;
          // const whaustCurrentValue = whaustAmount * currentPrice;
          // const whaustAbsoluteChange = whaustCurrentValue - whaustMidnightValue;

          // processedTokens.push({
          //   id: whaustToken.id,
          //   name: whaustToken.name,
          //   symbol: whaustToken.symbol,
          //   balance: whaustAmount,
          //   balanceUSD: whaustCurrentValue,
          //   priceUSD: currentPrice,
          //   priceChange: ((currentPrice - midnightPrice) / midnightPrice) * 100,
          //   derivedETH: whaustToken.derivedETH,
          //   decimals: Number(whaustToken.decimals),
          //   chainId: 1,
          //   address: whaustToken.id,
          //   isNative: false,
          // });

          totalAbsoluteChange += haustAbsoluteChange;
          totalPercentChange +=
            ((currentPrice - midnightPrice) / midnightPrice) * 200;
          total += haustCurrentValue;
          validTokenCount += 2;
        }
      }

      for (const token of tokensData.tokens) {
        if (token.id.toLowerCase() === WHAUST_ADDRESS.toLowerCase()) {
          continue;
        }

        const midnightPrice = Number(token.tokenDayData[0]?.priceUSD || 0);
        const currentPrice =
          Number(token.derivedETH) * Number(tokensData.bundle.ethPriceUSD);

        if (midnightPrice > 0) {
          const contract = new Contract(token.id, ERC20_ABI, provider);
          const balance = await contract.balanceOf(account);
          const amount = Number(formatUnits(balance, token.decimals));

          const midnightValue = amount * midnightPrice;
          const currentValue = amount * currentPrice;
          const tokenAbsoluteChange = currentValue - midnightValue;

          processedTokens.push({
            id: token.id,
            name: token.name,
            symbol: token.symbol,
            balance: amount,
            balanceUSD: currentValue,
            priceUSD: currentPrice,
            priceChange: ((currentPrice - midnightPrice) / midnightPrice) * 100,
            derivedETH: token.derivedETH,
            decimals: Number(token.decimals),
            chainId: 1,
            address: token.id,
            isNative: false,
          });

          totalAbsoluteChange += tokenAbsoluteChange;
          totalPercentChange +=
            ((currentPrice - midnightPrice) / midnightPrice) * 100;
          total += currentValue;
          validTokenCount++;
        }
      }

      const averagePercentChange =
        validTokenCount > 0 ? totalPercentChange / validTokenCount : 0;

      const processedMidnightTokens: TokenData[] = tokensData.tokens.map(
        (token) => ({
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          balance: 0,
          balanceUSD: 0,
          priceUSD: Number(token.tokenDayData[0]?.priceUSD || 0),
          priceChange: 0,
          derivedETH: token.derivedETH,
          decimals: Number(token.decimals),
          chainId: 1,
          address: token.id,
          isNative: token.id.toLowerCase() === WHAUST_ADDRESS.toLowerCase(),
        })
      );

      processedTokens.forEach((token) => {
        const midnightToken = processedMidnightTokens.find(
          (t) => t.id === token.id
        );
        if (midnightToken && midnightToken.priceUSD > 0) {
          const currentValue = token.balanceUSD || 0;
          const midnightValue =
            (token.balance || 0) * (midnightToken.priceUSD || 0);

          token.priceChange =
            midnightValue > 0
              ? ((currentValue - midnightValue) / midnightValue) * 100
              : 0;
        }
      });

      dispatch(
        updateTokenPrices({
          prices: processedTokens,
          midnightPrices: processedMidnightTokens,
          ethPrice: tokensData.bundle.ethPriceUSD,
        })
      );

      return {
        totalBalance: total,
        absoluteChange: totalAbsoluteChange,
        percentChange: averagePercentChange,
      };
    } catch (error) {
      console.error("Error updating token data:", error);
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }, [account, provider, tokensData, dispatch]);

  useEffect(() => {
    const now = Date.now();
    if (tokensData && !isLoading && now - lastUpdated > CACHE_DURATION) {
      updateTokensData();
    }
  }, [lastUpdated, updateTokensData, tokensData, isLoading]);

  if (isLoading || isLoadingTokens) {
    return {
      tokens: [],
      totalBalance: 0,
      absoluteChange: 0,
      percentChange: 0,
      isLoading: true,
      ethPrice: "0",
    };
  }

  return {
    tokens: prices,
    totalBalance: prices.reduce(
      (total, token) => total + (token.balanceUSD || 0),
      0
    ),
    absoluteChange: prices.reduce((total, token) => {
      const midnightToken = midnightPrices.find((t) => t.id === token.id);
      return (
        total +
        ((token.balanceUSD || 0) -
          (token.balance || 0) * (midnightToken?.priceUSD || 0))
      );
    }, 0),
    percentChange: (() => {
      const absoluteChange = prices.reduce((total, token) => {
        const midnightToken = midnightPrices.find((t) => t.id === token.id);
        return (
          total +
          ((token.balanceUSD || 0) -
            (token.balance || 0) * (midnightToken?.priceUSD || 0))
        );
      }, 0);

      const totalMidnightValue = prices.reduce((total, token) => {
        const midnightToken = midnightPrices.find((t) => t.id === token.id);
        return total + (token.balance || 0) * (midnightToken?.priceUSD || 0);
      }, 0);

      return totalMidnightValue > 0
        ? (absoluteChange / totalMidnightValue) * 100
        : 0;
    })(),
    isLoading: false,
    ethPrice,
  };
}
