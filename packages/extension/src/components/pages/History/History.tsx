import { FC, useCallback, useEffect, useState } from 'react';
import { AccountTxTransaction, RIPPLED_API_V1 } from 'xrpl';

import { Button, CircularProgress, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

import { LEDGER_CONNECTION_ERROR, useLedger, useNetwork } from '../../../contexts';
import { InformationMessage } from '../../molecules';
import { TransactionListing } from '../../organisms';
import { PageWithReturn } from '../../templates';

// Use V1 API type for backward compatibility (uses `tx` field instead of `tx_json`)
type AccountTxTransactionV1 = AccountTxTransaction<typeof RIPPLED_API_V1>;

export const History: FC = () => {
  const navigate = useNavigate();
  const { getTransactions } = useLedger();
  const { reconnectToNetwork } = useNetwork();

  const [transactions, setTransactions] = useState<AccountTxTransactionV1[] | null>(null);
  const [isTxFailed, setIsTxFailed] = useState<boolean>(false);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const getTx = async () => {
      try {
        const tx = await getTransactions();
        setTransactions(tx);
      } catch (e) {
        if ((e as Error).message === LEDGER_CONNECTION_ERROR) {
          setIsTxFailed(true);
        } else {
          Sentry.captureException(e);
        }
      }
    };
    getTx();
  }, [getTransactions]);

  if (isTxFailed) {
    return (
      <PageWithReturn title="History" onBackClick={handleBack}>
        <InformationMessage
          title="Failed to connect to the network"
          style={{
            padding: '15px'
          }}
        >
          <Typography style={{ marginBottom: '5px' }}>
            There was an error attempting to connect to the network. Please refresh the page and try
            again.
          </Typography>
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <Button
              variant="contained"
              onClick={reconnectToNetwork}
              style={{ marginBottom: '10px' }}
            >
              Refresh
            </Button>
          </div>
        </InformationMessage>
      </PageWithReturn>
    );
  }

  return (
    <PageWithReturn title="History" onBackClick={handleBack}>
      {transactions === null ? (
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CircularProgress />
        </div>
      ) : (
        <TransactionListing transactions={transactions} />
      )}
    </PageWithReturn>
  );
};
