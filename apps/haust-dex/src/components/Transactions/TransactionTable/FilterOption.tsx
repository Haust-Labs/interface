import styled from 'styled-components/macro'
const FilterOption = styled.button<{ active: boolean; highlight?: boolean }>`
  height: 100%;
  color: ${({ theme }) => theme.textPrimary};
  background-color: ${({ theme, active }) => (active ? theme.backgroundSurface : theme.backgroundBackdrop)};
  margin: 0;
  padding: 6px 12px 6px 14px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  border: 1px solid ${({ theme }) => theme.neutralBorder};
  outline: ${({ theme, active, highlight }) => (active && highlight ? `1px solid ${theme.accentAction}` : 'none')};
  opacity: ${({ theme, active }) => (active ? theme.opacity.hover : 1)};

  :hover {
    cursor: pointer;
    opacity: ${({ theme, active }) => (active ? theme.opacity.hover : 1)};
    background-color: ${({ theme }) => (theme.backgroundSurface)};
  }
`
export default FilterOption
