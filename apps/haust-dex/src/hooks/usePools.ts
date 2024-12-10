import { Interface} from '@ethersproject/abi'
import { BigintIsh, Currency, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { IUniswapV3PoolStateABI } from 'sdks/v3-core'

import {IUniswapV3PoolStateInterface} from '../types/v3/IUniswapV3PoolState'
import { ethers } from 'ethers'

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateABI) as IUniswapV3PoolStateInterface

// Classes are expensive to instantiate, so this caches the recently instantiated pools.
// This avoids re-instantiating pools as the other pools in the same request are loaded.
class PoolCache {
  // Evict after 128 entries. Empirically, a swap uses 64 entries.
  private static MAX_ENTRIES = 128

  // These are FIFOs, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = []
  private static addresses: { key: string; address: string }[] = []

  static async getPoolAddress(poolDeployerAddress: string, initCodeHash: string, tokenA: Token, tokenB: Token, fee: FeeAmount): Promise<string> {
    if (this.addresses.length > this.MAX_ENTRIES) {
      this.addresses = this.addresses.slice(0, this.MAX_ENTRIES / 2)
    }

    const { address: addressA } = tokenA
    const { address: addressB } = tokenB
    const key = `${poolDeployerAddress}:${addressA}:${addressB}:${fee.toString()}`
    const found = this.addresses.find((address) => address.key === key)
    if (found) return found.address

    // const address = {
    //   key,
    //   address: computePoolAddress({
    //     factoryAddress: poolDeployerAddress,
    //     tokenA,
    //     tokenB,
    //     fee,
    //     initCodeHashManualOverride: initCodeHash,
    //   }),
    // }

    const UNISWAP_V3_FACTORY_ADDRESS =
    '0xE270068748C499EC4E88fc609904e13C24A6C67B'; // адрес Factory для Uniswap V3

  // 2. ABI контракта (минимальный для метода getPool)
  const UNISWAP_V3_FACTORY_ABI = [
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)',
  ];

  // 3. Провайдер (замените на ваш)
  const provider = new ethers.providers.JsonRpcProvider(
    'https://rpc-test.haust.network'
  );

  // 4. Создайте экземпляр контракта
  const factoryContract = new ethers.Contract(
    UNISWAP_V3_FACTORY_ADDRESS,
    UNISWAP_V3_FACTORY_ABI,
    provider
  );

  const poolAddress = factoryContract.getPool(tokenA.address, tokenB.address, 500)
  
    this.addresses.unshift({key, address: poolAddress})
    return poolAddress

    // this.addresses.unshift(address)
    // return address.address
  }

  static getPool(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
    sqrtPriceX96: BigintIsh,
    liquidity: BigintIsh,
    tick: number
  ): Pool {
    if (this.pools.length > this.MAX_ENTRIES) {
      this.pools = this.pools.slice(0, this.MAX_ENTRIES / 2)
    }

    const found = this.pools.find(
      (pool) =>
        pool.token0 === tokenA &&
        pool.token1 === tokenB &&
        pool.fee === fee &&
        JSBI.EQ(pool.sqrtRatioX96, sqrtPriceX96) &&
        JSBI.EQ(pool.liquidity, liquidity) &&
        pool.tickCurrent === tick
    )
    if (found) return found

    const pool = new Pool(tokenA, tokenB, fee, sqrtPriceX96, liquidity, tick)
    this.pools.unshift(pool)
    return pool
  }
}

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

const poolsAndFees = [{
  pair: 'WHAUST/USDT',
  pool: '0x97f2781495be61d6D5A438d317995d67c78353EE',
  fee: 500
}, {
  pair: 'WHAUST/USDC',
  pool: '0xE3Ec72CC9969B0e9eFbf87BDF5A376a43280E2d0',
  fee: 15000
},{
  pair: 'USDT/USDC',
  pool: '0x700d39cd228e79bb5f5cb15bd4260e339050ce30',
  fee: 3000
},{
  pair: 'WETH/USDT',
  pool: '0x6561098feedbe328c6d90f7be881f6721b81ee10',
  fee: 15000
},
{
  pair: 'WBTC/USDC',
  pool: '0x1efca24da60a79136afe215d7947a5d5f63fdb66',
  fee: 15000
}]

function getPoolInfo(tokenA: Currency | undefined, tokenB: Currency | undefined) {
  if (!tokenA || !tokenB) return null

  const symbolA = tokenA?.symbol
  const symbolB = tokenB?.symbol
  
  const pairFormat1 = `${symbolA}/${symbolB}`
  const pairFormat2 = `${symbolB}/${symbolA}`
  const poolInfo = poolsAndFees.find(
    (item) => item.pair === pairFormat1 || item.pair === pairFormat2
  )

  return poolInfo
}

export function usePools(
  poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]
): [PoolState, Pool | null][] {
  const { chainId } = useWeb3React()

  const poolTokens: ([Token, Token, FeeAmount] | undefined)[] = useMemo(() => {
    if (!chainId) return new Array(poolKeys.length)

    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (currencyA && currencyB && feeAmount) {
        const tokenA = currencyA.wrapped
        const tokenB = currencyB.wrapped
        if (tokenA.equals(tokenB)) return undefined

        return tokenA.sortsBefore(tokenB) ? [tokenA, tokenB, feeAmount] : [tokenB, tokenA, feeAmount]
      }
      return undefined
    })
  }, [chainId, poolKeys])

  const poolAddresses: (string | undefined)[] = useMemo(() => {
    return poolKeys.map(([currencyA, currencyB]) => {
      const poolInfo = getPoolInfo(currencyA, currencyB)
      return poolInfo?.pool
    })
  }, [poolKeys])

  const slot0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'slot0')
  const liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'liquidity')

  return useMemo(() => {
    const index = 0;
    const tokens = poolTokens[index];
    if (!tokens) return [[PoolState.INVALID, null]];

    const poolInfo = getPoolInfo(poolKeys[index][0], poolKeys[index][1])
    if (!poolInfo) return [[PoolState.INVALID, null]];

    const [token0, token1] = tokens;
    const fee = poolInfo.fee;

    if (!slot0s[index]) return [[PoolState.INVALID, null]];
    const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index];

    if (!liquidities[index]) return [[PoolState.INVALID, null]];
    const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities[index];

    if (!tokens || !slot0Valid || !liquidityValid) return [[PoolState.INVALID, null]];
    if (slot0Loading || liquidityLoading) return [[PoolState.LOADING, null]];
    if (!slot0 || !liquidity) return [[PoolState.NOT_EXISTS, null]];
    if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [[PoolState.NOT_EXISTS, null]];

    try {
      const pool = PoolCache.getPool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick);      
      return [[PoolState.EXISTS, pool]];
    } catch (error) {
      console.error('Error when constructing the pool', error);
      return [[PoolState.NOT_EXISTS, null]];
    }
  }, [liquidities, slot0s, poolTokens])
}

export function usePool(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): [PoolState, Pool | null] {
  const poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = useMemo(
    () => [[currencyA, currencyB, feeAmount]],
    [currencyA, currencyB, feeAmount]
  )

  return usePools(poolKeys)[0]
}
