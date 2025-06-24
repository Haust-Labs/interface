import { BigNumber } from '@ethersproject/bignumber'
import { useV3StakingRewardInfo } from 'hooks/useV3StakingRewardInfo'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'


const StakingLabel = styled(ThemedText.UtilityBadge)`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin-top: 2px !important;
  font-size: 12px !important;
  background-color: ${({ theme }) => theme.accentActionSoft};
  color: ${({ theme }) => theme.white};
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 4px !important;
  font-weight: 500;
`

interface PositionListItemProps {
  incentive: {
    rewardToken: string;
    pool: string;
    startTime: number;
    endTime: number;
    reward: string;
    isLocked?: boolean;
  }
  tokenId: BigNumber
}

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return 'Staking Rewards Available'
  
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const pad = (num: number): string => num.toString().padStart(2, '0')
  
  if (days > 0) {
    return `Rewards available in ${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
  }
  return `Rewards available in ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
}

export default function RewardLabel({
  incentive,
  tokenId,
}: PositionListItemProps) {
  const {rewardInfo} = useV3StakingRewardInfo(
    incentive,
    tokenId.toString()
  )
  
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000)
      const endTime = incentive.endTime
      const secondsRemaining = endTime - now
      
      setTimeRemaining(formatTime(secondsRemaining))
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [incentive.endTime])

  if (!rewardInfo || rewardInfo.reward <= 0.00000001) {
    return null
  }

  if (rewardInfo && incentive?.isLocked) {
    return (
      <StakingLabel>
        {timeRemaining}
      </StakingLabel>
    )
  }

  return (
    <StakingLabel>
      Staking Rewards Available
    </StakingLabel>
  )
}
