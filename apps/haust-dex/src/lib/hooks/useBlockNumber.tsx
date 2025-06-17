import { JsonRpcProvider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const MISSING_PROVIDER = Symbol()
const BlockNumberContext = createContext<
  | {
      value?: number
      fastForward(block: number): void
    }
  | typeof MISSING_PROVIDER
>(MISSING_PROVIDER)

// RPC URL for fallback provider
const FALLBACK_RPC_URL = 'https://rpc-testnet.haust.app' // Можно будет заменить на нужный URL

function useBlockNumberContext() {
  const blockNumber = useContext(BlockNumberContext)
  if (blockNumber === MISSING_PROVIDER) {
    console.error('[useBlockNumberContext] Missing BlockNumberProvider')
    throw new Error('BlockNumber hooks must be wrapped in a <BlockNumberProvider>')
  }
  return blockNumber
}

/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useBlockNumberContext().value
}

export function useFastForwardBlockNumber(): (block: number) => void {
  return useBlockNumberContext().fastForward
}

export function BlockNumberProvider({ children }: { children: ReactNode }) {
  const { chainId: web3ChainId, provider: web3Provider } = useWeb3React()
  const [fallbackProvider, setFallbackProvider] = useState<JsonRpcProvider | null>(null)
  const [fallbackChainId, setFallbackChainId] = useState<number | undefined>()
  
  // Use web3Provider if available, otherwise use fallback
  const provider = web3Provider || fallbackProvider
  const activeChainId = web3ChainId || fallbackChainId
  
  useEffect(() => {
    if (!web3Provider) {
      const provider = new JsonRpcProvider(FALLBACK_RPC_URL)
      setFallbackProvider(provider)
      
      // Get chainId from fallback provider
      provider.getNetwork().then(
        network => {
          setFallbackChainId(network.chainId)
        },
        error => console.error('[BlockNumberProvider] Failed to get fallback network:', error)
      )
    } else {
      setFallbackProvider(null)
      setFallbackChainId(undefined)
    }
  }, [web3Provider])

  if (provider) {
    // Safe way to inspect provider
    provider.getNetwork().then(
      network => console.log('[BlockNumberProvider] Provider network:', network),
      error => console.error('[BlockNumberProvider] Failed to get network:', error)
    )
  }

  const [{ chainId, block }, setChainBlock] = useState<{ chainId?: number; block?: number }>({ chainId: activeChainId })

  const onBlock = useCallback(
    (block: number) => {
      setChainBlock((chainBlock) => {
        if (chainBlock.chainId === activeChainId) {
          if (!chainBlock.block || chainBlock.block < block) {
            return { chainId: activeChainId, block }
          }
        }
        return chainBlock
      })
    },
    [activeChainId, setChainBlock]
  )

  const windowVisible = useIsWindowVisible()
  useEffect(() => {
    let stale = false

    if (provider && activeChainId && windowVisible) {
      setChainBlock((chainBlock) => {
        const newState = chainBlock.chainId === activeChainId ? chainBlock : { chainId: activeChainId }
        return newState
      })

      // Check RPC availability and capabilities      
      const tryGetBlockNumber = async (provider: JsonRpcProvider | typeof web3Provider, isFallback = false) => {
        const prefix = isFallback ? '[Fallback] ' : ''
        try {
          // Add timeout to detect hanging requests
          const blockNumberPromise = provider?.getBlockNumber()
          const timeoutPromise = new Promise<number>((_, reject) => {
            setTimeout(() => reject(new Error('Block number request timeout')), 5000)
          })

          const block = await Promise.race([blockNumberPromise, timeoutPromise])
          return block
        } catch (error) {
          console.error(`[BlockNumberProvider] ${prefix}Failed to get block number:`, error)
          throw error
        }
      }

      // Try with primary provider first
      tryGetBlockNumber(provider)
        .catch(async (error) => {
          // If primary fails and we don't have fallback yet, create it
          let fbProvider = fallbackProvider
          if (!fbProvider) {
            fbProvider = new JsonRpcProvider(FALLBACK_RPC_URL)
            setFallbackProvider(fbProvider)
          }
          // Try with fallback provider
          return tryGetBlockNumber(fbProvider, true)
        })
        .then((block) => {
          if (!stale) {
            onBlock(block || 0)
          } else {
            console.log('[BlockNumberProvider] Block number fetched, but stale:', block)
          }
        })
        .catch((error) => {
          console.error(`[BlockNumberProvider] All providers failed to get block number:`, error)
        })

      
      // Set up listeners for both providers
      const setupBlockListener = (provider: JsonRpcProvider | typeof web3Provider, isFallback = false) => {
        const prefix = isFallback ? '[Fallback] ' : ''
        provider?.on('block', (block: number) => {
          if (!stale) onBlock(block || 0)
        })
      }

      setupBlockListener(provider)
      if (fallbackProvider) {
        setupBlockListener(fallbackProvider, true)
      }

      return () => {
        stale = true
        if (provider) {
          provider.removeListener('block', onBlock)
        }
        if (fallbackProvider) {
          fallbackProvider.removeListener('block', onBlock)
        }
      }
    }

    return void 0
  }, [activeChainId, provider, onBlock, setChainBlock, windowVisible])

  const value = useMemo(
    () => {
      const result = {
        value: chainId === activeChainId ? block : undefined,
        fastForward: (update: number) => {
          if (block && update > block) {
            setChainBlock({ chainId: activeChainId, block: update })
          }
        },
      }
      return result
    },
    [activeChainId, block, chainId]
  )
  return <BlockNumberContext.Provider value={value}>{children}</BlockNumberContext.Provider>
}
