import styled from 'styled-components/macro';

type SizeOrNumber = number | string;

type SizedInset = {
  top: SizeOrNumber;
  left: SizeOrNumber;
  right: SizeOrNumber;
  bottom: SizeOrNumber;
};

interface FlexCustomProps {
  inset?: SizeOrNumber | Partial<SizedInset>;
  row?: boolean;
  shrink?: boolean;
  grow?: boolean;
  fill?: boolean;
  centered?: boolean;
  position?: string;
  testID?: string;
}

type FlexProps = React.HTMLAttributes<HTMLDivElement> &
  FlexCustomProps & {
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    width?: string;
  };

export const Flex = styled.div<FlexProps>`
  display: flex;
  flex-direction: ${({ row }) => (row ? 'row' : 'column')};
  ${({ shrink }) => shrink && 'flex-shrink: 1;'}
  ${({ grow }) => grow && 'flex-grow: 1;'}
  ${({ fill }) => fill && 'flex: 1;'}
  ${({ centered }) => centered && 'align-items: center; justify-content: center;'}

  justify-content: ${({ justifyContent }) => justifyContent || 'initial'};
  align-items: ${({ alignItems }) => alignItems || 'initial'};
  gap: ${({ gap }) => gap || '0'};
  width: ${({ width }) => width || 'auto'};
  position: ${({ position }) => position || 'static'};

  ${({ inset }) =>
    inset &&
    (typeof inset === 'object'
      ? `
        padding-top: ${inset.top || 0};
        padding-right: ${inset.right || 0};
        padding-bottom: ${inset.bottom || 0};
        padding-left: ${inset.left || 0};
      `
      : `
        padding: ${inset};
      `)}
`;
