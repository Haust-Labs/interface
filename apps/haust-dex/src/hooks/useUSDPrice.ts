import { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import { useEffect, useState } from "react";
import { generateBearerToken } from "utils/generateBearerToken";

interface PriceResponse {
  price: string;
  price_decimals: number;
  timestamp: number;
  currency: string;
  token: {
    address: string | null;
    external_id: number;
    full_name: string;
    symbol: string;
  };
}

export function useUSDPrice(currencyAmount?: CurrencyAmount<Currency>): {
  data: number | undefined;
  isLoading: boolean;
} {
  const [price, setPrice] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const nonce = Date.now().toString();
        const authToken = generateBearerToken(nonce);
        const pricesResponse = await fetch(
          "https://entrypointv02.wdev.haust.app/v1/fiat_prices",
          {
            headers: {
              "X-Haust-Wallet-Version": "0.1",
              Authorization: authToken,
            },
          }
        );
        const prices: PriceResponse[] = await pricesResponse.json();

        // Find matching token price based on symbol or address
        const tokenPrice = prices.find((p) => {
          if (
            currencyAmount?.currency.isNative ||
            currencyAmount?.currency.symbol === "WHAUST"
          ) {
            return p.token.symbol === "HAUST";
          }
          if (!currencyAmount?.currency.isToken) {
            return p.token.symbol === currencyAmount?.currency.symbol;
          }
          return (
            p.token.symbol === currencyAmount?.currency.symbol ||
            p.token.address?.toLowerCase() ===
              currencyAmount.currency.address.toLowerCase()
          );
        });

        if (tokenPrice) {
          // Convert price to proper decimal places and multiply by the input amount
          const priceValue =
            Number(tokenPrice.price) / Math.pow(10, tokenPrice.price_decimals);
          const totalPrice =
            priceValue * Number(currencyAmount?.toExact() || 0);
          setPrice(totalPrice);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
        setIsLoading(false);
      }
    }

    if (currencyAmount) {
      fetchPrices();
    }
  }, [currencyAmount]);

  return { data: price, isLoading };
}
