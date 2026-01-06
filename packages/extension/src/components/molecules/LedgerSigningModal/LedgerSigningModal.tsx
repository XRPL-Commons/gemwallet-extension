import { FC } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { LedgerSigningStatus, type LedgerSigningStep } from '../../organisms';

export interface LedgerSigningModalProps {
  open: boolean;
  step: LedgerSigningStep;
  onClose?: () => void;
  onCancel?: () => void;
}

/**
 * Modal dialog that shows Ledger device interaction progress
 * Note: For final states (success/error), use AsyncTransaction instead
 */
export const LedgerSigningModal: FC<LedgerSigningModalProps> = ({
  open,
  step,
  onClose,
  onCancel
}) => {
  // Only allow closing during device interaction steps
  const canClose = step === 'preparing' || step === 'waiting' || step === 'signing';

  return (
    <Dialog
      open={open}
      onClose={canClose ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!canClose}
    >
      <DialogContent>
        <LedgerSigningStatus step={step} onCancel={onCancel} />
      </DialogContent>
    </Dialog>
  );
};
