import { useCallback, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components/macro'

import { TabsItem, TabsSection, useTabsContent } from './TabsContent'

const ItemContainer = styled.div`
  display: flex;
  padding: 8px;
  margin: 5px;
  align-items: center;
  gap: 2px;
  align-self: stretch;
  border-radius: 12px;
  background: #121417;
  cursor: pointer;
  width: 175px;
  &:hover {
    background: #0e1012;
  }
`

const TabText = styled.span<{ isActive?: boolean }>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ isActive, theme }) => (isActive ? theme.textPrimary : '#9B9B9B')};
  font-size: 16px;
  font-weight: 485;
  border-radius: 8px;
  padding: 4px 14px;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.textPrimary} !important;
  }
`

const DropdownText = styled(TabText)`
  font-size: 16px;
  color: #9B9B9B;
  font-weight: 485;
  padding: 4px;
  &:hover {
    color: #9B9B9B !important;
  }
`

const Item = ({ icon, label, path, closeMenu }: TItemProps) => {
  return (
    <NavLink to={path} style={{ textDecoration: 'none' }} onClick={closeMenu}>
      <ItemContainer>
        {icon}
        <DropdownText>{label}</DropdownText>
      </ItemContainer>
    </NavLink>
  )
}

interface TItemProps {
  icon?: JSX.Element
  label: string
  quickKey: string
  path: string
  closeMenu: () => void
}

const Tab = ({
  label,
  isActive,
  path,
  items,
}: {
  label: string
  isActive?: boolean
  path: string
  items?: TabsItem[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const parentRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const isCursorInside = useRef(false)

  const handleMouseEnter = useCallback(() => {
    isCursorInside.current = true
    setIsOpen(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    isCursorInside.current = false
    setTimeout(() => {
      if (!isCursorInside.current) {
        setIsOpen(false)
      }
    }, 100)
  }, [])

  const handleMouseEnterMenu = useCallback(() => {
    isCursorInside.current = true
  }, [])

  const handleMouseLeaveMenu = useCallback(() => {
    isCursorInside.current = false
    setTimeout(() => {
      if (!isCursorInside.current) {
        setIsOpen(false)
      }
    }, 100)
  }, [])

  const Label = (
    <NavLink to={path} style={{ textDecoration: 'none' }}>
      <TabText isActive={isActive}>{label}</TabText>
    </NavLink>
  )

  if (!items) {
    return Label
  }

  return (
    <div
      ref={parentRef}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {Label}
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'max-content',
            background: '#000000',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #121417',
            borderRadius: '12px',
            zIndex: 10,
          }}
          onMouseEnter={handleMouseEnterMenu}
          onMouseLeave={handleMouseLeaveMenu}
        >
          {items.map((item, index) => (
            <Item
              key={`${item.label}_${index}`}
              icon={item.icon}
              label={item.label}
              quickKey={item.quickKey}
              path={item.href}
              closeMenu={() => setIsOpen(false)}
            />
          ))}
        </div>
      )}
    </div>
  )
}


export function Tabs() {
  const tabsContent: TabsSection[] = useTabsContent()
  return (
    <>
      {tabsContent.map(({ title, isActive, href, items }, index) => (
        <Tab
          key={`${title}_${index}`}
          label={title}
          isActive={isActive}
          path={href}
          items={items}
        />
      ))}
    </>
  )
}
