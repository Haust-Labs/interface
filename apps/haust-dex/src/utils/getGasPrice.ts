import { Currency, TradeType, Percent } from "@uniswap/sdk-core";
import { InterfaceTrade } from "state/routing/types";

interface GasEstimate {
  gasEstimateInUSD: number | null;
}

interface SwapCallbackParams {
  trade: InterfaceTrade<Currency, Currency, TradeType>;
  allowedSlippage: Percent;
  deadline?: number | undefined;
  fiatValues: { amountIn?: number; amountOut?: number };
  permit?: any;
  transaction: any;
}

export async function calculateGasEstimate(
  params: SwapCallbackParams,
  provider: any
): Promise<GasEstimate> {
  try {
    const transaction = params.transaction;

    if (!transaction) {
      throw new Error("Transaction is required for gas estimation");
    }

    const gasPrice = await provider.getGasPrice();

    const estimatedGas = await provider.estimateGas(transaction);

    const gasEstimateInWei = gasPrice * estimatedGas;

    const ethPriceInUSD = await getETHPrice();

    const gasEstimateInUSD = (Number(gasEstimateInWei) / 1e18) * ethPriceInUSD;

    return {
      gasEstimateInUSD,
    };
  } catch (error) {
    console.error("Error calculating gas estimate:", error);
    return {
      gasEstimateInUSD: null,
    };
  }
}

async function getETHPrice(): Promise<number> {
  return 0;
}
