import { useSingleCallResult } from "lib/hooks/multicall";
import { useMemo } from "react";

import { useUniswapV3StakerContract } from "./useContract";

interface UseV3StakingRewardInfoResults {
  loading: boolean;
  rewardInfo: StakingRewardInfo | undefined;
  globalLock: boolean;
}

interface StakingRewardInfo {
  reward: number;
}

export interface V3StakingRewardInfo {
  rewardToken: string;
  pool: string;
  startTime: number;
  endTime: number;
  reward: string;
}

export function useV3StakingRewardInfo(
  incentive: V3StakingRewardInfo,
  tokenId: string
): UseV3StakingRewardInfoResults {
  const staker = useUniswapV3StakerContract();
  console.log('staker', incentive, tokenId)
  const { loading, result: activeIncentives } = useSingleCallResult(
    staker,
    "getRewardInfo",
    [
      [
        incentive.rewardToken,
        incentive.pool,
        incentive.startTime,
        incentive.endTime,
        incentive.reward,
      ],
      tokenId,
    ]
  );

  const { loading: globalLockLoading, result: globalLock } =
    useSingleCallResult(staker, "globalLock");

  const rewardInfo = useMemo(() => {
    if (!activeIncentives) return undefined;

    return {
      reward: Number(activeIncentives.reward?._hex) / 1e18,
    };
  }, [activeIncentives]);

  return {
    loading: loading || globalLockLoading,
    rewardInfo,
    globalLock: globalLock?.[0] ?? false,
  };
}
