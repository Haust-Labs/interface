import { mocked } from 'test-utils/mocked'

import useAutoRouterSupported from './useAutoRouterSupported'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'

jest.mock('@web3-react/core', () => {
  return {
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})
jest.mock('./useAutoRouterSupported')
jest.mock('./useClientSideV3Trade')
jest.mock('./useDebounce')
jest.mock('./useIsWindowVisible')
jest.mock('state/routing/useRoutingAPITrade')
jest.mock('state/user/hooks')

beforeEach(() => {
  // ignore debounced value
  mocked(useDebounce).mockImplementation((value) => value)

  mocked(useIsWindowVisible).mockReturnValue(true)
  mocked(useAutoRouterSupported).mockReturnValue(true)
})
