import { createAction } from "@reduxjs/toolkit";

export enum Field {
  INPUT = "INPUT",
  ADDRESS = "ADDRESS",
}

export const selectCurrency = createAction<{
  field: Field;
  currencyId: string;
}>("send/selectCurrency");
export const typeInput = createAction<{ field: Field; typedValue: string }>(
  "send/typeInput"
);
export const typeAddressInput = createAction<{ field: Field; address: string }>(
  "send/typeAddressInput"
);
export const replaceSendState = createAction<{
  field: Field;
  typedValue: string;
  inputCurrencyId?: string;
  recipient: string | null;
  address: string;
}>("send/replaceSendState");
export const setRecipient = createAction<{ recipient: string | null }>(
  "send/setRecipient"
);
