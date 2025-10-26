import { useSingleCallResult } from "lib/hooks/multicall";
import { useMemo } from "react";

import { useUniswapV3StakerContract } from "./useContract";

interface UseV3IncentivesCreatedResults {
  loading: boolean;
  incentiveEvents: IncentiveCreatedEvent[] | undefined;
}

interface IncentiveCreatedEvent {
  rewardToken: string;
  pool: string;
  startTime: number;
  endTime: number;
  reward: string;
  tokenIds: number[];
  isLocked?: boolean;
}

export function useV3Incentive(): UseV3IncentivesCreatedResults {
  const staker = useUniswapV3StakerContract();
  const { loading, result: activeIncentives } = useSingleCallResult(
    staker,
    "getAllIncentivesWithTokens",
    [],
    {
      blocksPerFetch: 1,
    }
  );

  const incentiveEvents = useMemo(() => {
    if (!activeIncentives?.[0]?.[0]) return [];
    return activeIncentives[0].map((incentiveData: any[]) => {
      const [incentive, tokenIdsData, isLocked] = incentiveData;
      return {
        rewardToken: incentive[0],
        pool: incentive[1],
        startTime: Number(incentive[2]),
        endTime: Number(incentive[3]),
        reward: incentive[4],
        tokenIds: tokenIdsData.map(
          (tokenId: { _hex: string; _isBigNumber: boolean }) => Number(tokenId)
        ),
        isLocked,
      };
    });
  }, [activeIncentives]);

  console.log("incentiveEvents", incentiveEvents);
  return {
    loading,
    incentiveEvents,
  };
}
