import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import { AVERAGE_L1_BLOCK_TIME } from "constants/chainInfo";
import {
  PermitSignature,
  usePermitAllowance,
  useUpdatePermitAllowance,
} from "hooks/usePermitAllowance";
import {
  useTokenAllowance,
  useUpdateTokenAllowance,
} from "hooks/useTokenAllowance";
import useInterval from "lib/hooks/useInterval";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useHasPendingApproval,
  useTransactionAdder,
} from "state/transactions/hooks";

import { PERMIT2_ADDRESS } from "../constants/addresses";
import { TransactionType } from "state/transactions/types";

enum ApprovalState {
  PENDING,
  SYNCING,
  SYNCED,
}

export enum AllowanceState {
  LOADING,
  REQUIRED,
  ALLOWED,
}

interface AllowanceRequired {
  state: AllowanceState.REQUIRED;
  token: Token;
  isApprovalLoading: boolean;
  isApprovalPending: boolean;
  approveAndPermit: () => Promise<void>;
  approve: () => Promise<void>;
  permit: () => Promise<void>;
  needsSetupApproval: boolean;
  needsPermitSignature: boolean;
  allowedAmount: CurrencyAmount<Token>;
}

export type Allowance =
  | { state: AllowanceState.LOADING }
  | {
      state: AllowanceState.ALLOWED;
      permitSignature?: PermitSignature;
    }
  | AllowanceRequired;

export default function usePermit2Allowance(
  amount?: CurrencyAmount<Token>,
  spender?: string
): Allowance {
  const { account, chainId } = useWeb3React();
  const token = amount?.currency;

  const { tokenAllowance, isSyncing: isApprovalSyncing } = useTokenAllowance(
    token,
    account,
    PERMIT2_ADDRESS[chainId || 56]
  );
  const updateTokenAllowance = useUpdateTokenAllowance(
    amount,
    PERMIT2_ADDRESS[chainId || 56]
  );
  const isApproved = useMemo(() => {
    if (!amount || !tokenAllowance) return false;
    return tokenAllowance.greaterThan(amount) || tokenAllowance.equalTo(amount);
  }, [amount, tokenAllowance]);

  // Marks approval as loading from the time it is submitted (pending), until it has confirmed and another block synced.
  // This avoids re-prompting the user for an already-submitted but not-yet-observed approval, by marking it loading
  // until it has been re-observed.
  // It will sync immediately, because confirmation fast-forwards the block number.
  const [approvalState, setApprovalState] = useState(ApprovalState.SYNCED);
  const isApprovalLoading = approvalState !== ApprovalState.SYNCED;
  const isApprovalPending = useHasPendingApproval(
    token,
    PERMIT2_ADDRESS[chainId || 56]
  );

  useEffect(() => {
    if (isApprovalPending) {
      setApprovalState(ApprovalState.PENDING);
    } else {
      setApprovalState((state) => {
        if (state === ApprovalState.PENDING && isApprovalSyncing) {
          return ApprovalState.SYNCING;
        } else if (state === ApprovalState.SYNCING && !isApprovalSyncing) {
          return ApprovalState.SYNCED;
        }
        return state;
      });
    }
  }, [isApprovalPending, isApprovalSyncing]);

  // Signature and PermitAllowance will expire, so they should be rechecked at an interval.
  // Calculate now such that the signature will still be valid for the submitting block.
  const [now, setNow] = useState(Date.now() + AVERAGE_L1_BLOCK_TIME);
  useInterval(
    useCallback(() => setNow((Date.now() + AVERAGE_L1_BLOCK_TIME) / 1000), []),
    AVERAGE_L1_BLOCK_TIME
  );

  const [signature, setSignature] = useState<PermitSignature>();

  // Add useEffect to reset signature when amount or token changes
  useEffect(() => {
    setSignature(undefined);
  }, [amount?.toExact(), token?.address]);

  const { permitAllowance, expiration: permitExpiration } = usePermitAllowance(
    token,
    account,
    spender
  );

  const updatePermitAllowance = useUpdatePermitAllowance(amount, spender);

  const isPermitted = useMemo(() => {
    if (!amount || !permitAllowance || !permitExpiration) return false;
    return (
      (permitAllowance.greaterThan(amount) ||
        permitAllowance.equalTo(amount)) &&
      permitExpiration >= now
    );
  }, [amount, now, permitAllowance, permitExpiration]);

  const shouldRequestApproval = !(isApproved || isApprovalLoading);
  const shouldRequestPermit = !isPermitted;
  const addTransaction = useTransactionAdder();
  const approveAndPermit = useCallback(async () => {
    if (shouldRequestApproval) {
      const { response, info } = await updateTokenAllowance();
      addTransaction(response, info);
    }
    if (shouldRequestPermit) {
      const response = await updatePermitAllowance();
      if (response) {
        addTransaction(response, {
          type: TransactionType.APPROVAL,
          tokenAddress: token?.address || "",
          spender: spender || "",
        });
      }
    }
  }, [
    addTransaction,
    shouldRequestApproval,
    shouldRequestPermit,
    updatePermitAllowance,
    updateTokenAllowance,
    token?.address,
    spender,
  ]);

  const approve = useCallback(async () => {
    const { response, info } = await updateTokenAllowance();
    addTransaction(response, info);
  }, [addTransaction, updateTokenAllowance]);

  return useMemo(() => {
    if (token) {
      if (!tokenAllowance || !permitAllowance) {
        return { state: AllowanceState.LOADING };
      } else if (!isPermitted) {
        return {
          token,
          state: AllowanceState.REQUIRED,
          isApprovalLoading: false,
          approveAndPermit,
          approve,
          permit: updatePermitAllowance,
          needsSetupApproval: !isApproved,
          needsPermitSignature: shouldRequestPermit,
          isApprovalPending,
          allowedAmount: tokenAllowance,
        };
      } else if (!isApproved) {
        return {
          token,
          state: AllowanceState.REQUIRED,
          isApprovalLoading,
          approveAndPermit,
          approve,
          permit: updatePermitAllowance,
          needsSetupApproval: true,
          needsPermitSignature: shouldRequestPermit,
          isApprovalPending,
          allowedAmount: tokenAllowance,
        };
      }
    }
    return {
      token,
      state: AllowanceState.ALLOWED,
      needsSetupApproval: false,
      needsPermitSignature: false,
    };
  }, [
    approve,
    approveAndPermit,
    isApprovalLoading,
    isApproved,
    isPermitted,
    updatePermitAllowance,
    permitAllowance,
    token,
    tokenAllowance,
    shouldRequestPermit,
    isApprovalPending,
  ]);
}
