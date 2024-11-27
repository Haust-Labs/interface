import { Percent } from '@uniswap/sdk-core';
import styled from 'styled-components/macro';

import { RowBetween, RowFixed } from '../Row';
import SettingsTab from '../Settings';

const StyledSwapHeader = styled.div`
padding: 10px 0px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.textSecondary};
`;

const TabContainer = styled.div`
  display: flex;
  gap: 16px;
`;

const Tab = styled.div<{ isActive: boolean }>`
  cursor: pointer;
  padding: 8px 16px;
  background-color: ${({ isActive }) => (isActive ? '#FFFFFF1A' : 'transparent')};
font-family: Inter;
font-size: 15.25px;
font-weight: 500;
line-height: 18.46px;
text-align: left;
  color: ${({ isActive }) => (isActive ? '#FFFFFF' : '#888888')};
  border-radius: 20px;
  transition: background-color 0.2s ease, color 0.2s ease;
`;

export default function SwapHeader({
  allowedSlippage,
  currentTab,
  onTabClick,
}: {
  allowedSlippage: Percent;
  currentTab: 'Swap' | 'Send';
  onTabClick: (tab: 'Swap' | 'Send') => void;
}) {
  const tabs: ('Swap' | 'Send')[] = ['Swap', 'Send'];

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed style={{ gap: '8px' }}>
          <TabContainer>
            {tabs.map((tab) => (
              <Tab
                key={tab}
                isActive={currentTab === tab}
                onClick={() => onTabClick(tab)}
              >
                {tab}
              </Tab>
            ))}
          </TabContainer>
        </RowFixed>
        <RowFixed>
          {currentTab === 'Swap' && <SettingsTab placeholderSlippage={allowedSlippage} />}
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  );
}
