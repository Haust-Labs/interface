import React, { Dispatch, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { UniswapInterfaceMulticall } from "../types/v3"
import { DEFAULT_CALL_GAS_REQUIRED } from './constants'
import type { MulticallContext } from './context'
import type { MulticallActions } from './slice'
import type { Call, ListenerOptions, MulticallState, WithMulticallState } from './types'
import { parseCallKey, toCallKey } from './utils/callKeys'
import chunkCalls from './utils/chunkCalls'
import { RetryableError } from './utils/retry'
import useDebounce from './utils/useDebounce'

const FETCH_RETRY_CONFIG = {
  n: 2,
  minWait: 1000,
  maxWait: 2000
}

const POLLING_INTERVAL = 2000
const UPDATE_DEBOUNCE = 100
const MAX_CHUNK_SIZE = 50
const CACHE_TTL = 3000

const failedCallsCache = new Map<string, number>();
const FAILED_CALLS_TTL = 30000;

const requestCache = new Map<string, {
  timestamp: number;
  result: any;
}>()

let isInitialized = false
let initializationPromise: Promise<void> | null = null

async function initializeMulticall(contract: UniswapInterfaceMulticall) {
  if (isInitialized || initializationPromise) return initializationPromise

  initializationPromise = new Promise((resolve) => {
    contract.callStatic.multicall([], { blockTag: 'latest' })
      .then(() => {
        isInitialized = true
        resolve()
      })
      .catch((error) => {
        console.error('Failed to initialize multicall:', error)
        isInitialized = false
        resolve()
      })
  })

  return initializationPromise
}

/**
 * Оптимизированная функция для получения чанка данных
 */
async function fetchChunk(
  multicall: UniswapInterfaceMulticall,
  chunk: Call[],
  blockNumber: number,
  isDebug?: boolean
): Promise<{ success: boolean; returnData: string }[]> {
  if (!isInitialized) {
    await initializeMulticall(multicall)
  }

  const cacheKey = `${blockNumber}-${chunk.map(c => `${c.address}-${c.callData}`).join('-')}`
  const now = Date.now()
  const cached = requestCache.get(cacheKey)

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  try {
    const { returnData } = await multicall.callStatic.multicall(
      chunk.map((obj) => ({
        target: obj.address,
        callData: obj.callData,
        gasLimit: obj.gasRequired ?? DEFAULT_CALL_GAS_REQUIRED,
      })),
      { blockTag: blockNumber }
    )

    requestCache.set(cacheKey, { timestamp: now, result: returnData })

    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        requestCache.delete(key)
      }
    }

    return returnData
  } catch (error: any) {
    if (error.code === -32000 || error.message?.indexOf('header not found') !== -1) {
      throw new RetryableError(`header not found for block number ${blockNumber}`)
    }

    if (error.code === -32603 || 
        error.message?.indexOf('execution ran out of gas') !== -1 ||
        error.message?.indexOf('missing revert data') !== -1 ||
        error.message?.indexOf('returndata.limit') !== -1) {
      if (chunk.length > 1) {
        const half = Math.floor(chunk.length / 2)
        const [c0, c1] = await Promise.all([
          fetchChunk(multicall, chunk.slice(0, half), blockNumber),
          fetchChunk(multicall, chunk.slice(half, chunk.length), blockNumber),
        ])
        return c0.concat(c1)
      }
    }

    if (error.code === -32603 || error.message?.indexOf('Internal JSON-RPC error') !== -1) {
      isInitialized = false
      initializationPromise = null
    }

    throw error
  }
}

/**
 * From the current all listeners state, return each call key mapped to the
 * minimum number of blocks per fetch. This is how often each key must be fetched.
 * @param allListeners the all listeners state
 * @param chainId the current chain id
 */
