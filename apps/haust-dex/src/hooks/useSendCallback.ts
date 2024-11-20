import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Web3Provider } from '@ethersproject/providers'
import { useCallback } from "react";

export function useSendCallback({
  transactionRequest,
  provider,
}: {
  transactionRequest?: TransactionRequest;
  provider: Web3Provider;
}) {
  return useCallback(async () => {
    if (!transactionRequest || !provider) {
      throw new Error("Missing transaction request");
    }

    try {      
      const signer = provider.getSigner();
      const response = await signer.sendTransaction(transactionRequest);

      console.log("Transaction sent:", response);
      return response;
    } catch (error) {
      console.log('tx failed');
      return null;
    }
  }, [transactionRequest, provider]);
}
