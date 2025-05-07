const tokenNameMapping: Record<string, string> = {
  'Tether USD': 'Tether',
  'Wrapped Bitcoin': 'Bitcoin',
  'Wrapped Ether': 'Ethereum',
};

export const getCorrectName = (tokenSymbol: string): string => {
  return tokenNameMapping[tokenSymbol] || tokenSymbol;
};
