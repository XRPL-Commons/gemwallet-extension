import { FC, useCallback, useState } from 'react';

import { SwapData } from '../../../types/swap.types';
import { ConfirmSwap } from './ConfirmSwap';
import { PrepareSwap } from './PrepareSwap';

export const Swap: FC = () => {
  const [swapData, setSwapData] = useState<SwapData | null>(null);

  const handlePrepareSwap = useCallback((data: SwapData | null) => {
    setSwapData(data);
  }, []);

  const handleBack = useCallback(() => {
    setSwapData(null);
  }, []);

  if (swapData) {
    return <ConfirmSwap swapData={swapData} onBack={handleBack} />;
  }

  return <PrepareSwap onSwapClick={handlePrepareSwap} />;
};
