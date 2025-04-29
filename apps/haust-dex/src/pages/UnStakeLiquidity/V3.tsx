import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
// import { sendEvent } from 'components/analytics'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import Card, { DarkCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Icons/LoadingSpinner'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { RowBetween, RowFixed } from 'components/Row'
import { isSupportedChain } from 'constants/chains'
import { useToken } from 'hooks/Tokens'
import { useUniswapV3StakerContract } from 'hooks/useContract'
import { usePool } from 'hooks/usePools'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import { useV3Incentive } from 'hooks/useV3Incentive'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { NFT, NFTContainer, PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { useCallback, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { ThemedText } from 'theme'
import { unwrappedToken } from 'utils/unwrappedToken'

import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import AppBody from '../AppBody'
import { RewardInfo } from './RewardInfo'
import { Wrapper } from './styled'

const DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

// redirect invalid tokenIds
export default function UnStakeLiquidityV3() {
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
  const navigate = useNavigate()
  const { account, chainId, provider } = useWeb3React()
  const { position: positionData } = useV3PositionFromTokenId(tokenId)
  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionData || {}

  const {incentiveEvents, loading: incentivesLoading} = useV3Incentive()
  
  const stakedInfo = incentiveEvents?.find(incentive => 
    incentive.tokenIds?.includes(Number(tokenId))
  )
  
  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  
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
  const staker = useUniswapV3StakerContract()
  const claimRewards = useCallback(async () => {
    setAttemptingTxn(true)
    if (!account || !chainId || !provider || !tokenId || !stakedInfo || !staker) {
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

      // Encode function calls for multicall
      const unstakeData = staker.interface.encodeFunctionData("unstakeToken", [
        incentiveKey,
        tokenId.toString()
      ])
      
      const claimRewardData = staker.interface.encodeFunctionData("claimReward", [
        stakedInfo.rewardToken,
        account,
        0 // Claim all available rewards
      ])

      const restakeData = staker.interface.encodeFunctionData("stakeToken", [
        incentiveKey,
        tokenId.toString()
      ])

      const calls = [unstakeData, claimRewardData, restakeData]

      // Execute multicall transaction
      const tx = await staker.multicall(calls)
      setTxnHash(tx.hash)
      
      addTransaction(tx, {
        type: TransactionType.CLAIM_STAKING_REWARD,
        tokenId: tokenId.toString(),
      })

      await tx.wait()
      setAttemptingTxn(false)
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      setAttemptingTxn(false)
    }
  }, [account, chainId, provider, tokenId, stakedInfo, staker, addTransaction])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setAttemptingTxn(false)
    setTxnHash('')
    navigate('/pools')
  }, [])

  const pendingText = (
    <div>
      Claiming rewards for {tokenId.toString()}
    </div>
  )

  function modalHeader() {
    return (
      <AutoColumn gap="sm" style={{ padding: '16px' }}>
        {stakedInfo && (
          <RewardInfo tokenId={tokenId.toString()} stakedInfo={stakedInfo} />
        )}
        <ButtonPrimary mt="16px" onClick={claimRewards}>
          <Trans>Claim rewards</Trans>
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
            title='Claim rewards'
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
          />
        )}
        pendingText={pendingText}
      />
      <AppBody $maxWidth="unset">
        <AddRemoveTabs
          staked={false}
          creating={false}
          adding={false}
          positionID={tokenId.toString()}
          hideSettings={true}
          defaultSlippage={DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE}
          unstake={true}
        />
        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">                
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
              {tokenId && stakedInfo && (
                <RewardInfo tokenId={tokenId.toString()} stakedInfo={stakedInfo} />
              )}

              <div style={{ display: 'flex' }}>
                <AutoColumn gap="md" style={{ flex: '1' }}>
                  <ButtonConfirmed
                    confirmed={false}
                    disabled={removed || !position?.amount0}
                    onClick={() => setShowConfirm(true)}
                  >
                    <Trans>Claim rewards</Trans>
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
