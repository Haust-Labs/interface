import {
  AllowanceTransfer,
  MaxAllowanceTransferAmount,
  PermitSingle,
} from "@uniswap/permit2-sdk";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import PERMIT2_ABI from "abis/permit2.json";
import { Permit2 } from "abis/types";
import { signTypedData } from "conedison/provider/signing";
import { useContract } from "hooks/useContract";
import { useSingleCallResult } from "lib/hooks/multicall";
import ms from "ms.macro";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Contract } from "@ethersproject/contracts";

import { PERMIT2_ADDRESS } from "../constants/addresses";

const PERMIT_EXPIRATION = ms`30d`;
const PERMIT_SIG_EXPIRATION = ms`30m`;

function toDeadline(expiration: number): number {
  return Math.floor((Date.now() + expiration) / 1000);
}

export function usePermitAllowance(
  token?: Token,
  owner?: string,
  spender?: string
) {
  const { chainId } = useWeb3React();
  const contract = useContract<Permit2>(
    PERMIT2_ADDRESS[chainId || 56],
    PERMIT2_ABI
  );
  const inputs = useMemo(
    () => [owner, token?.address, spender],
    [owner, spender, token?.address]
  );

  const [blocksPerFetch] = useState<1>(1);
  const result = useSingleCallResult(contract, "allowance", inputs, {
    blocksPerFetch,
  }).result as Awaited<ReturnType<Permit2["allowance"]>> | undefined;

  const rawAmount = result?.amount.toString();

  const allowance = useMemo(
    () =>
      token && rawAmount
        ? CurrencyAmount.fromRawAmount(token, rawAmount)
        : undefined,
    [token, rawAmount]
  );

  return useMemo(
    () => ({
      permitAllowance: allowance,
      expiration: result?.expiration,
      nonce: result?.nonce,
    }),
    [allowance, result?.expiration, result?.nonce]
  );
}

interface Permit extends PermitSingle {
  sigDeadline: number;
}

export interface PermitSignature extends Permit {
  signature: string;
}

export function useUpdatePermitAllowance(
  amount: CurrencyAmount<Token> | undefined,
  spender: string | undefined
) {
  const { account, chainId, provider } = useWeb3React();

  return useCallback(async () => {
    try {
      if (!chainId) throw new Error("missing chainId");
      if (!provider) throw new Error("missing provider");
      if (!account) throw new Error("missing account");
      if (!amount) throw new Error("missing amount");
      if (!spender) throw new Error("missing spender");

      const contract = new Contract(
        PERMIT2_ADDRESS[chainId],
        PERMIT2_ABI,
        provider.getSigner(account)
      );

      const tx = await contract.approve(
        amount.currency.address,
        spender,
        amount.quotient.toString(),
        toDeadline(PERMIT_EXPIRATION)
      );

      return await tx.wait();
    } catch (e: unknown) {
      const symbol = amount?.currency?.symbol ?? "Token";
      throw new Error(
        `${symbol} permit allowance failed: ${
          e instanceof Error ? e.message : e
        }`
      );
    }
  }, [account, chainId, provider, spender, amount]);
}
