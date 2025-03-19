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

    const chainIdHex = "0x5AD4EB13";
    const networkParams = {
      chainId: chainIdHex,
      chainName: "HAUST Testnet Network",
      nativeCurrency: {
        name: "Haust",
        symbol: "HAUST",
        decimals: 18,
      },
      rpcUrls: ["https://rpc-testnet.haust.app"],
      blockExplorerUrls: ["https://explorer-testnet.haust.app"],
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
