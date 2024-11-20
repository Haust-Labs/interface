import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache } from '@apollo/client'
import { SupportedChainId } from 'constants/chains'

import store from '../../state/index'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  // TODO: change subgraph path when mainnet is ready
  [SupportedChainId.HAUST]: 'https://haust-subgraph.rocknblock.io/subgraphs/name/v3-subgraph',
  [SupportedChainId.HAUST_TESTNET]:
    'https://haust-subgraph.rocknblock.io/subgraphs/name/v3-subgraph',
}

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[SupportedChainId.HAUST_TESTNET] })

// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/
const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const chainId = store.getState().application.chainId

  operation.setContext(() => ({
    uri:
      chainId && CHAIN_SUBGRAPH_URL[chainId]
        ? CHAIN_SUBGRAPH_URL[chainId]
        : CHAIN_SUBGRAPH_URL[SupportedChainId.HAUST],
  }))

  return forward(operation)
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: concat(authMiddleware, httpLink),
})
