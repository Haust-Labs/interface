import { ComponentProps } from 'react'

export const InfoIcon = (props: ComponentProps<'svg'>) => (
  <svg 
    width="13" 
    height="13" 
    viewBox="0 0 13 13" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_10867_1033)">
      <path 
        d="M6.5 11.9166C9.49154 11.9166 11.9167 9.49152 11.9167 6.49998C11.9167 3.50844 9.49154 1.08331 6.5 1.08331C3.50845 1.08331 1.08333 3.50844 1.08333 6.49998C1.08333 9.49152 3.50845 11.9166 6.5 11.9166Z" 
        stroke="#3D4449" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M6.5 9.20833L6.5 5.6875" 
        stroke="#3D4449" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M6.5 3.79169H6.50542" 
        stroke="#3D4449" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_10867_1033">
        <rect width="13" height="13" fill="white"/>
      </clipPath>
    </defs>
  </svg>
)

export default InfoIcon
