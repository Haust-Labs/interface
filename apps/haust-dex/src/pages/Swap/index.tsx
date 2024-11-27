import { useWeb3React } from '@web3-react/core';
import { PageWrapper, SwapWrapper } from 'components/swap/styleds';
import SwapHeader from 'components/swap/SwapHeader';
import { useCallback, useEffect,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { useDerivedSwapInfo } from 'state/swap/hooks';

import SendCurrencyInputForm from "./components/Send/SendCurrencyInputForm";
import SwapForm from './components/Swap/SwapForm';

type SwapTab = 'Swap' | 'Send';

export default function SwapPage({ className }: { className?: string }) {
  return (
    <PageWrapper>
      <Swap className={className} />
    </PageWrapper>
  );
}

export function Swap({
  className,
}: {
  className?: string;
}) {
  const [currentTab, setCurrentTab] = useState<SwapTab>('Swap');
  const { chainId } = useWeb3React();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (tab: SwapTab) => {
    setCurrentTab(tab);
  };

  const syncTabToUrl = true;

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      if (syncTabToUrl) {
        navigate(`/${tab.toLowerCase()}`, { replace: true });
      } else {
        handleTabChange(tab);
      }
    },
    [navigate, syncTabToUrl],
  );

  useEffect(() => {
    const pathTab = location.pathname.split('/')[1];
    if (pathTab === 'send') {
      setCurrentTab('Send');
    } else {
      setCurrentTab('Swap');
    }
  }, [location.pathname]);

  const {
    allowedSlippage,
  } = useDerivedSwapInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <SwapWrapper chainId={chainId} className={className} id="swap-page">
        <SwapHeader
          allowedSlippage={allowedSlippage}
          currentTab={currentTab}
          onTabClick={onTabClick}
        />
        <div style={{ flexGrow: 1, width: '100%' }}>
          {currentTab === 'Swap' && <SwapForm />}
          {currentTab === 'Send' && <SendCurrencyInputForm />}
        </div>
      </SwapWrapper>
    </div>
  );
}
