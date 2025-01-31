import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import useBlockNumber from "lib/hooks/useBlockNumber";
import multicall from "lib/state/multicall";
import { SkipFirst } from "types/tuple";

export type { CallStateResult } from "redux-multicall"; // re-export for convenience
export { NEVER_RELOAD } from "redux-multicall"; // re-export for convenience

// Create wrappers for hooks so consumers don't need to get latest block themselves

type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<
  Parameters<T>,
  2
>;

export function useMultipleContractSingleData(
  ...args: SkipFirstTwoParams<
    typeof multicall.hooks.useMultipleContractSingleData
  >
) {
  const { chainId, latestBlock } = useCallContext();
  return multicall.hooks.useMultipleContractSingleData(
    chainId,
    latestBlock,
    ...args
  );
}

export function useSingleCallResult(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>
) {
  const { chainId, latestBlock } = useCallContext();
  return multicall.hooks.useSingleCallResult(chainId, latestBlock, ...args);
}

export function useSingleContractMultipleData(
  ...args: SkipFirstTwoParams<
    typeof multicall.hooks.useSingleContractMultipleData
  >
) {
  const { chainId, latestBlock } = useCallContext();
  return multicall.hooks.useSingleContractMultipleData(
    chainId,
    latestBlock,
    ...args
  );
}

export function useSingleContractWithCallData(
  ...args: SkipFirstTwoParams<
    typeof multicall.hooks.useSingleContractWithCallData
  >
) {
  const { chainId, latestBlock } = useCallContext();
  return multicall.hooks.useSingleContractWithCallData(
    chainId,
    latestBlock,
    ...args
  );
}

function useCallContext() {
  const { chainId } = useWeb3React();
  const latestBlock = useBlockNumber();
  const [pollBlock, setPollBlock] = useState<number | undefined>(latestBlock);

  useEffect(() => {
    const interval = setInterval(() => {
      if (latestBlock) {
        setPollBlock(latestBlock + 1);
        setTimeout(() => setPollBlock(latestBlock), 100);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [latestBlock]);

  return { chainId, latestBlock: pollBlock ?? latestBlock };
}