export function activeListeningKeys(
  allListeners: MulticallState['callListeners'],
  chainId?: number
): { [callKey: string]: number } {
  if (!allListeners || !chainId) return {}
  const listeners = allListeners[chainId]
  if (!listeners) return {}

  return Object.keys(listeners).reduce<{ [callKey: string]: number }>((memo, callKey) => {
    const keyListeners = listeners[callKey]

    memo[callKey] = Object.keys(keyListeners)
      .filter((key) => {
        const blocksPerFetch = parseInt(key)
        if (blocksPerFetch <= 0) return false
        return keyListeners[blocksPerFetch] > 0
      })
      .reduce((previousMin, current) => {
        return Math.min(previousMin, parseInt(current))
      }, Infinity)
    return memo
  }, {})
}

/**
 * Return the keys that need to be refetched
 * @param callResults current call result state
 * @param listeningKeys each call key mapped to how old the data can be in blocks
 * @param chainId the current chain id
 * @param latestBlockNumber the latest block number
 */
export function outdatedListeningKeys(
  callResults: MulticallState['callResults'],
  listeningKeys: { [callKey: string]: number },
  chainId: number | undefined,
  latestBlockNumber: number | undefined
): string[] {
  if (!chainId || !latestBlockNumber) return []
  const results = callResults[chainId]
  // no results at all, load everything
  if (!results) return Object.keys(listeningKeys)

  return Object.keys(listeningKeys).filter((callKey) => {
    const blocksPerFetch = listeningKeys[callKey]

    const data = callResults[chainId][callKey]
    // no data, must fetch
    if (!data) return true

    const minDataBlockNumber = latestBlockNumber - (blocksPerFetch - 1)

    // already fetching it for a recent enough block, don't refetch it
    if (data.fetchingBlockNumber && data.fetchingBlockNumber >= minDataBlockNumber) return false

    // if data is older than minDataBlockNumber, fetch it
    return !data.blockNumber || data.blockNumber < minDataBlockNumber
  })
}

interface FetchChunkContext {
  actions: MulticallActions
  dispatch: Dispatch<any>
  chainId: number
  latestBlockNumber: number
  isDebug?: boolean
}

function onFetchChunkSuccess(
  context: FetchChunkContext,
  chunk: Call[],
  result: Array<{ success: boolean; returnData: string }>
) {
  const { actions, dispatch, chainId, latestBlockNumber, isDebug } = context

  // split the returned slice into errors and results
  const { erroredCalls, results } = chunk.reduce<{
    erroredCalls: Call[]
    results: { [callKey: string]: string | null }
  }>(
    (memo, call, i) => {
      if (result[i].success) {
        memo.results[toCallKey(call)] = result[i].returnData ?? null
      } else {
        memo.erroredCalls.push(call)
      }
      return memo
    },
    { erroredCalls: [], results: {} }
  )

  // dispatch any new results
  if (Object.keys(results).length > 0)
    dispatch(
      actions.updateMulticallResults({
        chainId,
        results,
        blockNumber: latestBlockNumber,
      })
    )

  // dispatch any errored calls
  if (erroredCalls.length > 0) {
    if (isDebug) {
      result.forEach((returnData, ix) => {
        if (!returnData.success) {
          console.debug('Call failed', chunk[ix], returnData)
        }
      })
    } else {
      console.debug('Calls errored in fetch', erroredCalls)
    }
    dispatch(
      actions.errorFetchingMulticallResults({
        calls: erroredCalls,
        chainId,
        fetchingBlockNumber: latestBlockNumber,
      })
    )
  }
}

function onFetchChunkFailure(context: FetchChunkContext, chunk: Call[], error: any) {
  const { actions, dispatch, chainId, latestBlockNumber } = context

  if (error.isCancelledError) {
    return
  }

  dispatch(
    actions.errorFetchingMulticallResults({
      calls: chunk,
      chainId,
      fetchingBlockNumber: latestBlockNumber,
    })
  )
}

export interface UpdaterProps {
  context: MulticallContext
  chainId: number | undefined // For now, one updater is required for each chainId to be watched
  latestBlockNumber: number | undefined
  contract: UniswapInterfaceMulticall
  isDebug?: boolean
  listenerOptions?: ListenerOptions
}

