import { colors } from "theme/colors";

interface WalletPattern {
  background: string;
  pattern: string;
}

const COLOR_SCHEMES = {
  METAMASK: {
    background: `linear-gradient(135deg, ${colors.primaryBase}, ${colors.aquaBlue}, ${colors.primaryDark})`,
  },
  RABBY: {
    background: `linear-gradient(135deg, ${colors.primaryBase}, ${colors.aquaBlue}, ${colors.primaryDark})`,
  },
  COINBASE: {
    background: `linear-gradient(45deg, ${colors.neutralLightest}, ${colors.aquaBlue}, ${colors.primaryDark})`,
  },
  WALLET_CONNECT: {
    background: `linear-gradient(90deg, ${colors.primaryBase}, ${colors.aquaBlue}, ${colors.primaryDark})`,
  },
  TRUST_WALLET: {
    background: `linear-gradient(180deg, ${colors.neutralLightest}, ${colors.primaryBase}, ${colors.primaryDark})`,
  },
  LEDGER: {
    background: `linear-gradient(225deg, ${colors.aquaBlue}, ${colors.primaryBase}, ${colors.primaryDark})`,
  },
};


export function generateWalletPattern(address: string): WalletPattern {
  const hash = address.slice(2, 10);
  const patternSeed = parseInt(hash.slice(0, 4), 16);

  const providerIndex = patternSeed % Object.keys(COLOR_SCHEMES).length;
  const scheme = Object.values(COLOR_SCHEMES)[providerIndex];

  return {
    background: scheme.background,
    pattern: "",
  };
}

export type { WalletPattern };
