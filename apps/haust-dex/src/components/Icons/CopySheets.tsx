import { ComponentProps } from 'react'

export const CopySheets = (props: ComponentProps<'svg'>) => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ cursor: 'pointer' }}
      {...props}
    >
      <path
        d="M18.375 6.25H9.625C7.448 6.25 6.25 7.448 6.25 9.625V18.375C6.25 20.552 7.448 21.75 9.625 21.75H18.375C20.552 21.75 21.75 20.552 21.75 18.375V9.625C21.75 7.448 20.552 6.25 18.375 6.25ZM20.25 18.375C20.25 19.707 19.707 20.25 18.375 20.25H9.625C8.293 20.25 7.75 19.707 7.75 18.375V9.625C7.75 8.293 8.293 7.75 9.625 7.75H18.375C19.707 7.75 20.25 8.293 20.25 9.625V18.375ZM3.75 5.62V14.38C3.75 15.578 4.23309 15.873 4.39209 15.971C4.74609 16.187 4.85589 16.649 4.63989 17.002C4.49789 17.233 4.25202 17.36 3.99902 17.36C3.86602 17.36 3.72991 17.324 3.60791 17.25C2.70691 16.698 2.25 15.733 2.25 14.38V5.62C2.25 3.478 3.47912 2.25 5.62012 2.25H14.3799C16.0649 2.25 16.87 2.98897 17.25 3.60797C17.466 3.96097 17.355 4.42298 17.002 4.63898C16.648 4.85598 16.1879 4.74399 15.9709 4.39099C15.8739 4.23199 15.5779 3.74902 14.3799 3.74902H5.62012C4.29212 3.75002 3.75 4.292 3.75 5.62Z"
        fill="currentColor"
      />
    </svg>
)
