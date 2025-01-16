import { Contract } from "@ethersproject/contracts";
import { formatUnits } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import ERC20_ABI from "abis/erc20.json";
import useCurrencyLogoURIs from "lib/hooks/useCurrencyLogoURIs";
import { useCallback,useEffect, useState } from "react";

export interface TokenBalance {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  balance: number;
  balanceUSD: number;
  priceChange: number;
}

interface TokenPrice {
  price: string;
  price_decimals: number;
  token: {
    address: string | null;
    symbol: string;
  };
}

export function useTokenBalance(token: any) {
  const { account, provider } = useWeb3React();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const logoURI = useCurrencyLogoURIs(token)[0];
  const getBalance = useCallback(async () => {
    if (!account || !provider || !token) return;

    try {
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
      console.log("tokenBalance", tokenBalance, token.symbol, token.decimals)
      // Get prices with error handling
      let prices: TokenPrice[] = [];
      try {
        const pricesResponse = await fetch(
          "https://entrypoint.wdev.haust.app/v1/fiat_prices"
        );
        prices = await pricesResponse.json();
      } catch (error) {
        console.error("Error fetching prices:", error);
      }

      // Get token details with error handling
      let tokenDetails = [];
      try {
        const detailsResponse = await fetch(
          "https://entrypoint.wdev.haust.app/v1/tokens/details/?lang=EN"
        );
        tokenDetails = await detailsResponse.json();
      } catch (error) {
        console.error("Error fetching token details:", error);
      }
      
      const tokenDetail = tokenDetails.find((detail: any) => {
        if (token.symbol === "WHAUST" || token.isNative) {
          return detail.token_id === 5;
        }
        return detail.token_address?.toLowerCase() === token.address.toLowerCase();
      });

      // Get midnight data and calculate price change with error handling
      let priceChange = 0;
      if (tokenDetail && account) {
        try {
          const midnightResponse = await fetch(
            `https://entrypointv02.wdev.haust.app/v1/account/${account}/balance_midnight`,
            {
              headers: {
                'X-Haust-Wallet-Version': '0.1'
              }
            }
          );
          const midnightData = await midnightResponse.json();
          
          const midnightPrice = midnightData.find((item: any) => item.id === tokenDetail.token_id);
          
          if (midnightPrice) {
            const midnightPriceValue = parseInt(midnightPrice.usd_price_midnight, 16) / 
              Math.pow(10, midnightPrice.usd_price_decimals);
            
            const priceData = prices.find((p) => {
              if (token.symbol === "WHAUST" || token.isNative) {
                return p.token.symbol === "HAUST";
              }
              return p.token.address?.toLowerCase() === token.address.toLowerCase();
            });

            if (priceData) {
              const currentPrice = Number(priceData.price) / Math.pow(10, priceData.price_decimals);
              priceChange = ((currentPrice - midnightPriceValue) / midnightPriceValue) * 100;
            }
          }
        } catch (error) {
          console.error("Error fetching midnight data:", error);
        }
      }

      // Calculate token price
      let tokenPrice = 0;
      const priceData = prices.find((p) => {
        if (token.symbol === "WHAUST" || token.isNative) {
          return p.token.symbol === "HAUST";
        }
        return p.token.address?.toLowerCase() === token.address.toLowerCase();
      });

      if (priceData) {
        tokenPrice = Number(priceData.price) / Math.pow(10, priceData.price_decimals);
      }

      setBalance({
        chainId: token.chainId,
        address: token.address,
        symbol: token.symbol || "",
        name: token.name || "",
        decimals: token.decimals,
        logoURI,
        balance: Number(tokenBalance),
        balanceUSD: parseFloat(tokenBalance) * tokenPrice,
        priceChange,
      });
    } catch (error) {
      console.error("Error in getBalance:", error);
      // Set default values in case of error
      setBalance({
        chainId: token.chainId,
        address: token.address,
        symbol: token.symbol || "",
        name: token.name || "",
        decimals: token.decimals,
        logoURI,
        balance: 0,
        balanceUSD: 0,
        priceChange: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [account, provider, token, logoURI]);

  const refetch = useCallback(() => {
    getBalance();
  }, [getBalance]);

  useEffect(() => {
    getBalance();
  }, [getBalance]);

  return { balance, loading, refetch };
}
