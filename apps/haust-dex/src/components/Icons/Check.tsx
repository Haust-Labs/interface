import { ComponentProps } from 'react'

export const Check = (props: ComponentProps<'svg'>) => (
  <svg stroke="currentColor" viewBox="0 0 48 48" fill="none" strokeWidth="5" strokeLinecap="round" {...props}>
    <line x1="11" y1="26" x2="18" y2="33" stroke="currentColor" />
    <line x1="18" y1="33" x2="38" y2="14" stroke="currentColor" />
  </svg>
)

export const AnimatedCheck = (props: ComponentProps<'svg'>) => (
  <svg stroke="currentColor" viewBox="0 0 48 48" fill="none" strokeWidth="5" strokeLinecap="round" {...props}>
    <line x1="11" y1="26" x2="18" y2="33" stroke="currentColor" />
    <line x1="18" y1="33" x2="38" y2="14" stroke="currentColor" />
  </svg>
)
