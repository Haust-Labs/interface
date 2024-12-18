import { Contract } from '@ethersproject/contracts'
import { formatUnits } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import ERC20_ABI from 'abis/erc20.json'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { useEffect, useState } from 'react'


export interface TokenBalance {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI: string
  balance: string
  balanceUSD: number
  priceChange: number
}


export interface TokenInfo {
    chainId: number
    address: string
    symbol: string
    name: string
    decimals: number
    logoURI: string
    balance: string
    balanceUSD: number
    priceChange: number
  }
  
export function useTokenBalance(token: any) {
  const { account, provider } = useWeb3React()
  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
  
  const logoURI = useCurrencyLogoURIs(token)[0]

  useEffect(() => {
    async function getBalance() {
      if (!account || !provider || !token) return

      try {
        let tokenBalance = '0'
        
        if (token.isNative) {
          const nativeBalance = await provider.getBalance(account)
          tokenBalance = formatUnits(nativeBalance, token.decimals)
        } else {
          const contract = new Contract(token.address, ERC20_ABI, provider)
          const rawBalance = await contract.balanceOf(account)
          tokenBalance = formatUnits(rawBalance, token.decimals)
        }

        const mockPrice = Math.random() * 1000
        const mockPriceChange = (Math.random() - 0.5) * 10

        setBalance({
          chainId: token.chainId,
          address: token.address,
          symbol: token.symbol || '',
          name: token.name || '',
          decimals: token.decimals,
          logoURI,
          balance: tokenBalance,
          balanceUSD: parseFloat(tokenBalance) * mockPrice,
          priceChange: mockPriceChange
        })
      } catch (error) {
        console.error('Error fetching token balance:', error)
      } finally {
        setLoading(false)
      }
    }

    getBalance()
  }, [account, provider, token, logoURI])

  return { balance, loading }
} 