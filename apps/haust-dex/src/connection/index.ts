import { ChainId } from "@uniswap/smart-order-router";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import { initializeConnector, Web3ReactHooks } from "@web3-react/core";
import { GnosisSafe } from "@web3-react/gnosis-safe";
import { MetaMask } from "@web3-react/metamask";
import { Network } from "@web3-react/network";
import { Actions, Connector } from "@web3-react/types";
import COINBASE_ICON from "assets/images/coinbaseWalletIcon.svg";
import GNOSIS_ICON from "assets/images/gnosis.png";
import METAMASK_ICON from "assets/images/metamask.svg";
import MOONSEENROSE_LOGO from "assets/images/moonseenrose-logo.png";
import WALLET_CONNECT_ICON from "assets/images/walletConnectIcon.svg";
import RABBY_ICON from "assets/images/logo-rabby.svg";
import { SupportedChainId } from "constants/chains";
import { useCallback, useSyncExternalStore } from "react";
import { isMobile } from "utils/userAgent";

import { RPC_URLS } from "../constants/networks";
import { RPC_PROVIDERS } from "../constants/providers";
import {
  getIsCoinbaseWallet,
  getIsInjected,
  getIsMetaMaskWallet,
} from "./utils";
import { WalletConnectV2 } from "./WalletConnect";

export enum ConnectionType {
  INJECTED = "INJECTED",
  COINBASE_WALLET = "COINBASE_WALLET",
  WALLET_CONNECT_V2 = "WALLET_CONNECT_V2",
  NETWORK = "NETWORK",
  GNOSIS_SAFE = "GNOSIS_SAFE",
  RABBY = "RABBY",
}

