import { BigNumber } from '@ethersproject/bignumber'
import { Percent } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
// import { sendEvent } from 'components/analytics'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import Card, { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { RowBetween, RowFixed } from 'components/Row'
import { isSupportedChain } from 'constants/chains'
import { ethers } from 'ethers'
import { useToken } from 'hooks/Tokens'
import { useUniswapV3StakerContract, useV3NFTPositionManagerContract } from 'hooks/useContract'
import { usePool } from 'hooks/usePools'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import { useV3Incentive } from 'hooks/useV3Incentive'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { NFT, NFTContainer, PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { useCallback, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { ThemedText } from 'theme'
import { unwrappedToken } from 'utils/unwrappedToken'

import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import AppBody from '../AppBody'
import { Wrapper } from './styled'
import { RewardInfo } from 'pages/UnStakeLiquidity/RewardInfo'

const DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

// redirect invalid tokenIds
export default function StakeLiquidityV3() {
  const { chainId } = useWeb3React()
  const { tokenId } = useParams<{ tokenId: string }>()
  const location = useLocation()
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Navigate to={{ ...location, pathname: '/pools' }} replace />
  }

  if (isSupportedChain(chainId)) {
    return <Remove tokenId={parsedTokenId} />
  } else {
    return <PositionPageUnsupportedContent />
  }
}
function Remove({ tokenId }: { tokenId: BigNumber }) {
  const staker = useUniswapV3StakerContract()
  const navigate = useNavigate()
  const { position: positionData } = useV3PositionFromTokenId(tokenId)
  const { account, chainId, provider } = useWeb3React()

  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionData || {}

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const [poolState, pool, poolAddress] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  // Add metadata hook
  const metadata = usePositionTokenURI(tokenId)

  const removed = liquidity?.eq(0)

  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false

  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const {incentiveEvents, loading: incentiveLoading } = useV3Incentive()
  const stakedInfo = incentiveEvents?.find(incentive => 
    incentive.tokenIds?.includes(Number(tokenId))
  )
  const isPositionStaked = !!stakedInfo

  const poolIncentive = useMemo(() => {
    if (!incentiveEvents?.length || !token0 || !token1 || !feeAmount) return null;
    // Find matching active incentive for this pool
    const now = Math.floor(Date.now() / 1000);
    return incentiveEvents.find(incentive => 
      incentive.pool.toLowerCase() === poolAddress?.toLowerCase() && 
      Number(incentive.endTime) > now
    );
  }, [feeAmount, incentiveEvents, poolAddress, token0, token1]);

  const stake = useCallback(async () => {
    setAttemptingTxn(true)
    if (!positionManager || !account || !chainId || !provider || !tokenId || !poolIncentive || !staker) {
      return
    }

    try {
      const stakerAddress = staker?.address
      const incentiveKey = [
        poolIncentive.rewardToken,
        poolIncentive.pool,
        poolIncentive.startTime.toString(),
        poolIncentive.endTime.toString(),
        poolIncentive.reward
      ]

      const data = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint256", "uint256", "address"],
        incentiveKey
      )

      const tx = await positionManager.connect(provider.getSigner())
        ['safeTransferFrom(address,address,uint256,bytes)'](
          account,
          stakerAddress,
          tokenId.toString(),
          data
        )

      
      addTransaction(tx, {
        type: TransactionType.STAKE_LIQUIDITY_V3,
        tokenId: tokenId.toString(),
        token0Id: token0Address ?? '',
        token1Id: token1Address ?? '',
      })
      
      setTxnHash(tx.hash)
      setAttemptingTxn(false)

    } catch (error) {
      setAttemptingTxn(false)
      console.error('Failed to stake position:', error)
    }
  }, [positionManager, account, chainId, provider, tokenId, poolIncentive, staker, addTransaction, token0Address, token1Address])

  const unstake = useCallback(async () => {
    setAttemptingTxn(true)
    if (!positionManager || !account || !chainId || !provider || !tokenId || !poolIncentive || !staker || !stakedInfo) {
      return
    }

    try {
      const incentiveKey = {
        rewardToken: stakedInfo.rewardToken,
        pool: stakedInfo.pool,
        startTime: stakedInfo.startTime,
        endTime: stakedInfo.endTime,
        refundee: stakedInfo.reward
      }

      const unstakeData = staker.interface.encodeFunctionData("unstakeToken", [
        incentiveKey,
        tokenId.toString()
      ])
      
      const claimRewardData = staker.interface.encodeFunctionData("claimReward", [
        stakedInfo.rewardToken,
        account,
        0 // Claim all available rewards
      ])

      
      const withdrawData = staker.interface.encodeFunctionData("withdrawToken", [
        tokenId.toString(),
        account,
        '0x'
      ])

      const calls = [unstakeData, claimRewardData, withdrawData]

      // Execute multicall transaction
      const tx = await staker.multicall(calls)
      
      addTransaction(tx, {
        type: TransactionType.UNSTAKE_LIQUIDITY_V3,
        tokenId: tokenId.toString(),
        token0Id: token0Address ?? '',
        token1Id: token1Address ?? '',
      })
      
      setTxnHash(tx.hash)
      setAttemptingTxn(false)

    } catch (error) {
      setAttemptingTxn(false)
      console.error('Failed to stake position:', error)
    }
  }, [positionManager, account, chainId, provider, tokenId, poolIncentive, staker, stakedInfo, addTransaction, token0Address, token1Address])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setAttemptingTxn(false)
    setTxnHash('')
    navigate(`/pools/${tokenId}`)
  }, [])

  const pendingText = (
    <div>
      {isPositionStaked ? 'Unstaking' : 'Staking'} {position?.amount0.toSignificant(6)} {token0?.symbol} and{' '}
      {position?.amount1.toSignificant(6)} {token1?.symbol}
    </div>
  )


  function modalHeader() {
    return (
      <AutoColumn gap="sm" style={{ padding: '16px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
            {token0?.symbol}:
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft="6px">
              {position?.amount0.toSignificant(6)}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={token0} />
          </RowFixed>
        </RowBetween>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
              {token1?.symbol}:
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft="6px">
              {position?.amount1.toSignificant(6)}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={token1} />
          </RowFixed>
        </RowBetween>
        <ButtonPrimary mt="16px" onClick={isPositionStaked ? unstake : stake}>
            {isPositionStaked ? 'Unstake' : 'Stake'}
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  return (
    <AutoColumn>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash ?? ''}
        content={() => (
          <ConfirmationModalContent
            title={isPositionStaked ? 'Unstake Liquidity' : 'Stake Liquidity'}
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
          />
        )}
        pendingText={pendingText}
      />
      <AppBody $maxWidth="unset">
        <AddRemoveTabs
          staked={true}
          creating={false}
          adding={false}
          positionID={tokenId.toString()}
          hideSettings={true}
          defaultSlippage={DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE}
        />
        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">                
                {/* <AutoColumn gap="sm" style={{ width: '100%', height: '100%' }}>
                  <DarkCard>
                    <AutoColumn gap="md">
                      <Label>
                        <Trans>Position Details</Trans>
                      </Label>
                      <LightCard padding="12px 16px">
                        <AutoColumn gap="md">
                          <RowBetween>
                            <ThemedText.DeprecatedMain>
                              <Trans>Token Amount 0:</Trans>
                            </ThemedText.DeprecatedMain>
                            <ThemedText.DeprecatedMain>
                              {position.amount0.toSignificant(6)}
                            </ThemedText.DeprecatedMain>
                          </RowBetween>
                          <RowBetween>
                            <ThemedText.DeprecatedMain>
                              <Trans>Token Amount 1:</Trans>
                            </ThemedText.DeprecatedMain>
                            <ThemedText.DeprecatedMain>
                              {position.amount1.toSignificant(6)}
                            </ThemedText.DeprecatedMain>
                          </RowBetween>
                        </AutoColumn>
                      </LightCard>
                    </AutoColumn>
                  </DarkCard>
                </AutoColumn> */}
              <RowBetween>
                <RowFixed>
                  <DoubleCurrencyLogo
                    currency0={currency0}
                    currency1={currency1}
                    size={20}
                    margin={true}
                  />
                  <ThemedText.DeprecatedLabel
                    ml="10px"
                    fontSize="20px"
                  >{`${currency0?.symbol}/${currency1?.symbol}`}</ThemedText.DeprecatedLabel>
                </RowFixed>
                <RangeBadge removed={removed} inRange={inRange} />
              </RowBetween>
              <NFTContainer>
                  {'result' in metadata ? (
                    <Card
                      width="100%"
                      height="100%"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        justifyContent: 'space-around',
                      }}
                    >
                      <NFT image={metadata.result.image} height={400} />
                    </Card>
                  ) : (
                    <DarkCard width="100%" height="100%">
                      <Loader />
                    </DarkCard>
                  )}
                </NFTContainer>
              <LightCard>
                <AutoColumn gap="md">
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      {currency0?.symbol}:
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft="6px">
                        {position?.amount0.toSignificant(6)}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency0} />
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      {currency1?.symbol}:
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft="6px">
                        {position?.amount1.toSignificant(6)}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
                    </RowFixed>
                  </RowBetween>
                </AutoColumn>
              </LightCard>
              {stakedInfo && (
                <LightCard>
                  <AutoColumn gap="sm">
                    <ThemedText.SubHeader>
                      Available rewards for unstaking:
                    </ThemedText.SubHeader>
                    <RewardInfo tokenId={tokenId.toString()} stakedInfo={stakedInfo} />
                  </AutoColumn>
                </LightCard>
              )}

              <div style={{ display: 'flex' }}>
                <AutoColumn gap="md" style={{ flex: '1' }}>
                  <ButtonConfirmed
                    confirmed={false}
                    disabled={removed || !position?.amount0}
                    onClick={() => setShowConfirm(true)}
                  >
                    {isPositionStaked ? 'Unstake' : 'Stake'}
                  </ButtonConfirmed>
                </AutoColumn>
              </div>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Wrapper>
      </AppBody>
    </AutoColumn>
  )
}
