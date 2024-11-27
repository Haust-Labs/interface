import { Flex } from 'components/layout/Flex';
import React, { PropsWithChildren } from 'react';
import styled from 'styled-components/macro';

const fonts = {
  heading1: {
    fontSize: '32px',
    lineHeight: '40px',
    fontWeight: '700',
    maxFontSizeMultiplier: 1.5,
  },
  heading2: {
    fontSize: '28px',
    lineHeight: '36px',
    fontWeight: '700',
    maxFontSizeMultiplier: 1.5,
  },
  heading3: {
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: '700',
    maxFontSizeMultiplier: 1.4,
  },
  subheading1: {
    fontSize: '20px',
    lineHeight: '28px',
    fontWeight: '500',
    maxFontSizeMultiplier: 1.4,
  },
  subheading2: {
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: '500',
    maxFontSizeMultiplier: 1.3,
  },
  body1: {
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
  body2: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
  body3: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
  body4: {
    fontSize: '10px',
    lineHeight: '14px',
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel1: {
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: '600',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel2: {
    fontSize: '16px',
    lineHeight: '20px',
    fontWeight: '600',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel3: {
    fontSize: '14px',
    lineHeight: '18px',
    fontWeight: '600',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel4: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: '600',
    maxFontSizeMultiplier: 1.2,
  },
  monospace: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
};

const TextFrame = styled.span<{ variant?: keyof typeof fonts; allowFontScaling?: boolean }>`
  font-family: ${({ variant }) => (variant === 'monospace' ? 'monospace' : 'inherit')};
  font-size: ${({ variant }) => fonts[variant || 'body2'].fontSize};
  line-height: ${({ variant }) => fonts[variant || 'body2'].lineHeight};
  font-weight: 400;
  word-wrap: break-word;
`;

export type TextProps = {
  variant?: keyof typeof fonts;
  allowFontScaling?: boolean;
  loading?: boolean | 'no-shimmer';
  loadingPlaceholderText?: string;
  color?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export const TextPlaceholder = ({ children }: PropsWithChildren<unknown>): JSX.Element => {
  return (
    <Flex row alignItems="center" testID="text-placeholder">
      <Flex row alignItems="center" position="relative">
        <div style={{ visibility: 'hidden' }}>{children}</div>
        <Flex
          style={{
            backgroundColor: '#f0f0f0',
            borderRadius: '50%',
            position: 'absolute',
            top: '5%',
            bottom: '5%',
            left: 0,
            right: 0,
          }}
        />
      </Flex>
    </Flex>
  );
};

export const Text = React.forwardRef<HTMLSpanElement, TextProps>(
  (
    {
      loading = false,
      allowFontScaling = true,
      loadingPlaceholderText = '000.00',
      variant = 'body2',
      color = '#000',
      children,
      ...rest
    },
    ref
  ) => {
    if (loading) {
      return (
        <TextPlaceholder>
          <TextFrame ref={ref} variant={variant} style={{ color: 'transparent', opacity: 0 }} {...rest}>
            {loadingPlaceholderText}
          </TextFrame>
        </TextPlaceholder>
      );
    }

    return (
      <TextFrame ref={ref} variant={variant} style={{ color }} {...rest}>
        {children}
      </TextFrame>
    );
  }
);

Text.displayName = 'Text';
