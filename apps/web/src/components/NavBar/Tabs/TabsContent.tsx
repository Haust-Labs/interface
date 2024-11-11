import { Send } from 'components/Icons/Send'
import { SwapV2 } from 'components/Icons/SwapV2'
import { useTheme } from 'lib/styled-components'
import { useLocation } from 'react-router-dom'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useTranslation } from 'uniswap/src/i18n'

interface MenuItem {
  label: string
  href: string
  internal?: boolean
  overflow?: boolean
  closeMenu?: () => void
}

export type TabsSection = {
  title: string
  href: string
  isActive?: boolean
  items?: TabsItem[]
  closeMenu?: () => void
}

export type TabsItem = MenuItem & {
  icon?: JSX.Element
  quickKey: string
}

export const useTabsContent = (): TabsSection[] => {
  const { t } = useTranslation()
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)
  const { pathname } = useLocation()
  const theme = useTheme()

  return [
    {
      title: t('common.trade'),
      href: '/swap',
      isActive: pathname.startsWith('/swap') || pathname.startsWith('/limit') || pathname.startsWith('/send'),
      items: [
        {
          label: t('common.swap'),
          icon: <SwapV2 fill={theme.neutral2} />,
          quickKey: 'U',
          href: '/swap',
          internal: true,
        },
        {
          label: t('common.send.button'),
          icon: <Send fill={theme.neutral2} />,
          quickKey: 'E',
          href: '/send',
          internal: true,
        },
      ],
    },
    {
      title: t('common.explore'),
      href: '/explore',
      isActive: pathname.startsWith('/explore'),
      items: [
        { label: t('common.tokens'), quickKey: 'T', href: '/explore/tokens', internal: true },
        { label: t('common.pools'), quickKey: 'P', href: '/explore/pools', internal: true },
        {
          label: t('common.transactions'),
          quickKey: 'X',
          href: `/explore/transactions${isMultichainExploreEnabled ? '/ethereum' : ''}`,
          internal: true,
        },
      ],
    },
    {
      title: t('common.pool'),
      href: '/pool',
      isActive: pathname.startsWith('/pool'),
      items: [
        { label: t('nav.tabs.viewPosition'), quickKey: 'V', href: '/pool', internal: true },
        {
          label: t('nav.tabs.createPosition'),
          quickKey: 'V',
          href: '/add',
          internal: true,
        },
      ],
    },
  ]
}
