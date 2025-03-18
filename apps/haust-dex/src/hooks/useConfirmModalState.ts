import { Trade } from "@uniswap/router-sdk";
import { Currency, Percent, TradeType } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import { ConfirmModalState } from "components/swap/ConfirmSwapModal";
import { PendingModalError } from "components/swap/Error";
import { NumberType } from "conedison/format";
import { Allowance, AllowanceState } from "hooks/usePermit2Allowance";
import usePrevious from "hooks/usePrevious";
import useSelectChain from "hooks/useSelectChain";
import useWrapCallback from "hooks/useWrapCallback";
import useNativeCurrency from "lib/hooks/useNativeCurrency";
import { getPriceUpdateBasisPoints } from "lib/utils/analytics";
import { useCallback, useEffect, useState, useRef } from "react";
import { InterfaceTrade } from "state/routing/types";
import { Field } from "state/swap/actions";
import { useIsTransactionConfirmed } from "state/transactions/hooks";
import invariant from "tiny-invariant";
import { formatCurrencyAmount } from "utils/formatCurrencyAmount";
import { didUserReject } from "utils/swapErrorToUserReadableMessage";
import { tradeMeaningfullyDiffers } from "utils/tradeMeaningFullyDiffer";

type PendingConfirmModalState = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
>;

export function useConfirmModalState({
  trade,
  allowedSlippage,
  onSwap,
  allowance,
  originalTrade,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined;
  originalTrade: Trade<Currency, Currency, TradeType> | undefined;
  allowedSlippage: Percent;
  onSwap: () => void;
  allowance: Allowance;
}) {
  const [currentState, setCurrentState] = useState<ConfirmModalState>(
    ConfirmModalState.REVIEWING
  );
  const [pendingSteps, setPendingSteps] = useState<PendingConfirmModalState[]>(
    []
  );
  const [approvalError, setApprovalError] = useState<PendingModalError>();
  const [wrapTxHash, setWrapTxHash] = useState<string>();

  const doesTradeDiffer =
    originalTrade && trade && tradeMeaningfullyDiffers(trade, originalTrade);

  const catchUserReject = useCallback(
    async (e: any, errorType: PendingModalError) => {
      if (didUserReject(e)) {
        setCurrentState(ConfirmModalState.REVIEWING);
        return;
      }
      setApprovalError(errorType);
    },
    []
  );

  const performStep = useCallback(
    async (step: ConfirmModalState) => {
      setCurrentState(step);

      switch (step) {
        case ConfirmModalState.APPROVING_TOKEN:
          if (allowance.state === AllowanceState.REQUIRED) {
            try {
              await allowance.approve();
            } catch (e) {
              console.log("catchUserReject", e);
              catchUserReject(e, PendingModalError.TOKEN_APPROVAL_ERROR);
            }
          }
          break;
        case ConfirmModalState.PERMITTING:
          if (allowance.state === AllowanceState.REQUIRED) {
            try {
              await allowance.permit();
            } catch (e) {
              console.log("catchUserReject", e);
              catchUserReject(e, PendingModalError.TOKEN_APPROVAL_ERROR);
            }
          }
          break;
        case ConfirmModalState.PENDING_CONFIRMATION:
          try {
            onSwap();
          } catch (e) {
            catchUserReject(e, PendingModalError.CONFIRMATION_ERROR);
          }
          break;
      }
    },
    [allowance, catchUserReject, onSwap]
  );

  const generateRequiredSteps = useCallback(() => {
    const steps: PendingConfirmModalState[] = [];

    if (
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsSetupApproval
    ) {
      steps.push(ConfirmModalState.APPROVING_TOKEN);
    }
    if (
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsPermitSignature
    ) {
      steps.push(ConfirmModalState.PERMITTING);
    }
    steps.push(ConfirmModalState.PENDING_CONFIRMATION);
    return steps;
  }, [allowance]);

  const startSwapFlow = useCallback(() => {
    const steps = generateRequiredSteps();
    setPendingSteps(steps);
    if (steps.length > 0) {
      performStep(steps[0]);
    }
  }, [generateRequiredSteps, performStep]);

  useEffect(() => {
    if (currentState === ConfirmModalState.REVIEWING) return;
    if (
      currentState === ConfirmModalState.APPROVING_TOKEN &&
      allowance.state === AllowanceState.REQUIRED &&
      !allowance.needsSetupApproval &&
      !doesTradeDiffer
    ) {
      performStep(ConfirmModalState.PERMITTING);
    }
    if (
      currentState === ConfirmModalState.PERMITTING &&
      allowance.state === AllowanceState.ALLOWED &&
      !doesTradeDiffer
    ) {
      performStep(ConfirmModalState.PENDING_CONFIRMATION);
    }
  }, [currentState, allowance.state, doesTradeDiffer, performStep]);

  const resetToReviewScreen = useCallback(() => {
    setCurrentState(ConfirmModalState.REVIEWING);
  }, []);

  const onCancel = useCallback(() => {
    setCurrentState(ConfirmModalState.REVIEWING);
    setApprovalError(undefined);
  }, []);

  return {
    startSwapFlow,
    onCancel,
    resetToReviewScreen,
    currentState,
    pendingSteps,
    approvalError,
    wrapTxHash,
  };
}
