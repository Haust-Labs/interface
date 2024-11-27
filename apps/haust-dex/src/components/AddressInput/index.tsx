import React from 'react';
import styled from 'styled-components/macro';

const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string }>`
  color: ${({ error, theme }) => (error ? theme.accentFailure : theme.textPrimary)};
  width: 0;
  position: relative;
  font-weight: 400;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: transparent;
  font-size: ${({ fontSize }) => fontSize ?? '28px'};
  text-align: ${({ align }) => align && align};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  -webkit-appearance: textfield;
  text-align: right;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.textTertiary};
  }
`;

export const AddressInput = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  prependSymbol,
  ...rest
}: {
  value: string | number;
  onUserInput: (input: string) => void;
  error?: boolean;
  fontSize?: string;
  align?: 'right' | 'left';
  prependSymbol?: string | undefined;
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const enforcer = (nextUserInput: string) => {
    onUserInput(nextUserInput.trim());
  };

  return (
    <StyledInput
      {...rest}
      value={prependSymbol && value ? prependSymbol + value : value}
      onChange={(event) => {
        const value = event.target.value;

        const formattedValue = prependSymbol
          ? value.toString().slice(prependSymbol.length)
          : value;

        enforcer(formattedValue);
      }}
      // universal input options
      autoComplete="off"
      autoCorrect="off"
      // text-specific options
      type="text"
      placeholder={placeholder || 'Enter wallet address'}
      minLength={1}
      maxLength={79}
      spellCheck="false"
    />
  );
});

export default AddressInput;