function Updater(props: UpdaterProps): null {
  const { context, chainId, latestBlockNumber, contract, isDebug, listenerOptions } = props
  const { actions, reducerPath } = context
  const dispatch = useDispatch()
  const state = useSelector((state: WithMulticallState) => state[reducerPath])
  
  const [isUpdating, setIsUpdating] = useState(false)
  const lastUpdateRef = useRef<number>(0)
  const pendingUpdatesRef = useRef<Set<string>>(new Set())
  const errorCountRef = useRef<{ [key: string]: number }>({})

  const debouncedListeners = useDebounce(state.callListeners, UPDATE_DEBOUNCE)

  const getUpdateKeys = useCallback(() => {
    if (!chainId || !latestBlockNumber) return []
    
    const listeningKeys = activeListeningKeys(debouncedListeners, chainId)
    return outdatedListeningKeys(
      state.callResults,
      listeningKeys,
      chainId,
      latestBlockNumber
    )
  }, [chainId, latestBlockNumber, state.callResults, debouncedListeners])

  const performUpdate = useCallback(async () => {
    if (!chainId || !latestBlockNumber || !contract || isUpdating) return

    const outdatedCallKeys = getUpdateKeys()
    if (outdatedCallKeys.length === 0) return

    const now = Date.now()
    if (now - lastUpdateRef.current < POLLING_INTERVAL) return
    
    setIsUpdating(true)
    lastUpdateRef.current = now

    try {
      const calls = outdatedCallKeys
        .filter(key => {
          const errorCount = errorCountRef.current[key] || 0
          return errorCount < 3 && !pendingUpdatesRef.current.has(key)
        })
        .map(key => parseCallKey(key))

      if (calls.length === 0) return

      calls.forEach(call => {
        pendingUpdatesRef.current.add(toCallKey(call))
      })

      dispatch(
        actions.fetchingMulticallResults({
          calls,
          chainId,
          fetchingBlockNumber: latestBlockNumber,
        })
      )

      const chunks = chunkCalls(calls, MAX_CHUNK_SIZE)
      await Promise.all(
        chunks.map(async chunk => {
          try {
            const result = await fetchChunk(contract, chunk, latestBlockNumber, isDebug)
            
            const { results } = chunk.reduce<{ results: { [callKey: string]: string | null } }>(
              (memo, call, i) => {
                const key = toCallKey(call)
                memo.results[key] = result[i].success ? result[i].returnData : null
                pendingUpdatesRef.current.delete(key)
                errorCountRef.current[key] = 0
                return memo
              },
              { results: {} }
            )

            dispatch(
              actions.updateMulticallResults({
                chainId,
                results,
                blockNumber: latestBlockNumber,
              })
            )
          } catch (error) {
            console.error('Failed to fetch chunk:', error)
            chunk.forEach(call => {
              const key = toCallKey(call)
              pendingUpdatesRef.current.delete(key)
              errorCountRef.current[key] = (errorCountRef.current[key] || 0) + 1
            })
          }
        })
      )
    } finally {
      setIsUpdating(false)
    }
  }, [chainId, latestBlockNumber, contract, isUpdating, getUpdateKeys, dispatch, actions, isDebug])

  useEffect(() => {
    const interval = setInterval(performUpdate, POLLING_INTERVAL)
    return () => {
      clearInterval(interval)
      setIsUpdating(false)
      pendingUpdatesRef.current.clear()
      errorCountRef.current = {}
    }
  }, [performUpdate])

  useEffect(() => {
    if (chainId && listenerOptions) {
      dispatch(actions.updateListenerOptions({ chainId, listenerOptions }))
    }
  }, [chainId, listenerOptions, actions, dispatch])

  return null
}

export const MemoizedUpdater = React.memo(Updater)

export function createUpdater(context: MulticallContext) {
  const UpdaterContextBound = (props: Omit<UpdaterProps, 'context'>) => {
    return <MemoizedUpdater context={context} {...props} />
  }
  return UpdaterContextBound
}
