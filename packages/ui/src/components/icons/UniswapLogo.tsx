import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [UniswapLogo, AnimatedUniswapLogo] = createIcon({
  name: 'UniswapLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 36 36" fill="none" {...props}>
      <Path
        d="M13.789 27H10.8V22.0909C10.8 20.4078 12.1382 19.0434 13.789 19.0434V16.3869C12.1382 16.3869 10.8 15.0225 10.8 13.3394V9H13.789V16.3869H22.2111V9H25.2V27H22.2111V19.0434H13.789V27Z"
        fill="#121417"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
})
