import { Send } from 'components/Icons/Send'
import { SwapV2 } from 'components/Icons/SwapV2'
import { useLocation } from 'react-router-dom'

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
  disabled?: boolean
}

export type TabsItem = MenuItem & {
  icon?: JSX.Element
  quickKey: string
}

export const useTabsContent = (): TabsSection[] => {
  const { pathname } = useLocation()

  return [
    {
      title: 'Trade',
      href: '/swap',
      isActive: pathname.startsWith('/swap') || pathname.startsWith('/send'),
      items: [
        {
          label: 'Swap',
          icon: <SwapV2 fill='#9B9B9B' />,
          quickKey: 'U',
          href: '/swap',
          internal: true,
        },
        {
          label: 'Send',
          icon: <Send fill='#9B9B9B' />,
          quickKey: 'E',
          href: '/send',
          internal: true,
        },
      ],
    },
    {
      title:'Explore',
      href: '/explore/tokens',
      isActive: pathname.startsWith('/explore'),
      disabled: true,
      items: [
        { label: 'Tokens', quickKey: 'T', href: '/explore/tokens', internal: true },
        { label:'Pools', quickKey: 'P', href: '/explore/pools', internal: true },
        {
          label: 'Transactions',
          quickKey: 'X',
          href: `/explore/transactions/ethereum`,
          internal: true,
        },
      ],
    },
    {
      title: 'Pool',
      href: '/pool',
      isActive: pathname.startsWith('/pool'),
      items: [
        { label: 'View position', quickKey: 'V', href: '/pool', internal: true },
        {
          label: 'Create Position',
          quickKey: 'V',
          href: '/add',
          internal: true,
        },
      ],
    },
  ]
}
