import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  width: fit-content;

  &:hover {
    color: ${({ theme }) => theme.textTertiary};
  }
`
