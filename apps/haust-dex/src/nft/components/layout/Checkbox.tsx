import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { ApprovedCheckmarkIcon } from 'nft/components/icons'
import React from 'react'

import * as styles from './Checkbox.css'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hovered: boolean
  children?: React.ReactNode
}

export const Checkbox: React.FC<CheckboxProps> = ({ hovered, children, ...props }: CheckboxProps) => {
  return (
    <Box
      as="label"
      display="flex"
      alignItems="center"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      lineHeight="1"
    >
      {children && children}
      <Box
        as="span"
        borderColor={props.checked || hovered ? 'gray400' : 'gray400'}
        className={styles.checkbox}
        background={props.checked ? 'white' : undefined}
        // This element is purely decorative so
        // we hide it for screen readers
        aria-hidden="true"
      >
        {/* Add gray dot when hovered and not checked */}
        {hovered && !props.checked && (
          <Box
          as="span"
          position="absolute"
          style={{
            top: '50%',
            left: '40%',
            transform: 'translate(-50%, -40%)',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: '#6C7284',
            opacity: 1,
            transition: 'opacity 125ms ease-in-out'
          }}
          />
        )}
      </Box>
      <input {...props} className={styles.input} type="checkbox" />
      <ApprovedCheckmarkIcon className={clsx(styles.checkMark, props.checked && styles.checkMarkActive)} />
    </Box>
  )
}
