interface TokenDescription {
  description?: string;
  link?: string;
  homepageUrl?: string;
  twitterName?: string;
}

export const tokenDescriptions: Record<string, TokenDescription> = {
  WETH: {
    description:
      "Ethereum is a smart contract platform that enables developers to build tokens and decentralized applications (dapps). ETH is the native currency for the Ethereum platform and also works as the transaction fees to miners on the Ethereum network. Ethereum is the pioneer for blockchain based smart contracts. Smart contract is essentially a computer code that runs exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference. It can facilitate the exchange of money, content, property, shares, or anything of value. When running on the blockchain a smart contract becomes like a self-operating computer program that automatically executes when specific conditions are met. Ethereum allows programmers to run complete-turing smart contracts that is capable of any customizations. Rather than giving a set of limited operations, Ethereum allows developers to have complete control over customization of their smart contract, giving developers the power to build unique and innovative applications. Ethereum being the first blockchain based smart contract platform, they have gained much popularity, resulting in new competitors fighting for market share. The competitors includes: Ethereum Classic which is the oldchain of Ethereum, Qtum, EOS, Neo, Icon, Tron and Cardano. Ethereum wallets are fairly simple to set up with multiple popular choices such as myetherwallet, metamask, and Trezor. Read here for more guide on using ethereum wallet: How to Use an Ethereum Wallet",
    link: "https://weth.io",
    homepageUrl: "https://haust.network/",
    twitterName: "HaustNetwork",
  },
  USDT: {
    description: `Tether (USDT) is a cryptocurrency with a value meant to mirror the value of the U.S. dollar. The idea was to create a stable cryptocurrency that can be used like digital dollars. Coins that serve this purpose of being a stable dollar substitute are called "stable coins." Tether is the most popular stable coin and even acts as a dollar replacement on many popular exchanges! According to their site, Tether converts cash into digital currency, to anchor or "tether" the value of the coin to the price of national currencies like the US dollar, the Euro, and the Yen. Like other cryptos it uses blockchain. Unlike other cryptos, it is [according to the official Tether site] "100% backed by USD" (USD is held in reserve). The primary use of Tether is that it offers some stability to the otherwise volatile crypto space and offers liquidity to exchanges who can't deal in dollars and with banks (for example to the sometimes controversial but leading exchange Bitfinex). The digital coins are issued by a company called Tether Limited that is governed by the laws of the British Virgin Islands, according to the legal part of its website. It is incorporated in Hong Kong. It has emerged that Jan Ludovicus van der Velde is the CEO of cryptocurrency exchange Bitfinex, which has been accused of being involved in the price manipulation of bitcoin, as well as tether. Many people trading on exchanges, including Bitfinex, will use tether to buy other cryptocurrencies like bitcoin. Tether Limited argues that using this method to buy virtual currencies allows users to move fiat in and out of an exchange more quickly and cheaply. Also, exchanges typically have rocky relationships with banks, and using Tether is a way to circumvent that. USDT is fairly simple to use. Once on exchanges like Poloniex or Bittrex, it can be used to purchase Bitcoin and other cryptocurrencies. It can be easily transferred from an exchange to any Omni Layer enabled wallet. Tether has no transaction fees, although external wallets and exchanges may charge one. In order to convert USDT to USD and vise versa through the Tether.to Platform, users must pay a small fee. Buying and selling Tether for Bitcoin can be done through a variety of exchanges like the ones mentioned previously or through the Tether.to platform, which also allows the conversion between USD to and from your bank account.`,
    link: "https://tether.to",
    homepageUrl: "https://haust.network/",
    twitterName: "HaustNetwork",
  },
  USDC: {
    description:
      "USDC is a fully collateralized US dollar stablecoin. USDC is the bridge between dollars and trading on cryptocurrency exchanges. The technology behind CENTRE makes it possible to exchange value between people, businesses and financial institutions just like email between mail services and texts between SMS providers. We believe by removing artificial economic borders, we can create a more inclusive global economy.",
    link: "https://www.circle.com/usdc",
    homepageUrl: "https://haust.network/",
    twitterName: "HaustNetwork",
  },
  WHAUST: {
    description:
      "HAUST is a smart contract platform that enables developers to build tokens and decentralized applications (dapps). HAUST is the native currency for the HAUST platform and also works as the transaction fees to miners on the HAUST network. HAUST is the pioneer for blockchain based smart contracts. Smart contract is essentially a computer code that runs exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference. It can facilitate the exchange of money, content, property, shares, or anything of value. When running on the blockchain a smart contract becomes like a self-operating computer program that automatically executes when specific conditions are met. HAUST allows programmers to run complete-turing smart contracts that is capable of any customizations. Rather than giving a set of limited operations, HAUST allows developers to have complete control over customization of their smart contract, giving developers the power to build unique and innovative applications. HAUST being the first blockchain based smart contract platform, they have gained much popularity, resulting in new competitors fighting for market share. The competitors includes: Ethereum Classic which is the oldchain of HAUST, Qtum, EOS, Neo, Icon, Tron and Cardano. HAUST wallets are fairly simple to set up with multiple popular choices such as myetherwallet, metamask, and Trezor. Read here for more guide on using HAUST wallet: How to Use an HAUST Wallet",
    link: "https://makerdao.com",
    homepageUrl: "https://haust.network/",
    twitterName: "HaustNetwork",
  },
  HAUST: {
    description:
      "HAUST is a smart contract platform that enables developers to build tokens and decentralized applications (dapps). HAUST is the native currency for the HAUST platform and also works as the transaction fees to miners on the HAUST network. HAUST is the pioneer for blockchain based smart contracts. Smart contract is essentially a computer code that runs exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference. It can facilitate the exchange of money, content, property, shares, or anything of value. When running on the blockchain a smart contract becomes like a self-operating computer program that automatically executes when specific conditions are met. HAUST allows programmers to run complete-turing smart contracts that is capable of any customizations. Rather than giving a set of limited operations, HAUST allows developers to have complete control over customization of their smart contract, giving developers the power to build unique and innovative applications. HAUST being the first blockchain based smart contract platform, they have gained much popularity, resulting in new competitors fighting for market share. The competitors includes: Ethereum Classic which is the oldchain of HAUST, Qtum, EOS, Neo, Icon, Tron and Cardano. HAUST wallets are fairly simple to set up with multiple popular choices such as myetherwallet, metamask, and Trezor. Read here for more guide on using HAUST wallet: How to Use an HAUST Wallet",
    link: "https://makerdao.com",
    homepageUrl: "https://haust.network/",
    twitterName: "HaustNetwork",
  },
  WBTC: {
    link: "https://makerdao.com",
    homepageUrl: "https://haust.network/",
    twitterName: "HaustNetwork",
  },
};

export const getTokenDescription = (
  symbol: string
): TokenDescription | undefined => {
  return tokenDescriptions[symbol.toUpperCase()];
};
