import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { FeeOptions, Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { UNIVERSAL_ROUTER_ADDRESS } from 'constants/addresses'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { trace } from 'tracing'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { PermitSignature } from './usePermitAllowance'

/** Thrown when gas estimation fails. This class of error usually requires an emulator to determine the root cause. */
class GasEstimationError extends Error {
  constructor() {
    super(t`Your swap is expected to fail.`)
  }
}

/**
 * Thrown when the user modifies the transaction in-wallet before submitting it.
 * In-wallet calldata modification nullifies any safeguards (e.g., slippage) from the interface, so we recommend reverting them immediately.
 */
class ModifiedSwapError extends Error {
  constructor() {
    super(
      t`Your swap was modified through your wallet. If this was a mistake, please cancel immediately or risk losing your funds.`
    )
  }
}

interface SwapOptions {
  slippageTolerance: Percent
  deadline?: BigNumber
  permit?: PermitSignature
  feeOptions?: FeeOptions
}

const swaprouterABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)'
];

export function useUniversalRouterSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  fiatValues: { amountIn: number | undefined; amountOut: number | undefined },
  options: SwapOptions
) {
  const { account, chainId, provider } = useWeb3React()

  return useCallback(async (): Promise<TransactionResponse> => {
    return trace(
      'swap.send',
      async ({ setTraceData, setTraceStatus, setTraceError }) => {
        try {
          if (!account) throw new Error('missing account')
          if (!chainId) throw new Error('missing chainId')
          if (!provider) throw new Error('missing provider')
          if (!trade) throw new Error('missing trade')
          setTraceData('slippageTolerance', options.slippageTolerance.toFixed(2))

      const signer = provider.getSigner();
      const swapRouterContract = new ethers.Contract(UNIVERSAL_ROUTER_ADDRESS[chainId], swaprouterABI, signer);

      const params = {
        tokenIn: trade.inputAmount.currency.wrapped.address,
        tokenOut: trade.outputAmount.currency.wrapped.address, 
        fee: (trade.routes[0].pools[0] as Pool).fee,
        recipient: account,
        amountIn: trade.inputAmount.quotient.toString(),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };
      const txD = await swapRouterContract.exactInputSingle(params);
      console.log('Transaction hash:', txD.hash);

      const receipt = await txD.wait();
      console.log('Transaction was mined in block:', receipt.blockNumber);

        return txD
      } catch (swapError: unknown) {
        if (swapError instanceof ModifiedSwapError) throw swapError

        // Cancellations are not failures, and must be accounted for as 'cancelled'.
        if (didUserReject(swapError)) setTraceStatus('cancelled')

        // GasEstimationErrors are already traced when they are thrown.
        if (!(swapError instanceof GasEstimationError)) setTraceError(swapError)

        throw new Error(swapErrorToUserReadableMessage(swapError))
      }
    },
    { tags: { is_widget: false } }
  )
}, [
  account,
  chainId,
  options.slippageTolerance,
  provider,
  trade,
])
}