/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { useV3StakingRewardInfo, V3StakingRewardInfo } from 'hooks/useV3StakingRewardInfo'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { SmallButtonPrimary } from '../../components/Button'

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

export function RewardInfo({tokenId, stakedInfo}: {tokenId: string, stakedInfo: V3StakingRewardInfo}) {
  const { rewardInfo: rewardAmount } = useV3StakingRewardInfo(
    stakedInfo!,
    tokenId!
  )
  const rewardToken = useNativeCurrency()
  const rewardInfo = {
    rewardToken,
    rewardAmount
  }

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
                          : '-'}
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
              ) : (
                <SmallButtonPrimary
                  as={Link}
                  to={`/unstake/${tokenId}`}
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
