import { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import useCurrentTokenPrice from "graphql/thegraph/CurrentPriceTokensQuery";
import { useEffect, useState } from "react";

type CurrentTokenPriceQuery = {
  bundle?: {
    ethPriceUSD: number;
  };
  token?: {
    derivedETH: number;
    id: string;
    name: string;
  };
};

export function useUSDPrice(currencyAmount?: CurrencyAmount<Currency>): {
  data: number | undefined;
  isLoading: boolean;
} {
  const [price, setPrice] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);

  const { data: priceData, isLoading: isPriceLoading } =
    useCurrentTokenPrice(currencyAmount?.currency.wrapped.address, 10000);

    useEffect(() => {
    if (priceData?.bundle && priceData?.token && currencyAmount) {
      const tokenPriceUSD =
        priceData.bundle.ethPriceUSD * priceData.token.derivedETH;
      const totalPrice = tokenPriceUSD * Number(currencyAmount.toExact() || 0);
      setPrice(totalPrice);
    }
    setIsLoading(isPriceLoading);
  }, [priceData, currencyAmount, isPriceLoading]);

  return { data: price, isLoading };
}
