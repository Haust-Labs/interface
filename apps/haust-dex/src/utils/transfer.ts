import { TransactionRequest } from "@ethersproject/abstract-provider";
import type { Web3Provider } from "@ethersproject/providers";
import { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import ERC20_ABI from "abis/erc20.json";
import { Erc20 } from "abis/types/Erc20";
import { useCallback } from "react";
import { getContract } from "utils";

import { useAsyncData } from "./react-hook";

interface TransferInfo {
  provider?: Web3Provider;
  account?: string;
  chainId?: number;
  currencyAmount?: CurrencyAmount<Currency>;
  toAddress?: string;
}

interface TransferCurrencyParams {
  provider: Web3Provider;
  account: string;
  chainId: number;
  toAddress: string;
  tokenAddress: string;
  amountInWei: string;
}

export function useCreateTransferTransaction(transferInfo: TransferInfo) {
  const transactionFetcher = useCallback(() => {
    return getTransferTransaction(transferInfo);
  }, [transferInfo]);

  return useAsyncData(transactionFetcher).data;
}

async function getTransferTransaction(
  transferInfo: TransferInfo
): Promise<TransactionRequest | undefined> {
  const { provider, account, chainId, currencyAmount, toAddress } =
    transferInfo;

  if (!provider || !account || !chainId || !currencyAmount || !toAddress) {
    return undefined;
  }

  const currency = currencyAmount.currency;
  const params = {
    provider,
    account,
    chainId,
    toAddress,
    tokenAddress: currency.isNative ? "" : currency.address,
    amountInWei: currencyAmount.quotient.toString(),
  };

  return currency.isNative
    ? getNativeTransferRequest(params)
    : getTokenTransferRequest(params);
}

function getNativeTransferRequest(
  params: TransferCurrencyParams
): TransactionRequest {
  const { account, toAddress, amountInWei, chainId } = params;

  return {
    from: account,
    to: toAddress,
    value: amountInWei,
    chainId,
  };
}

async function getTokenTransferRequest(
  transferParams: TransferCurrencyParams
): Promise<TransactionRequest | undefined> {
  const { provider, account, chainId, toAddress, tokenAddress, amountInWei } =
    transferParams;
  if (!account) {
    return undefined;
  }

  const tokenContract = getContract(
    tokenAddress,
    ERC20_ABI,
    provider,
    account
  ) as Erc20;

  try {
    const populatedTransaction =
      await tokenContract.populateTransaction.transfer(toAddress, amountInWei, {
        from: account,
      });

    return { ...populatedTransaction, chainId };
  } catch (error) {
    console.error(error, {
      tags: {
        file: "transfer",
        function: "getTokenTransferRequest",
      },
      extra: { transferParams },
    });
  }

  return undefined;
}
