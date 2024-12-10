import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { AlphaRouter, ChainId } from '@uniswap/smart-order-router'
import { RPC_PROVIDERS } from 'constants/providers'
import { getClientSideQuote, toSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import ms from 'ms.macro'
import qs from 'qs'
import { trace } from 'tracing'

import { GetQuoteResult } from './types'

export enum RouterPreference {
  API = 'api',
  CLIENT = 'client',
  PRICE = 'price',
}

const routers = new Map<ChainId, AlphaRouter>()
function getRouter(chainId: ChainId): AlphaRouter {
  const router = routers.get(chainId)
  if (router) return router

  const supportedChainId = toSupportedChainId(chainId)
  if (supportedChainId) {
    const provider = RPC_PROVIDERS[supportedChainId]
    const router = new AlphaRouter({ chainId, provider })
    routers.set(chainId, router)
    return router
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
}

// routing API quote params: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/schema/quote-schema.ts
const API_QUERY_PARAMS = {
  protocols: 'v2,v3,mixed',
}
const CLIENT_PARAMS = {
  protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
}
// Price queries are tuned down to minimize the required RPCs to respond to them.
// TODO(zzmp): This will be used after testing router caching.
// eslint-disable-next-line @typescript-eslint/no-unused-vars

interface GetQuoteArgs {
  tokenInAddress: string
  tokenInChainId: ChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: ChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  amount: string
  routerPreference: RouterPreference
  type: 'exactIn' | 'exactOut'
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.uniswap.org/v1/',
  }),
  endpoints: (build) => ({
    getQuote: build.query<GetQuoteResult, GetQuoteArgs>({
      async onQueryStarted(args: GetQuoteArgs, { queryFulfilled }: { queryFulfilled: any }) {
        trace(
          'quote',
          async ({ setTraceError, setTraceStatus }) => {
            try {
              await queryFulfilled
            } catch (error: unknown) {
              console.error('Error during query fulfillment:', error);
              if (error && typeof error === 'object' && 'error' in error) {
                const queryError = (error as Record<'error', FetchBaseQueryError>).error
                if (typeof queryError.status === 'number') {
                  setTraceStatus(queryError.status)
                }
                setTraceError(queryError)
              } else {
                throw error
              }
            }
          },
          {
            data: {
              ...args,
              isPrice: args.routerPreference === RouterPreference.PRICE,
              isAutoRouter: args.routerPreference === RouterPreference.API,
            },
            tags: { is_widget: false },
          }
        )
      },
      async queryFn(args, _api, _extraOptions, fetch) {
        const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, routerPreference, type } =
          args
          try {
          if (routerPreference === RouterPreference.API) {
            const query = qs.stringify({
              ...API_QUERY_PARAMS,
              tokenInAddress,
              tokenInChainId,
              tokenOutAddress,
              tokenOutChainId,
              amount,
              type,
            })
            return (await fetch(`quote?${query}`)) as { data: GetQuoteResult } | { error: FetchBaseQueryError }
          } else {            
            const router = getRouter(args.tokenInChainId)
            return await getClientSideQuote(
              args,
              router,
              CLIENT_PARAMS
            )
          }
        } catch (error) {
          console.error('Error in query function:', error);
          return { error: { status: 'CUSTOM_ERROR', error: error.toString(), data: error } }
        }
      },
      keepUnusedDataFor: ms`10s`,
      extraOptions: {
        maxRetries: 0,
      },
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
