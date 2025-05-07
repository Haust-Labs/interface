import { BigNumber } from "@ethersproject/bignumber";
import {
  CallStateResult,
  useSingleCallResult,
  useSingleContractMultipleData,
} from "lib/hooks/multicall";
import { useMemo } from "react";

import {
  useUniswapV3StakerContract,
  useV3NFTPositionManagerContract,
} from "./useContract";

interface UseV3PositionsResults {
  loading: boolean;
  tokenIds: number[] | undefined;
}

export function useV3StakedNftTokenIds(
  account: string | null | undefined
): UseV3PositionsResults {
  const staker = useUniswapV3StakerContract(true);
  const positionManager = useV3NFTPositionManagerContract();

  const {
    loading: stakedPositionsResultLoading,
    result: stakedPositionsResult,
  } = useSingleCallResult(
    staker,
    "getAllUsersStakedNFTs",
    [account ?? undefined],
    {
      blocksPerFetch: 1,
    }
  );

  const tokenIds = useMemo(() => {
    if (!account || !stakedPositionsResult || !stakedPositionsResult[0])
      return [];

    const tokenIdsArray = stakedPositionsResult[0];
    return tokenIdsArray.map((id: any) => Number(id));
  }, [account, stakedPositionsResult]);


  const { loading: balanceLoading, result: balanceResult } =
    useSingleCallResult(positionManager, "balanceOf", [account ?? undefined], {
      blocksPerFetch: 1,
    });

  // we don't expect any account balance to ever exceed the bounds of max safe int
  const accountBalance: number | undefined = balanceResult?.[0]?.toNumber();

  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests = [];
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i]);
      }
      return tokenRequests;
    }
    return [];
  }, [account, accountBalance]);

  const tokenIdResults = useSingleContractMultipleData(
    positionManager,
    "tokenOfOwnerByIndex",
    tokenIdsArgs,
    {
      blocksPerFetch: 1,
    }
  );
  const someTokenIdsLoading = useMemo(
    () => tokenIdResults.some(({ loading }) => loading),
    [tokenIdResults]
  );

  const positionTokenIds = useMemo(() => {
    if (account) {
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is CallStateResult => !!result)
        .map((result) => BigNumber.from(result[0]));
    }
    return [];
  }, [account, tokenIdResults]);

  return {
    loading:
      stakedPositionsResultLoading || someTokenIdsLoading || balanceLoading,
    tokenIds: [...tokenIds, ...positionTokenIds.map((id) => Number(id))],
  };
}
