/* eslint-disable @typescript-eslint/no-restricted-imports */
import { useWeb3React } from '@web3-react/core'
import ERC20_ABI from 'abis/erc20.json'
import { ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'


interface TokenBalance {
  token: string
  balance: number
  decimals: number
  symbol: string
}

interface TokenPrice {
  price: string
  price_decimals: number
  token: {
    address: string | null
    symbol: string
  }
}

export function useWalletBalance() {
  const { account, provider } = useWeb3React()
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(true)

  const getBalances = useCallback(async () => {
    if (!account || !provider) return

    try {
      setLoading(true)
      
      // Fetch token prices
      const pricesResponse = await fetch('https://entrypoint.wdev.haust.app/v1/fiat_prices')
      const prices: TokenPrice[] = await pricesResponse.json()
      
      // Get native token balance
      const nativeBalance = await provider.getBalance(account)
      const nativeBalanceInEth = parseFloat(ethers.utils.formatEther(nativeBalance))

      // List of token addresses to check
      const tokenAddresses = [
        '0x314e5d40a123F4Efdb096bB716767C905A7DcA97',
        '0x1a1aF9C78704D3a0Ab9e031C92E7bd808711A582',
        '0x25527108071D56bCBe025711CD93eE1E364b03ea',
        '0xC33299bb1Beb4DD431A4CC8f4174395F0d1d29E7',
        '0xf7FDb9d99Ff104dB82cc98DFd43602CCA4bB7c90',
      ]

      // Get ERC20 token balances
      const tokenPromises = tokenAddresses.map(async (tokenAddress) => {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
        const [balance, decimals, symbol] = await Promise.all([
          contract.balanceOf(account),
          contract.decimals(),
          contract.symbol(),
        ])
        
        const formattedBalance = parseFloat(ethers.utils.formatUnits(balance, decimals))
        
        return {
          token: tokenAddress,
          balance: formattedBalance,
          decimals,
          symbol,
        }
      })

      const tokens = await Promise.all(tokenPromises)
      setTokenBalances(tokens)

      let total = tokens.reduce((acc, token) => {
        const tokenPrice = prices.find(p => 
          (p.token.address?.toLowerCase() === token.token.toLowerCase()) ||
          (p.token.symbol.toUpperCase() === token.symbol.toUpperCase())
        )
        
        if (tokenPrice) {
          const priceInUsd = Number(tokenPrice.price) / Math.pow(10, tokenPrice.price_decimals)
          const tokenValue = token.balance * priceInUsd
          return acc + tokenValue
        }
        console.log(`No price found for token: ${token.symbol} (${token.token})`)
        return acc
      }, 0)

      const whaustPrice = prices.find(p => p.token.symbol === 'HAUST')
      if (whaustPrice) {
        const haustPriceInUsd = Number(whaustPrice.price) / Math.pow(10, whaustPrice.price_decimals)
        
        const nativeValue = nativeBalanceInEth * haustPriceInUsd
        total += nativeValue
        
        const haustToken = tokens.find(t => t.token.toLowerCase() === '0x314e5d40a123F4Efdb096bB716767C905A7DcA97'.toLowerCase())
        if (haustToken && !prices.find(p => p.token.address?.toLowerCase() === haustToken.token.toLowerCase())) {
          const haustValue = haustToken.balance * haustPriceInUsd
          total += haustValue
        }
      }

      setTotalBalance(total)
      
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setLoading(false)
    }
  }, [account, provider])

  // Expose refetch function
  const refetch = useCallback(() => {
    getBalances()
  }, [getBalances])

  useEffect(() => {
    getBalances()
  }, [getBalances])

  return { totalBalance, tokenBalances, loading, refetch }
} 