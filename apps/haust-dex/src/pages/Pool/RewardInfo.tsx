/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useV3StakingRewardInfo } from 'hooks/useV3StakingRewardInfo'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { SmallButtonPrimary } from '../../components/Button'
import { colors } from 'theme/colors'

interface V3StakingRewardInfo {
  rewardToken: string
  pool: string
  startTime: number
  endTime: number
  reward: string
  isLocked?: boolean
}

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <ThemedText.DeprecatedLabel {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

export const ResponsiveRow = styled(RowBetween)`
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%;
  }
`

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return 'Claim rewards'
  
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

export function RewardInfo({
  tokenId, 
  stakedInfo,
}: {
  tokenId: string, 
  stakedInfo: V3StakingRewardInfo,
}) {
  console.log("stakedInfo", stakedInfo);
  const { rewardInfo: rewardAmount } = useV3StakingRewardInfo(
    stakedInfo!,
    tokenId!
  )
  console.log("rewardAmount", rewardAmount);
  const rewardToken = useNativeCurrency()
  const rewardInfo = {
    rewardToken,
    rewardAmount
  }

  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000)
      const endTime = stakedInfo.endTime
      const secondsRemaining = endTime - now
      
      setTimeRemaining(formatTime(secondsRemaining))
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [stakedInfo.endTime])

  const parsedRewardAmount = tryParseCurrencyAmount(rewardAmount?.reward.toString(), rewardToken)
  const fiatValue = useUSDPrice(parsedRewardAmount)

  return (
        <DarkCard>
          <AutoColumn gap="md" style={{ width: '100%' }}>
            <AutoColumn gap="md">
              <Label>
                Staking rewards
              </Label>
              <LightCard padding="12px 16px">
                <AutoColumn gap="md">
                  <RowBetween>
                    <RowFixed>
                      <CurrencyLogo
                        currency={rewardInfo?.rewardToken}
                        size="20px"
                        style={{ marginRight: '0.5rem' }}
                      />
                      <ThemedText.DeprecatedMain>{rewardInfo?.rewardToken?.symbol}</ThemedText.DeprecatedMain>
                    </RowFixed>
                    <RowFixed>
                      <ThemedText.DeprecatedMain>
                        {rewardInfo?.rewardAmount?.reward 
                          ? Number(rewardInfo.rewardAmount.reward) < 0.01
                            ? '<0.01'
                            : Number(rewardInfo.rewardAmount.reward).toFixed(2)
                          : '-'} {fiatValue?.data 
                              ? Number(fiatValue.data) < 0.01
                                ? '(<$0.01)'
                                : `($${fiatValue.data.toFixed(2)})`
                              : ''}
                      </ThemedText.DeprecatedMain>
                    </RowFixed>
                  </RowBetween>
                </AutoColumn>
              </LightCard>
              {(!rewardInfo?.rewardAmount?.reward || Number(rewardInfo.rewardAmount.reward) < 0.00000001) ? (
                <SmallButtonPrimary
                  padding="6px 8px"
                  width="fit-content"
                  $borderRadius="12px"
                  style={{ opacity: 0.5 }}
                  disabled
                >
                  Claim rewards
                </SmallButtonPrimary>
              ) : stakedInfo?.isLocked && stakedInfo?.endTime > Math.floor(Date.now() / 1000) ? (
                <SmallButtonPrimary
                  padding="6px 8px"
                  width="fit-content"
                  $borderRadius="12px"
                  style={{ opacity: 0.3, color: colors.primaryBase, backgroundColor: colors.primaryDark }}
                  disabled
                >
                  {timeRemaining}
                </SmallButtonPrimary>
              ) : (
                <SmallButtonPrimary
                  as={Link}
                  to={`/claim/${tokenId}`}
                  padding="6px 8px"
                  width="fit-content"
                  $borderRadius="12px"
                >
                  Claim rewards
                </SmallButtonPrimary>
              )}
            </AutoColumn>
          </AutoColumn>
        </DarkCard>
  )
}
