import { Text } from 'components/Text/Text'
import styled from 'styled-components/macro'

const FilterButton = styled(Text)`
  display: flex;
  flex-direction: row;
  height: 100%;
  color: ${(props) => props.theme.accentActionSoft};
  background-color: ${(props) => props.theme.accentActionSoft};
  m: 0;
  p: 8px;
  pr: 6;
  pl: 14;
  border-radius: 12px;
  font-size:14px;
  line-height: 24px;
  font-weight:400;
  border-width: 1;
  border-style: solid;
  border-color: ${(props) => props.theme.accentActionSoft};
  white-space: nowrap;
  &:hover {
    cursor: pointer;
    background-color: ${(props) => props.theme.accentActionSoft};
  }
  focusStyle: {
    background-color: ${(props) => props.theme.accentActionSoft};
  },
  variants: {
    active: {
      true: {
        background-color: ${(props) => props.theme.accentActionSoft};
        focusStyle: {
          background-color: ${(props) => props.theme.accentActionSoft};
        },
      },
    },
  } as const;
`

export default FilterButton
