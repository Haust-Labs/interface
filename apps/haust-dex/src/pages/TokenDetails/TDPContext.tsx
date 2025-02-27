import { Currency } from "@uniswap/sdk-core"
import { SupportedChainId } from "constants/chains"
import { createContext, PropsWithChildren, useContext } from "react"

type BaseTDPContext = {
  currencyChain: string

  /** Set to `NATIVE_CHAIN_ID` if currency is native, else equal to `currency.address` */
  address: string
}
/** Token details context with an unresolved currency field */
export type PendingTDPContext = BaseTDPContext

/** Token details context with a successfully resolved currency field */
export type LoadedTDPContext = BaseTDPContext

const TDPContext = createContext<LoadedTDPContext | undefined>(undefined)

export function useTDPContext(): LoadedTDPContext {
  const context = useContext(TDPContext)
  if (!context) {
    throw new Error('useTDPContext must be used within a TDPContextProvider')
  }
  return context
}

export function TDPProvider({ children, contextValue }: PropsWithChildren<{ contextValue: LoadedTDPContext }>) {
  return <TDPContext.Provider value={contextValue}>{children}</TDPContext.Provider>
}
