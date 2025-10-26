import { useCallback, useState } from "react";

interface SwitchNetworkHookResult {
  switchNetwork: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useSwitchNetwork = (): SwitchNetworkHookResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error(
        "Ethereum provider is not available. Please install MetaMask or another wallet."
      );
    }

    setIsLoading(true);
    setError(null);

    const chainIdHex = "0xF18";
    const networkParams = {
      chainId: chainIdHex,
      chainName: "HAUST Network",
      nativeCurrency: {
        name: "Haust",
        symbol: "HAUST",
        decimals: 18,
      },
      rpcUrls: ["https://haust-network-rpc.eu-north-2.gateway.fm"],
      blockExplorerUrls: ["https://haust-network-blockscout.eu-north-2.gateway.fm"],
    };

    try {
      try {
        await (window.ethereum as any).request({
          method: "wallet_addEthereumChain",
          params: [networkParams],
        });
      } catch (addError: any) {
        console.log("Add network error:", addError);
      }

      await (window.ethereum as any).request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: any) {
      console.error("Switch network error:", error);
      setError(new Error(error.message || "Failed to switch network"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { switchNetwork, isLoading, error };
};
