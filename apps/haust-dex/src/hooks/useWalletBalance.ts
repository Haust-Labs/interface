/* eslint-disable @typescript-eslint/no-restricted-imports */
import { useWeb3React } from '@web3-react/core'
import ERC20_ABI from 'abis/erc20.json'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'


interface TokenBalance {
  token: string
  balance: number
  decimals: number
  symbol: string
}

export function useWalletBalance() {
  const { account, provider } = useWeb3React()
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getBalances() {
      if (!account || !provider) return

      try {
        setLoading(true)
        const nativeBalance = await provider.getBalance(account)
        const nativeBalanceInEth = parseFloat(ethers.utils.formatEther(nativeBalance))

        const tokenAddresses = [
          '0x314e5d40a123F4Efdb096bB716767C905A7DcA97',
          '0x1a1aF9C78704D3a0Ab9e031C92E7bd808711A582',
          '0x25527108071D56bCBe025711CD93eE1E364b03ea',
          '0xC33299bb1Beb4DD431A4CC8f4174395F0d1d29E7',
          '0xf7FDb9d99Ff104dB82cc98DFd43602CCA4bB7c90',
        ]

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

        const total = tokens.reduce((acc, token) => acc + token.balance, nativeBalanceInEth)
        setTotalBalance(total)
        
      } catch (error) {
        console.error('Error fetching balances:', error)
      } finally {
        setLoading(false)
      }
    }

    getBalances()
  }, [account, provider])

  return { totalBalance, tokenBalances, loading }
} 