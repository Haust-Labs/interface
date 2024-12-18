import { Address } from 'conedison/types'
import { QRCode } from './QRCode'
import { Flex } from 'rebass'
import { memo, PropsWithChildren } from 'react'
import { colors } from 'theme/colors'

export type BaseQRProps = {
  size: number
  eyeSize?: number
  color: string
}

type AddressQRCodeProps = BaseQRProps & {
  address: Address
  backgroundColor?: string
}

function AddressQRCode({ address, size, eyeSize, backgroundColor, color }: AddressQRCodeProps): JSX.Element {
  return (
    <QRCode
      backgroundColor={backgroundColor}
      color={color}
      eyeSize={eyeSize}
      overlayColor={colors.blue800}
      size={size}
      value={address}
    />
  )
}

type QRCodeDisplayProps = BaseQRProps & {
  encodedValue: string
  containerBackgroundColor?: string
}

const _QRCodeDisplay = ({
  encodedValue,
  size,
  eyeSize,
  color,
  containerBackgroundColor,
  children,
}: PropsWithChildren<QRCodeDisplayProps>): JSX.Element => {
  return (
    <Flex alignItems="center" backgroundColor={containerBackgroundColor} justifyContent="center" style={{position: 'relative'}}>
      <AddressQRCode
        address={encodedValue}
        backgroundColor={containerBackgroundColor}
        color={color}
        eyeSize={eyeSize}
        size={size}
      />
      <Flex
        alignItems="center"
        backgroundColor="$transparent"
        style={{borderRadius: '100%', overflow: 'visible', padding: '2px', position: 'absolute'}}
      >
        {children}
      </Flex>
    </Flex>
  )
}

export const QRCodeDisplay = memo(_QRCodeDisplay)
