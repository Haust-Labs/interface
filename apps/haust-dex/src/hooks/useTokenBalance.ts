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

      if (token.isNative) {
        const nativeBalance = await provider.getBalance(account);
        tokenBalance = formatUnits(nativeBalance, token.decimals);
      } else {
        const contract = new Contract(token.address, ERC20_ABI, provider);
        const rawBalance = await contract.balanceOf(account);
        tokenBalance = formatUnits(rawBalance, token.decimals);
      }

      const pricesResponse = await fetch(
        "https://entrypoint.wdev.haust.app/v1/fiat_prices"
      );
      const prices: TokenPrice[] = await pricesResponse.json();
      let tokenPrice = 0;

      const detailsResponse = await fetch(
        "https://entrypoint.wdev.haust.app/v1/tokens/details/?lang=EN"
      );
      const tokenDetails = await detailsResponse.json();
      
      const tokenDetail = tokenDetails.find((detail: any) => {
        if (token.symbol === "WHAUST" || token.isNative) {
          return detail.token_id === 5;
        }
        return detail.token_address?.toLowerCase() === token.address.toLowerCase();
      });

      let priceChange = 0;
      if (tokenDetail && account) {
        const midnightResponse = await fetch(
          `https://entrypoint.wdev.haust.app/v1/account/${account}/balance_midnight`
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
      }

      const priceData = prices.find((p) => {
        if (token.symbol === "WHAUST" || token.isNative) {
          return p.token.symbol === "HAUST";
        }
        return p.token.address?.toLowerCase() === token.address.toLowerCase();
      });

      if (priceData) {
        tokenPrice =
          Number(priceData.price) / Math.pow(10, priceData.price_decimals);
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
      console.error("Error fetching token balance:", error);
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
