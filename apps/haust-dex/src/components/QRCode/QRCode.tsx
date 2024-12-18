// Component logic from: https://github.com/awesomejerry/react-native-qrcode-svg
// Custom matrix renderer from: https://github.com/awesomejerry/react-native-qrcode-svg/pull/139/files

import { create, QRCodeSegment } from 'qrcode'
import { useMemo } from 'react'

import { BaseQRProps } from './QRCodeDisplay'

export interface QRCodeProps extends BaseQRProps {
  /* what the qr code stands for */
  value: string
  /* the whole component size */
  backgroundColor?: string
  /* the color of the background */
  overlayColor: string
  /* quiet zone in pixels */
  quietZone?: number
}

interface SVGPartProps {
  x?: number
  y?: number
  size: number
}

// x and y attributes are not supported on <g> elements on web. Likewise, they are not supported on svg elements on React Native.
// Solution is to wrap with <svg> and pass x and y values to both.
const QREyes = ({
  x = -1,
  y = -1,
  fillColor,
  size,
}: SVGPartProps & {
  fillColor?: string
}): JSX.Element => (
  <svg x={x} y={y}>
    <g transform={`scale(${size / 120})`} x={x} y={y}>
      <path
        clipRule="evenodd"
        d="M0 12C0 5.37258 5.37258 0 12 0H28C34.6274 0 40 5.37258 40 12V28C40 34.6274 34.6274 40 28 40H12C5.37258 40 0 34.6274 0 28V12ZM28 6.27451H12C8.8379 6.27451 6.27451 8.8379 6.27451 12V28C6.27451 31.1621 8.8379 33.7255 12 33.7255H28C31.1621 33.7255 33.7255 31.1621 33.7255 28V12C33.7255 8.8379 31.1621 6.27451 28 6.27451Z"
        fill={fillColor}
        fillRule="evenodd"
      />
      <path
        d="M11 17C11 13.6863 13.6863 11 17 11H23C26.3137 11 29 13.6863 29 17V23C29 26.3137 26.3137 29 23 29H17C13.6863 29 11 26.3137 11 23V17Z"
        fill={fillColor}
      />
    </g>
  </svg>
)

const QREyeBG = ({
  x = -1,
  y = -1,
  size,
  backgroundColor,
}: SVGPartProps & {
  backgroundColor?: string
}): JSX.Element => (
  <svg x={x} y={y}>
    <g transform={`scale(${size / 120})`} x={x} y={y}>
      <path d="M0 0H40V40H0V0Z" fill={backgroundColor} />
    </g>
  </svg>
)

const QREyeWrapper = ({
  x = 0,
  y = 0,
  backgroundColor,
  overlayColor,
  fillColor,
  size,
}: SVGPartProps & {
  backgroundColor?: string
  overlayColor?: string
  fillColor?: string
}): JSX.Element => (
  <>
    <QREyeBG backgroundColor={backgroundColor} size={size} x={x} y={y} />
    <QREyes fillColor={fillColor} size={size} x={x} y={y} />
    <QREyes fillColor={overlayColor} size={size} x={x} y={y} />
  </>
)

function transformMatrixIntoCirclePath(
  matrix: number[][],
  size: number,
): {
  cellSize: number
  path: string
} {
  const cellSize = size / matrix.length
  const radius = cellSize / 2
  let path = ''

  matrix.forEach((row, i) => {
    row.forEach((column: number, j: number) => {
      if (column) {
        const cx = j * cellSize + radius
        const cy = i * cellSize + radius

        path += `
          M ${cx - radius},${cy}
          A ${radius},${radius} 0 1,0 ${cx + radius},${cy}
          A ${radius},${radius} 0 1,0 ${cx - radius},${cy}
        `
      }
    })
  })

  return {
    cellSize,
    path,
  }
}

function genMatrix(value: string | QRCodeSegment[]): number[][] {
  const arr = Array.prototype.slice.call(create(value).modules.data, 0)
  const sqrt = Math.sqrt(arr.length)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return arr.reduce(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (rows, key, index) => (index % sqrt === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows,
    [],
  )
}

export function QRCode({
  value,
  size,
  eyeSize: inputEyeSize,
  color,
  backgroundColor: inputBackgroundColor,
  overlayColor = '#FFFFFF',
  quietZone = 8,
}: QRCodeProps): JSX.Element | null {
  const { path } = useMemo(() => {
    return transformMatrixIntoCirclePath(genMatrix(value), size)
  }, [value, size])

  const eyeSize = inputEyeSize ? inputEyeSize : size / 1.5

  return (
    <svg
      height={size}
      viewBox={[-quietZone, -quietZone, size + quietZone * 2, size + quietZone * 2].join(' ')}
      width={size}
    >
      <defs>
        <linearGradient gradientTransform="rotate(45)" id="grad" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor="rgb(0,255,255)" stopOpacity="1" />
          <stop offset="1" stopColor={undefined} stopOpacity="1" />
        </linearGradient>
      </defs>
      <g>
        <rect
          fill={inputBackgroundColor}
          height={size + quietZone * 2}
          rx={24}
          width={size + quietZone * 2}
          x={-quietZone}
          y={-quietZone}
        />
      </g>
      <g>
        <path d={path} fill={color} />
        <path d={path} fill={overlayColor + '2D'} />
        <QREyeWrapper
          backgroundColor={inputBackgroundColor}
          fillColor={color}
          overlayColor={overlayColor + '2D'}
          size={eyeSize}
        />
        <QREyeWrapper
          backgroundColor={inputBackgroundColor}
          fillColor={color}
          overlayColor={overlayColor + '2D'}
          size={eyeSize}
          y={size - eyeSize / 3}
        />
        <QREyeWrapper
          backgroundColor={inputBackgroundColor}
          fillColor={color}
          overlayColor={overlayColor + '2D'}
          size={eyeSize}
          x={size - eyeSize / 3}
        />
      </g>
    </svg>
  )
}
