import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TokenDayData {
  priceUSD: string;
  date: number;
}

export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  balanceUSD: number;
  priceUSD: number;
  priceChange: number;
  derivedETH: string;
  decimals: number;
  chainId: number;
  address: string;
  isNative: boolean;
}

export interface TokensState {
  prices: TokenData[];
  midnightPrices: TokenData[];
  ethPrice: string;
  lastUpdated: number;
  isLoading: boolean;
}

const initialState: TokensState = {
  prices: [],
  midnightPrices: [],
  ethPrice: "0",
  lastUpdated: 0,
  isLoading: false,
};

export const tokensSlice = createSlice({
  name: "tokens",
  initialState,
  reducers: {
    updateTokenPrices: (
      state,
      action: PayloadAction<{
        prices: TokenData[];
        midnightPrices: TokenData[];
        ethPrice: string;
      }>
    ) => {
      state.prices = action.payload.prices;
      state.midnightPrices = action.payload.midnightPrices;
      state.ethPrice = action.payload.ethPrice;
      state.lastUpdated = Date.now();
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { updateTokenPrices, setLoading } = tokensSlice.actions;
export default tokensSlice.reducer;
