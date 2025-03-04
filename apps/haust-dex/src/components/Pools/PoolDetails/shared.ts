import styled from "styled-components/macro";

import { LoadingBubble } from "../loading";
import { TextProps } from "components/Text/Text";
import { darkTheme } from "theme/colors";

export const DetailBubble = styled(LoadingBubble)<{ $height?: number; $width?: number }>`
  height: ${({ $height }) => ($height ? `${$height}px` : '16px')};
  width: ${({ $width }) => ($width ? `${$width}px` : '80px')};
`

export const SmallDetailBubble = styled(LoadingBubble)`
  height: 20px;
  width: 20px;
  border-radius: 100px;
`

export const ActionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  py: '$spacing8',
  px: '$spacing12',
  borderRadius: 20,
  borderWidth: 0,
  width: 'maxContent',
  backgroundColor: darkTheme.neutralBorder,
  
  hoverStyle: {
    backgroundColor: 'none',
  },
  focusStyle: {
    backgroundColor: darkTheme.neutralBorder,
  },
}
