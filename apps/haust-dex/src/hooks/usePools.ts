import { Interface} from '@ethersproject/abi'
import { BigintIsh, Currency, Token } from '@uniswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { IUniswapV3PoolStateABI } from 'sdks/v3-core'

import {IUniswapV3PoolStateInterface} from '../types/v3/IUniswapV3PoolState'
import { TOKEN_ADDRESSES } from 'constants/tokens'

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateABI) as IUniswapV3PoolStateInterface

export enum FeeAmount {
  LOWEST = 500,
  LOW = 3000,
  MEDIUM = 10000,
  HIGH = 15000
}

// Classes are expensive to instantiate, so this caches the recently instantiated pools.
// This avoids re-instantiating pools as the other pools in the same request are loaded.
class PoolCache {
  // Evict after 128 entries. Empirically, a swap uses 64 entries.
  private static MAX_ENTRIES = 128

  // These are FIFOs, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = []


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

interface PoolInfo {
  pair: string;
  pool: string;
  fee: number;
}

const poolsAndFees: PoolInfo[] = [{
  pair: 'WHAUST/USDT',
  pool: '0x97f2781495be61d6D5A438d317995d67c78353EE',
  fee: 500,
}, {
  pair: 'WHAUST/USDC',
  pool: '0xE3Ec72CC9969B0e9eFbf87BDF5A376a43280E2d0',
  fee: 15000,
}, {
  pair: 'USDT/USDC',
  pool: '0x700d39cd228e79bb5f5cb15bd4260e339050ce30',
  fee: 3000,
}, {
  pair: 'WETH/USDT',
  pool: '0x6561098feedbe328c6d90f7be881f6721b81ee10',
  fee: 15000,
}, {
  pair: 'WBTC/USDC',
  pool: '0x1efca24da60a79136afe215d7947a5d5f63fdb66',
  fee: 15000,
}]

function getPoolInfo(tokenA: Currency | undefined, tokenB: Currency | undefined): PoolInfo[] {
  if (!tokenA || !tokenB) return []

  const symbolA = tokenA?.symbol
  const symbolB = tokenB?.symbol
  
  const pairFormat1 = `${symbolA}/${symbolB}`
  const pairFormat2 = `${symbolB}/${symbolA}`
  const directPool = poolsAndFees.find(
    (item) => item.pair === pairFormat1 || item.pair === pairFormat2
  )
  
  if (directPool) {
    return [directPool]
  }

  const paths: PoolInfo[] = []
  
  const poolsWithTokenA = poolsAndFees.filter(pool => {
    const [token0, token1] = pool.pair.split('/')
    return token0 === symbolA || token1 === symbolA
  })

  poolsWithTokenA.forEach(firstPool => {
    const [firstToken0, firstToken1] = firstPool.pair.split('/')
    const intermediateToken1 = firstToken0 === symbolA ? firstToken1 : firstToken0

    const poolsWithIntermediate1 = poolsAndFees.filter(pool => {
      const [token0, token1] = pool.pair.split('/')
      return (token0 === intermediateToken1 || token1 === intermediateToken1) &&
             pool.pair !== firstPool.pair
    })

    poolsWithIntermediate1.forEach(secondPool => {
      const [secondToken0, secondToken1] = secondPool.pair.split('/')
      const intermediateToken2 = secondToken0 === intermediateToken1 ? secondToken1 : secondToken0

      const thirdPool = poolsAndFees.find(pool => {
        const [thirdToken0, thirdToken1] = pool.pair.split('/')
        return ((thirdToken0 === intermediateToken2 && thirdToken1 === symbolB) ||
                (thirdToken0 === symbolB && thirdToken1 === intermediateToken2)) &&
               pool.pair !== secondPool.pair
      })

      if (thirdPool) {
        paths.push(firstPool, secondPool, thirdPool)
      }
    })

    const directSecondPool = poolsAndFees.find(pool => {
      const [secondToken0, secondToken1] = pool.pair.split('/')
      return ((secondToken0 === intermediateToken1 && secondToken1 === symbolB) ||
              (secondToken0 === symbolB && secondToken1 === intermediateToken1)) &&
             pool.pair !== firstPool.pair
    })

    if (directSecondPool) {
      paths.push(firstPool, directSecondPool)
    }
  })

  return paths
}

export function usePools(
  poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]
): [PoolState, Pool | null][] {
  const { chainId } = useWeb3React()

  const poolTokens: ([Token, Token, FeeAmount] | undefined)[] = useMemo(() => {
    if (!chainId) return new Array(poolKeys.length)

    const [currencyA, currencyB] = poolKeys[0] || []
    if (!currencyA || !currencyB) return []

    const pools = getPoolInfo(currencyA, currencyB)
    return pools.map(poolInfo => {
      const [token0Symbol, token1Symbol] = poolInfo.pair.split('/')
      const token0 = TOKEN_ADDRESSES[token0Symbol as keyof typeof TOKEN_ADDRESSES]
      const token1 = TOKEN_ADDRESSES[token1Symbol as keyof typeof TOKEN_ADDRESSES]
      if (!token0 || !token1) return undefined

      const fee = poolInfo.fee as FeeAmount
      return token0.sortsBefore(token1) ? [token0, token1, fee] : [token1, token0, fee]
    })
  }, [chainId, poolKeys])

  const poolAddresses = useMemo(() => {
    const [currencyA, currencyB] = poolKeys[0] || []
    if (!currencyA || !currencyB) return []

    const pools = getPoolInfo(currencyA, currencyB)
    return pools.map(pool => pool.pool)
  }, [poolKeys])

  const slot0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'slot0')
  const liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'liquidity')

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      const tokens = poolTokens[index]
      if (!tokens) return [PoolState.INVALID, null]
      const [token0, token1, fee] = tokens

      if (!slot0s[index]) return [PoolState.INVALID, null]
      const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index]

      if (!liquidities[index]) return [PoolState.INVALID, null]
      const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities[index]

      if (!tokens || !slot0Valid || !liquidityValid) return [PoolState.INVALID, null]
      if (slot0Loading || liquidityLoading) return [PoolState.LOADING, null]
      if (!slot0 || !liquidity) return [PoolState.NOT_EXISTS, null]
      if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [PoolState.NOT_EXISTS, null]

      try {        
        const pool = PoolCache.getPool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)
        return [PoolState.EXISTS, pool]
      } catch (error) {
        console.error('Error when constructing the pool', error)
        return [PoolState.NOT_EXISTS, null]
      }
    })
  }, [liquidities, poolKeys, slot0s, poolTokens])
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
