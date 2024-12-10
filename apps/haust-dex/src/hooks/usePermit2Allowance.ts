import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { useWeb3React } from '@web3-react/core';
import { useCallback, useMemo, useState } from 'react';
import { Contract } from 'ethers';

export enum AllowanceState {
  LOADING,
  REQUIRED,
  ALLOWED,
}

interface AllowanceRequired {
  state: AllowanceState.REQUIRED;
  token: Token;
  isApprovalLoading: boolean;
  approve: () => Promise<void>;
}

export type Allowance =
  | { state: AllowanceState.LOADING }
  | { state: AllowanceState.ALLOWED }
  | AllowanceRequired;

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
]

export default function useTokenApproval(amount?: CurrencyAmount<Token>, spender?: string): Allowance {
  const { account, provider } = useWeb3React();
  const token = amount?.currency;
  
  const [isApprovalLoading, setApprovalLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);


    const checkAllowance = useCallback(async () => {
    if (!token || !spender || !account || !provider) return;
    const contract = new Contract(token.address, ERC20_ABI, provider.getSigner(account));
    const allowance = await contract.allowance(account, spender);
    setIsApproved(allowance.gte(amount?.quotient.toString() ?? '0'));
  }, [account, amount, provider, spender, token]);

  const approve = useCallback(async () => {
    if (!token || !spender || !account || !provider) return;
    try {
      setApprovalLoading(true);
      const contract = new Contract(token.address, ERC20_ABI, provider.getSigner(account));
      const tx = await contract.approve(spender, amount?.quotient.toString() ?? '0');
      await tx.wait();
      await checkAllowance();
    } catch (error) {
      console.error('Ошибка аппрува:', error);
    } finally {
      setApprovalLoading(false);
    }
  }, [account, amount, checkAllowance, provider, spender, token]);

  useMemo(() => {
    if (!token || !spender || !account || !provider) return;
    checkAllowance();
  }, [token, spender, account, provider, checkAllowance]);

  if (!token) {
    return { state: AllowanceState.LOADING };
  }

  if (isApproved) {
    return { state: AllowanceState.ALLOWED };
  }

  return {
    state: AllowanceState.REQUIRED,
    token,
    isApprovalLoading,
    approve,
  };
}
