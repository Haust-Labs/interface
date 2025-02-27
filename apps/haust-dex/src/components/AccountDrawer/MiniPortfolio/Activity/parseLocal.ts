import { t } from "@lingui/macro";
import { Currency, CurrencyAmount, Token, TradeType } from "@uniswap/sdk-core";
import { formatCurrencyAmount } from "conedison/format";
import { SupportedChainId } from "constants/chains";
import { nativeOnChain } from "constants/tokens";
import {
  TransactionPartsFragment,
  TransactionStatus,
} from "graphql/data/__generated__/types-and-hooks";
import { useTokenFromActiveNetwork } from "lib/hooks/useCurrency";
import { useMemo } from "react";
import { TokenAddressMap, useCombinedActiveList } from "state/lists/hooks";
import { useMultichainTransactions } from "state/transactions/hooks";
import {
  AddLiquidityV2PoolTransactionInfo,
  AddLiquidityV3PoolTransactionInfo,
  ApproveTransactionInfo,
  CollectFeesTransactionInfo,
  CreateV3PoolTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  RemoveLiquidityV3TransactionInfo,
  SendTransactionInfo,
  TransactionDetails,
  TransactionType,
  WrapTransactionInfo,
} from "state/transactions/types";

import { getActivityTitle } from "../constants";
import { Activity, ActivityMap } from "./types";
import { isAddress } from "utils";
import useAllActivities from "graphql/thegraph/useAllActivities";

