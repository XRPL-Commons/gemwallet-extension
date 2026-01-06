import { useState, useCallback } from 'react';
import { signTransactionWithLedger } from '../utils/ledger';
import type { LedgerSigningStep } from '../components/organisms';

export interface UseLedgerTransactionResult {
  isOpen: boolean;
  step: LedgerSigningStep;
  error: string | undefined;
  txHash: string | undefined;
  signTransaction: (derivationPath: string, txBlob: string) => Promise<string>;
  closeModal: () => void;
}

/**
 * Hook to manage Ledger transaction signing with UI feedback
 *
 * @example
 * ```tsx
 * const { isOpen, step, error, txHash, signTransaction, closeModal } = useLedgerTransaction();
 *
 * // Use in component
 * <LedgerSigningModal
 *   open={isOpen}
 *   step={step}
 *   error={error}
 *   txHash={txHash}
 *   onClose={closeModal}
 * />
 *
 * // Sign transaction
 * const signature = await signTransaction(derivationPath, txBlob);
 * ```
 */
export function useLedgerTransaction(): UseLedgerTransactionResult {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<LedgerSigningStep>('preparing');
  const [error, setError] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  const signTransaction = useCallback(async (derivationPath: string, txBlob: string): Promise<string> => {
    setIsOpen(true);
    setStep('preparing');
    setError(undefined);
    setTxHash(undefined);

    try {
      const signature = await signTransactionWithLedger(
        derivationPath,
        txBlob,
        120000, // 2 minute timeout
        (progressStep) => {
          setStep(progressStep);
        }
      );

      setStep('signing');
      return signature;
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Failed to sign transaction');
      throw err;
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setStep('preparing');
    setError(undefined);
    setTxHash(undefined);
  }, []);

  return {
    isOpen,
    step,
    error,
    txHash,
    signTransaction,
    closeModal
  };
}
