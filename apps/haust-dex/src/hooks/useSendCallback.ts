import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Web3Provider } from "@ethersproject/providers";
import { useCallback } from "react";
import { useTransactionAdder } from "../state/transactions/hooks";
import { TransactionType } from "state/transactions/types";

export function useSendCallback({
  transactionRequest,
  provider,
  tokenAddress,
  amount,
  recipient
}: {
  transactionRequest: TransactionRequest;
  provider: Web3Provider;
  tokenAddress?: string;
  amount?: string;
  recipient?: string;
}) {
  const addTransaction = useTransactionAdder();

  return useCallback(async () => {
    if (!transactionRequest || !provider) {
      throw new Error("Missing transaction request");
    }

    try {
      const signer = provider.getSigner();
      const response = await signer.sendTransaction(transactionRequest);

      addTransaction(response, {
        type: TransactionType.SEND,
        currencyId: tokenAddress || '',
        amount: amount || '',
        recipient: recipient || '',
      });

      return response;
    } catch (error) {
      console.log("tx failed");
      return null;
    }
  }, [transactionRequest, provider, addTransaction, tokenAddress, amount]);
}