function getCurrency(
  currencyId: string,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Currency | undefined {
  if (
    currencyId === "HST"
  ) {
    return nativeOnChain(chainId);
  }
  return tokens[chainId]?.[currencyId]?.token;
}

function buildCurrencyDescriptor(
  currencyA: Currency | undefined,
  amtA: string,
  currencyB: Currency | undefined,
  amtB: string,
  delimiter = t`for`
) {
  const formattedA = currencyA
    ? formatCurrencyAmount(CurrencyAmount.fromRawAmount(currencyA, amtA))
    : t`Unknown`;
  const symbolA = currencyA?.symbol ?? "";
  const formattedB = currencyB
    ? formatCurrencyAmount(CurrencyAmount.fromRawAmount(currencyB, amtB))
    : t`Unknown`;
  const symbolB = currencyB?.symbol ?? "";
  return [formattedA, symbolA, delimiter, formattedB, symbolB]
    .filter(Boolean)
    .join(" ");
}

function parseSwap(
  swap: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  const tokenIn = getCurrency(swap.inputCurrencyId, chainId, tokens);
  const tokenOut = getCurrency(swap.outputCurrencyId, chainId, tokens);
  const [inputRaw, outputRaw] =
    swap.tradeType === TradeType.EXACT_INPUT
      ? [swap.inputCurrencyAmountRaw, swap.expectedOutputCurrencyAmountRaw]
      : [swap.expectedInputCurrencyAmountRaw, swap.outputCurrencyAmountRaw];

  return {
    descriptor: buildCurrencyDescriptor(tokenIn, inputRaw, tokenOut, outputRaw),
    currencies: [tokenIn, tokenOut],
  };
}

function parseSend(
  send: SendTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  const { currencyId, amount, recipient } = send;
  const currency = getCurrency(currencyId, chainId, tokens);
  const formattedAmount = currency
    ? formatCurrencyAmount(CurrencyAmount.fromRawAmount(currency, amount))
    : t`Unknown`;

  return {
    descriptor: t`Send ${formattedAmount} ${currency?.symbol} to ${recipient}`,
    otherAccount: recipient,
    currencies: [currency],
  };
}

function parseWrap(
  wrap: WrapTransactionInfo,
  chainId: SupportedChainId,
  status: TransactionStatus
): Partial<Activity> {
  const native = nativeOnChain(chainId);
  const wrapped = native.wrapped;
  const [input, output] = wrap.unwrapped
    ? [wrapped, native]
    : [native, wrapped];

  const descriptor = buildCurrencyDescriptor(
    input,
    wrap.currencyAmountRaw,
    output,
    wrap.currencyAmountRaw
  );
  const title = getActivityTitle(TransactionType.WRAP, status, wrap.unwrapped);
  const currencies = wrap.unwrapped ? [wrapped, native] : [native, wrapped];

  return { title, descriptor, currencies };
}

function parseApproval(
  approval: ApproveTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  const currency = getCurrency(approval.tokenAddress, chainId, tokens);
  const descriptor = currency?.symbol ?? currency?.name ?? t`Unknown`;
  return {
    descriptor,
    currencies: [currency],
  };
}

type GenericLPInfo = Omit<
  | AddLiquidityV3PoolTransactionInfo
  | RemoveLiquidityV3TransactionInfo
  | AddLiquidityV2PoolTransactionInfo,
  "type"
>;
function parseLP(
  lp: GenericLPInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  const baseCurrency = getCurrency(lp.baseCurrencyId, chainId, tokens);
  const quoteCurrency = getCurrency(lp.quoteCurrencyId, chainId, tokens);
  const [baseRaw, quoteRaw] = [
    lp.expectedAmountBaseRaw,
    lp.expectedAmountQuoteRaw,
  ];
  const descriptor = buildCurrencyDescriptor(
    baseCurrency,
    baseRaw,
    quoteCurrency,
    quoteRaw,
    t`and`
  );

  return { descriptor, currencies: [baseCurrency, quoteCurrency] };
}

function parseCollectFees(
  collect: CollectFeesTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  // Adapts CollectFeesTransactionInfo to generic LP type
  const {
    currencyId0: baseCurrencyId,
    currencyId1: quoteCurrencyId,
    expectedCurrencyOwed0: expectedAmountBaseRaw,
    expectedCurrencyOwed1: expectedAmountQuoteRaw,
  } = collect;
  return parseLP(
    {
      baseCurrencyId,
      quoteCurrencyId,
      expectedAmountBaseRaw,
      expectedAmountQuoteRaw,
    },
    chainId,
    tokens
  );
}

function parseMigrateCreateV3(
  lp: MigrateV2LiquidityToV3TransactionInfo | CreateV3PoolTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  const baseCurrency = getCurrency(lp.baseCurrencyId, chainId, tokens);
  const baseSymbol = baseCurrency?.symbol ?? t`Unknown`;
  const quoteCurrency = getCurrency(lp.quoteCurrencyId, chainId, tokens);
  const quoteSymbol = quoteCurrency?.symbol ?? t`Unknown`;
  const descriptor = t`${baseSymbol} and ${quoteSymbol}`;

  return { descriptor, currencies: [baseCurrency, quoteCurrency] };
}

export function parseLocalActivity(
  details: TransactionDetails,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Activity | undefined {
  try {
    const status = !details.receipt
      ? TransactionStatus.Pending
      : details.receipt.status === 1 || details.receipt?.status === undefined
      ? TransactionStatus.Confirmed
      : TransactionStatus.Failed;

    const receipt: TransactionPartsFragment | undefined = details.receipt
      ? {
          id: details.receipt.transactionHash,
          ...details.receipt,
          ...details,
          status,
        }
      : undefined;

    const defaultFields = {
      hash: details.hash,
      chainId,
      title: getActivityTitle(details.info.type, status),
      status,
      timestamp: (details.confirmedTime ?? details.addedTime) / 1000,
      receipt,
    };

    let additionalFields: Partial<Activity> = {};
    const info = details.info;
    if (info.type === TransactionType.SWAP) {
      additionalFields = parseSwap(info, chainId, tokens);
    } else if (info.type === TransactionType.APPROVAL) {
      additionalFields = parseApproval(info, chainId, tokens);
    } else if (info.type === TransactionType.WRAP) {
      additionalFields = parseWrap(info, chainId, status);
    } else if (
      info.type === TransactionType.ADD_LIQUIDITY_V3_POOL ||
      info.type === TransactionType.REMOVE_LIQUIDITY_V3 ||
      info.type === TransactionType.ADD_LIQUIDITY_V2_POOL
    ) {
      additionalFields = parseLP(info, chainId, tokens);
    } else if (info.type === TransactionType.COLLECT_FEES) {
      additionalFields = parseCollectFees(info, chainId, tokens);
    } else if (
      info.type === TransactionType.MIGRATE_LIQUIDITY_V3 ||
      info.type === TransactionType.CREATE_V3_POOL
    ) {
      additionalFields = parseMigrateCreateV3(info, chainId, tokens);
    } else if (info.type === TransactionType.SEND) {
      additionalFields = parseSend(info, chainId, tokens);
    }

    return { ...defaultFields, ...additionalFields, from: details.from ?? "" };
  } catch (error) {
    console.debug(`Failed to parse transaction ${details.hash}`, error);
    return undefined;
  }
}

export function useLocalActivities(account: string): ActivityMap {
  const allTransactions = useMultichainTransactions();
  const tokens = useCombinedActiveList();

  return useMemo(() => {
    const activityByHash: ActivityMap = {};
    for (const [transaction, chainId] of allTransactions) {
      if (transaction.from !== account) continue;

      activityByHash[transaction.hash] = parseLocalActivity(
        transaction,
        chainId,
        tokens
      );
    }
    return activityByHash;
  }, [account, allTransactions, tokens]);
}

type TimeGroupedActivities = {
  today: Activity[];
  yesterday: Activity[];
  thisWeek: Activity[];
  thisMonth: Activity[];
  thisYear: Activity[];
  [key: string]: Activity[]; // For years before current year
};

// Add new types for GraphQL activities
type GraphQLActivity = {
  transaction: {
    id: string;
  };
  timestamp: number;
  token0: {
    id: string;
    name: string;
    symbol: string;
    decimals: string;
  };
  token1: {
    id: string;
    name: string;
    symbol: string;
    decimals: string;
  };
  amount0: string;
  amount1: string;
  amountUSD?: string;
};

function parseGraphQLActivity(
  activity: GraphQLActivity,
  type: "swap" | "mint" | "burn",
  chainId: SupportedChainId
): Activity {
  // Check for HAUST/WHAUST tokens
  const isHaustToken = (tokenId: string, symbol: string) => {
    return (
      symbol === "HST" ||
      symbol.toLowerCase() === "whaust" ||
      symbol.toLowerCase() === "whaust" ||
      symbol.toLowerCase() === "whaust"
    );
  };

  const token0 = isHaustToken(activity.token0.id, activity.token0.symbol)
    ? nativeOnChain(chainId)
    : new Token(
        chainId,
        activity.token0.id,
        Number(activity.token0.decimals),
        activity.token0.symbol,
        activity.token0.name
      );

  const token1 = isHaustToken(activity.token1.id, activity.token1.symbol)
    ? nativeOnChain(chainId)
    : new Token(
        chainId,
        activity.token1.id,
        Number(activity.token1.decimals),
        activity.token1.symbol,
        activity.token1.name
      );

  // Convert decimal amounts to wei (multiply by 10^18)
  const amount0Wei = BigInt(Math.floor(Number(activity.amount0) * 10 ** Number(activity.token0.decimals)));
  const amount1Wei = BigInt(Math.floor(Number(activity.amount1) * 10 ** Number(activity.token1.decimals)));

  const descriptor = buildCurrencyDescriptor(
    token0,
    amount0Wei.toString(),
    token1,
    amount1Wei.toString(),
    type === "swap" ? t`for` : t`and`
  );

  return {
    hash: activity.transaction.id,
    chainId,
    title:
      type === "swap"
        ? t`Swap`
        : type === "mint"
        ? t`Add Liquidity`
        : t`Remove Liquidity`,
    descriptor,
    status: TransactionStatus.Confirmed,
    timestamp: Number(activity.timestamp),
    currencies: [token0, token1],
    from: "",
  };
}

export function useActivities(account: string): TimeGroupedActivities {
  const allTransactions = useMultichainTransactions();
  const tokens = useCombinedActiveList();
  const { data: graphQLActivities } = useAllActivities(account, 10000);

  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped: TimeGroupedActivities = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      thisYear: [],
    };

    // Helper function to validate token addresses
    const isValidToken = (address: string) => {
      return Object.values(tokens).some((tokenMap) =>
        Object.keys(tokenMap).some(
          (tokenAddress) => tokenAddress.toLowerCase() === address.toLowerCase()
        )
      );
    };

    // Track processed transaction hashes to avoid duplicates
    const processedHashes = new Set<string>();

    // Process local transactions first
    for (const [transaction, chainId] of allTransactions) {
      if (transaction.from !== account) continue;

      const activity = parseLocalActivity(transaction, chainId, tokens);
      if (!activity) continue;

      processedHashes.add(activity.hash);
      addActivityToGroup(activity, grouped, now, today, yesterday);
    }

    // Process GraphQL activities
    if (graphQLActivities) {
      const chainId = SupportedChainId.HAUST_TESTNET;

      // Process swaps
      graphQLActivities.swaps.forEach((swap) => {
        if (
          !processedHashes.has(swap.transaction.id) &&
          isValidToken(swap.token0.id) &&
          isValidToken(swap.token1.id)
        ) {
          const activity = parseGraphQLActivity(swap, "swap", chainId);
          addActivityToGroup(activity, grouped, now, today, yesterday);
        }
      });

      // Process mints
      graphQLActivities.mints.forEach((mint) => {
        if (
          !processedHashes.has(mint.transaction.id) &&
          isValidToken(mint.token0.id) &&
          isValidToken(mint.token1.id)
        ) {
          const activity = parseGraphQLActivity(mint, "mint", chainId);
          addActivityToGroup(activity, grouped, now, today, yesterday);
        }
      });

      // Process burns
      graphQLActivities.burns.forEach((burn) => {
        if (
          !processedHashes.has(burn.transaction.id) &&
          isValidToken(burn.token0.id) &&
          isValidToken(burn.token1.id)
        ) {
          const activity = parseGraphQLActivity(burn, "burn", chainId);
          addActivityToGroup(activity, grouped, now, today, yesterday);
        }
      });
    }

    // Sort activities within each group
    Object.values(grouped).forEach((activities) => {
      activities.sort((a, b) => b.timestamp - a.timestamp);
    });

    return grouped;
  }, [account, allTransactions, tokens, graphQLActivities]);
}

function addActivityToGroup(
  activity: Activity,
  grouped: TimeGroupedActivities,
  now: Date,
  today: Date,
  yesterday: Date
) {
  const timestamp = new Date(activity.timestamp * 1000);
  const timestampDate = new Date(
    timestamp.getFullYear(),
    timestamp.getMonth(),
    timestamp.getDate()
  );

  if (timestampDate.getTime() === today.getTime()) {
    grouped.today.push(activity);
  } else if (timestampDate.getTime() === yesterday.getTime()) {
    grouped.yesterday.push(activity);
  } else if (
    timestamp > today &&
    timestamp.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000
  ) {
    grouped.thisWeek.push(activity);
  } else if (
    timestamp.getMonth() === now.getMonth() &&
    timestamp.getFullYear() === now.getFullYear()
  ) {
    grouped.thisMonth.push(activity);
  } else if (timestamp.getFullYear() === now.getFullYear()) {
    grouped.thisYear.push(activity);
  } else {
    const year = timestamp.getFullYear().toString();
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(activity);
  }
}
