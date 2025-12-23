import { CSSProperties, FC } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import LinkIcon from '@mui/icons-material/Link';
import { Button, Chip, Paper, Tooltip, Typography } from '@mui/material';

import { SECONDARY_GRAY } from '../../../constants';
import { DIDDisplayData, truncateString } from '../../../utils/fetchDIDData';

export interface DIDCardProps {
  did: DIDDisplayData;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  style?: CSSProperties;
}

export const DIDCard: FC<DIDCardProps> = ({ did, onEditClick, onDeleteClick, style }) => {
  return (
    <Paper
      elevation={5}
      style={{
        padding: '15px',
        marginBottom: '10px',
        ...style
      }}
    >
      {/* Status chip */}
      <div style={{ marginBottom: '10px' }}>
        <Chip
          icon={<FingerprintIcon fontSize="small" />}
          label="Active DID"
          color="success"
          size="small"
          variant="outlined"
        />
      </div>

      {/* DID Document */}
      {did.decodedDIDDocument && (
        <div style={{ marginBottom: '10px' }}>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontWeight: 'bold' }}>
            DID Document
          </Typography>
          <Tooltip title={did.decodedDIDDocument} arrow>
            <Typography
              variant="body2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '8px',
                borderRadius: '4px'
              }}
            >
              {truncateString(did.decodedDIDDocument, 100)}
            </Typography>
          </Tooltip>
        </div>
      )}

      {/* URI */}
      {did.decodedURI && (
        <div style={{ marginBottom: '10px' }}>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontWeight: 'bold' }}>
            <LinkIcon fontSize="inherit" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            URI
          </Typography>
          <Tooltip title={did.decodedURI} arrow>
            <Typography
              variant="body2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                wordBreak: 'break-all'
              }}
            >
              {truncateString(did.decodedURI, 60)}
            </Typography>
          </Tooltip>
        </div>
      )}

      {/* Data */}
      {did.decodedData && (
        <div style={{ marginBottom: '10px' }}>
          <Typography variant="body2" style={{ color: SECONDARY_GRAY, fontWeight: 'bold' }}>
            Additional Data
          </Typography>
          <Tooltip title={did.decodedData} arrow>
            <Typography
              variant="body2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                wordBreak: 'break-all'
              }}
            >
              {truncateString(did.decodedData, 60)}
            </Typography>
          </Tooltip>
        </div>
      )}

      {/* Show message if no data is set */}
      {!did.decodedDIDDocument && !did.decodedURI && !did.decodedData && (
        <Typography variant="body2" style={{ color: SECONDARY_GRAY, marginBottom: '10px' }}>
          No DID document, URI, or data set.
        </Typography>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        {onEditClick && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            onClick={onEditClick}
          >
            Update
          </Button>
        )}
        {onDeleteClick && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={onDeleteClick}
          >
            Delete
          </Button>
        )}
      </div>
    </Paper>
  );
};
