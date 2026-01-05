import { FC } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { LedgerSigningStatus, type LedgerSigningStep } from '../../organisms';

export interface LedgerSigningModalProps {
  open: boolean;
  step: LedgerSigningStep;
  error?: string;
  txHash?: string;
  onClose?: () => void;
}

/**
 * Modal dialog that shows Ledger transaction signing progress
 */
export const LedgerSigningModal: FC<LedgerSigningModalProps> = ({
  open,
  step,
  error,
  txHash,
  onClose
}) => {
  const canClose = step === 'success' || step === 'error';

  return (
    <Dialog
      open={open}
      onClose={canClose ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!canClose}
    >
      <DialogContent>
        <LedgerSigningStatus step={step} error={error} txHash={txHash} />
      </DialogContent>
    </Dialog>
  );
};