export interface Connection {
  getName(): string;
  connector: Connector;
  hooks: Web3ReactHooks;
  type: ConnectionType;
  getIcon?(isDarkMode: boolean): string;
  shouldDisplay(): boolean;
  overrideActivate?: () => boolean;
  isNew?: boolean;
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`);
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) =>
    new Network({ actions, urlMap: RPC_PROVIDERS, defaultChainId: 1 })
);
export const networkConnection: Connection = {
  getName: () => "Network",
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
  shouldDisplay: () => false,
};

const getIsCoinbaseWalletBrowser = () => isMobile && getIsCoinbaseWallet();
const getIsMetaMaskBrowser = () => isMobile && getIsMetaMaskWallet();
const getIsInjectedMobileBrowser = () =>
  getIsCoinbaseWalletBrowser() || getIsMetaMaskBrowser();

const getShouldAdvertiseMetaMask = () =>
  !getIsMetaMaskWallet() &&
  !isMobile &&
  (!getIsInjected() || getIsCoinbaseWallet());
const getIsGenericInjector = () =>
  getIsInjected() && !getIsMetaMaskWallet() && !getIsCoinbaseWallet();

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions, onError })
);

const [web3MetaMask, web3MetaMaskHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions, onError })
);

const metaMaskConnection: Connection = {
  getName: () => "MetaMask",
  connector: web3MetaMask,
  hooks: web3MetaMaskHooks,
  type: ConnectionType.INJECTED,
  getIcon: () => METAMASK_ICON,
  shouldDisplay: () => true,
  overrideActivate: () => {
    if (!getIsMetaMaskWallet()) {
      window.open("https://metamask.io/", "inst_metamask");
      return true;
    }
    return false;
  },
};

const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>(
  (actions) => new GnosisSafe({ actions })
);
export const gnosisSafeConnection: Connection = {
  getName: () => "Gnosis Safe",
  connector: web3GnosisSafe,
  hooks: web3GnosisSafeHooks,
  type: ConnectionType.GNOSIS_SAFE,
  getIcon: () => GNOSIS_ICON,
  shouldDisplay: () => false,
};

export const walletConnectV2Connection: Connection = new (class
  implements Connection
{
  private initializer = (
    actions: Actions,
    defaultChainId = SupportedChainId.HAUST_TESTNET
  ) => new WalletConnectV2({ actions, defaultChainId, onError });

  type = ConnectionType.WALLET_CONNECT_V2;
  getName = () => "WalletConnect";
  getIcon = () => WALLET_CONNECT_ICON;
  shouldDisplay = () => !getIsInjectedMobileBrowser();

  private activeConnector = initializeConnector<WalletConnectV2>(
    this.initializer
  );
  // The web3-react Provider requires referentially stable connectors, so we use proxies to allow lazy connections
  // whilst maintaining referential equality.
  private proxyConnector = new Proxy(
    {},
    {
      get: (target, p, receiver) =>
        Reflect.get(this.activeConnector[0], p, receiver),
      getOwnPropertyDescriptor: (target, p) =>
        Reflect.getOwnPropertyDescriptor(this.activeConnector[0], p),
      getPrototypeOf: () => WalletConnectV2.prototype,
      set: (target, p, receiver) =>
        Reflect.set(this.activeConnector[0], p, receiver),
    }
  ) as (typeof this.activeConnector)[0];
  private proxyHooks = new Proxy(
    {},
    {
      get: (target, p, receiver) => {
        return () => {
          // Because our connectors are referentially stable (through proxying), we need a way to trigger React renders
          // from outside of the React lifecycle when our connector is re-initialized. This is done via 'change' events
          // with `useSyncExternalStore`:
          const hooks = useSyncExternalStore(
            (onChange) => {
              this.onActivate = onChange;
              return () => (this.onActivate = undefined);
            },
            () => this.activeConnector[1]
          );
          return Reflect.get(hooks, p, receiver)();
        };
      },
    }
  ) as (typeof this.activeConnector)[1];

  private onActivate?: () => void;

  overrideActivate = (chainId?: SupportedChainId) => {
    // Always re-create the connector, so that the chainId is updated.
    this.activeConnector = initializeConnector((actions) =>
      this.initializer(actions, chainId)
    );
    this.onActivate?.();
    return false;
  };

  get connector() {
    return this.proxyConnector;
  }
  get hooks() {
    return this.proxyHooks;
  }
})();

const [web3CoinbaseWallet, web3CoinbaseWalletHooks] =
  initializeConnector<CoinbaseWallet>(
    (actions) =>
      new CoinbaseWallet({
        actions,
        options: {
          url: RPC_URLS[SupportedChainId.HAUST][0],
          appName: "Haust DEX",
          appLogoUrl: MOONSEENROSE_LOGO,
          reloadOnDisconnect: false,
        },
        onError,
      })
  );

const coinbaseWalletConnection: Connection = {
  getName: () => "Coinbase Wallet",
  connector: web3CoinbaseWallet,
  hooks: web3CoinbaseWalletHooks,
  type: ConnectionType.COINBASE_WALLET,
  getIcon: () => COINBASE_ICON,
  shouldDisplay: () =>
    Boolean(
      (isMobile && !getIsInjectedMobileBrowser()) ||
        !isMobile ||
        getIsCoinbaseWalletBrowser()
    ),
  // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
  overrideActivate: () => {
    if (isMobile && !getIsInjectedMobileBrowser()) {
      window.open("https://go.cb-w.com/mtUDhEZPy1", "cbwallet");
      return true;
    }
    return false;
  },
};

const getIsRabbyWallet = () => {
  const { ethereum } = window as any;
  return ethereum?.isRabby === true;
};

const [web3Rabby, web3RabbyHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions, onError })
);

const rabbyConnection: Connection = {
  getName: () => "Rabby",
  connector: web3Rabby,
  hooks: web3RabbyHooks,
  type: ConnectionType.RABBY,
  getIcon: () => RABBY_ICON,
  shouldDisplay: () => true,
  overrideActivate: () => {
    if (!getIsRabbyWallet()) {
      window.open("https://rabby.io/", "rabby");
      return true;
    }
    return false;
  },
};

export function getConnections() {
  return [
    metaMaskConnection,
    rabbyConnection,
    walletConnectV2Connection,
    coinbaseWalletConnection,
    gnosisSafeConnection,
    networkConnection,
  ];
}

export function useGetConnection() {
  return useCallback((c: Connector | ConnectionType) => {
    if (c instanceof Connector) {
      const connection = getConnections().find(
        (connection) => connection.connector === c
      );
      if (!connection) {
        throw Error("unsupported connector");
      }
      return connection;
    } else {
      switch (c) {
        case ConnectionType.INJECTED:
          return metaMaskConnection;
        case ConnectionType.COINBASE_WALLET:
          return coinbaseWalletConnection;
        case ConnectionType.WALLET_CONNECT_V2:
          return walletConnectV2Connection;
        case ConnectionType.NETWORK:
          return networkConnection;
        case ConnectionType.GNOSIS_SAFE:
          return gnosisSafeConnection;
        case ConnectionType.RABBY:
          return rabbyConnection;
      }
    }
  }, []);
}
