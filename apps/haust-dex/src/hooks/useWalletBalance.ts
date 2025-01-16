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
  const [absoluteChange, setAbsoluteChange] = useState<number>(0)
  const [percentChange, setPercentChange] = useState<number>(0)

  const getBalances = useCallback(async () => {
    if (!account || !provider) return

    try {
      setLoading(true)
      
      let midnightData = []
      try {
        const midnightResponse = await fetch(            
          `https://entrypointv02.wdev.haust.app/v1/account/${account}/balance_midnight`,
          {
            headers: {
              'X-Haust-Wallet-Version': '0.1'
            }
          }
)
        midnightData = await midnightResponse.json()
      } catch (error) {
        console.error('Error fetching midnight balances:', error)
      }
      
      let prices: TokenPrice[] = []
      try {
        const pricesResponse = await fetch('https://entrypoint.stage.haust.app/v1/fiat_prices')
        prices = await pricesResponse.json()
      } catch (error) {
        console.error('Error fetching prices:', error)
      }

      if (!midnightData.length || !prices.length) {
        setPercentChange(0)
        setAbsoluteChange(0)
      } else {
        let totalPercentChange = 0
        let totalAbsoluteChange = 0
        let validTokenCount = 0

        for (const item of midnightData) {
          const midnightPrice = parseInt(item.usd_price_midnight, 16) / Math.pow(10, item.usd_price_decimals)
          
          const currentPriceData = prices.find(p => {
            if (item.token === null) {
              return p.token.symbol === 'HAUST'
            }
            return p.token.address?.toLowerCase() === item.token.toLowerCase()
          })

          if (currentPriceData) {
            const currentPrice = Number(currentPriceData.price) / Math.pow(10, currentPriceData.price_decimals)
            
            const tokenPercentChange = ((currentPrice - midnightPrice) / midnightPrice) * 100
            totalPercentChange += tokenPercentChange

            const midnightAmount = parseInt(item.amount_midnight, 16) / Math.pow(10, 18)
            const midnightValue = midnightAmount * midnightPrice
            const currentValue = midnightAmount * currentPrice
            const tokenAbsoluteChange = currentValue - midnightValue

            totalAbsoluteChange += tokenAbsoluteChange
            validTokenCount++
          }
        }

        const averagePercentChange = validTokenCount > 0 ? totalPercentChange / validTokenCount : 0
        setPercentChange(averagePercentChange)
        setAbsoluteChange(totalAbsoluteChange)
      }

      let nativeBalanceInEth = 0
      try {
        const nativeBalance = await provider.getBalance(account)
        nativeBalanceInEth = parseFloat(ethers.utils.formatEther(nativeBalance))
      } catch (error) {
        console.error('Error fetching native balance:', error)
      }

      const tokenAddresses = [
        '0x314e5d40a123F4Efdb096bB716767C905A7DcA97',
        '0x1a1aF9C78704D3a0Ab9e031C92E7bd808711A582',
        '0x25527108071D56bCBe025711CD93eE1E364b03ea',
        '0xC33299bb1Beb4DD431A4CC8f4174395F0d1d29E7',
        '0xf7FDb9d99Ff104dB82cc98DFd43602CCA4bB7c90',
      ]

      const tokenPromises = tokenAddresses.map(async (tokenAddress) => {
        try {
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
        } catch (error) {
          console.error(`Error fetching token balance for ${tokenAddress}:`, error)
          return {
            token: tokenAddress,
            balance: 0,
            decimals: 18,
            symbol: 'UNKNOWN',
          }
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

  return { totalBalance, tokenBalances, loading, refetch, absoluteChange, percentChange }
} 