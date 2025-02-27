import { Currency } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'

/**
 * TODO: refactor parsing / Activity so that all Activity Types can have a detail sheet.
 */
export enum TransactionStatus {
  Confirmed = 'CONFIRMED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export enum TransactionType {
  Approve = 'APPROVE',
  Borrow = 'BORROW',
  Bridging = 'BRIDGING',
  Cancel = 'CANCEL',
  Claim = 'CLAIM',
  Deployment = 'DEPLOYMENT',
  Execute = 'EXECUTE',
  Lend = 'LEND',
  Mint = 'MINT',
  OnRamp = 'ON_RAMP',
  Receive = 'RECEIVE',
  Repay = 'REPAY',
  Send = 'SEND',
  Stake = 'STAKE',
  Swap = 'SWAP',
  SwapOrder = 'SWAP_ORDER',
  Unknown = 'UNKNOWN',
  Unstake = 'UNSTAKE',
  Withdraw = 'WITHDRAW'
}

export type Activity = {
  hash: string
  chainId: SupportedChainId
  status: TransactionStatus
  statusMessage?: string
  timestamp: number
  title: string
  descriptor?: string | JSX.Element
  logos?: Array<string | undefined>
  // TODO(WEB-3839): replace Currency with CurrencyInfo
  currencies?: Array<Currency | undefined>
  otherAccount?: string
  from: string
  nonce?: number | null
  prefixIconSrc?: string
  suffixIconSrc?: string
  cancelled?: boolean
  isSpam?: boolean
  type?: TransactionType
}

export type ActivityMap = { [id: string]: Activity | undefined }
