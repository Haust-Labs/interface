import { WalletConnect, WalletConnectConstructorArgs } from '@web3-react/walletconnect-v2'
import { L1_CHAIN_IDS, L2_CHAIN_IDS } from 'constants/chains';
import { RPC_URLS } from 'constants/networks'
import { Z_INDEX } from 'theme/zIndex';

// Avoid testing for the best URL by only passing a single URL per chain.
// Otherwise, WC will not initialize until all URLs have been tested (see getBestUrl in web3-react).
const RPC_URLS_WITHOUT_FALLBACKS = Object.entries(RPC_URLS).reduce(
  (map, [chainId, urls]) => ({
    ...map,
    [chainId]: urls[0],
  }),
  {}
)

const DISCONNECT_TIMEOUT_MS = 5_000

export class WalletConnectV2 extends WalletConnect {
  ANALYTICS_EVENT = 'Wallet Connect QR Scan'
  constructor({
                actions,
                defaultChainId,
                qrcode = true,
                onError,
              }: Omit<WalletConnectConstructorArgs, 'options'> & { defaultChainId: number; qrcode?: boolean }) {
    const darkmode = Boolean(window.matchMedia('(prefers-color-scheme: dark)'))
    super({
      actions,
      options: {
        projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
        chains: [defaultChainId],
        optionalChains: [...L1_CHAIN_IDS, ...L2_CHAIN_IDS],
        showQrModal: qrcode,
        rpcMap: RPC_URLS_WITHOUT_FALLBACKS,
        // as of 6/16/2023 there are no docs for `optionalMethods`
        // this set of optional methods fixes a bug we encountered where permit2 signatures were never received from the connected wallet
        // source: https://uniswapteam.slack.com/archives/C03R5G8T8BH/p1686858618164089?thread_ts=1686778867.145689&cid=C03R5G8T8BH
        optionalMethods: ['eth_signTypedData', 'eth_signTypedData_v4', 'eth_sign'],
        qrModalOptions: {
          desktopWallets: undefined,
          enableExplorer: true,
          explorerExcludedWalletIds: undefined,
          explorerRecommendedWalletIds: undefined,
          mobileWallets: undefined,
          privacyPolicyUrl: undefined,
          termsOfServiceUrl: undefined,
          themeMode: darkmode ? 'dark' : 'light',
          themeVariables: {
            '--wcm-font-family': '"Inter custom", sans-serif',
            '--wcm-z-index': Z_INDEX.modal.toString(),
          },
          walletImages: undefined,
        },
      },
      onError,
    })
  }

  private pendingDeactivation?: Promise<void>

  async activate(chainId?: number) {
    await this.pendingDeactivation
    return super.activate(chainId)
  }

  /**
   * Ends the session but keeps the WalletConnect client. The base class drops the client and creates a new one on the next
   * connection, while the old one stays alive with the same client id and shared subscriptions: once it reconnects to the
   * relay, it receives (and cannot decrypt) the wallet's responses to the new client, so the connection hangs.
   */
  async deactivate() {
    this.actions.resetState()
    this.pendingDeactivation = this.endSession()
    await this.pendingDeactivation
  }

  private async endSession() {
    let timer: number | undefined
    try {
      await Promise.race([
        this.provider?.disconnect(),
        new Promise((_, reject) => {
          timer = window.setTimeout(() => reject(new Error('WalletConnect disconnect timed out')), DISCONNECT_TIMEOUT_MS)
        }),
      ])
    } catch (error) {
      console.warn('Failed to end the WalletConnect session', error)
      await super.deactivate()
    } finally {
      window.clearTimeout(timer)
    }
  }
}
