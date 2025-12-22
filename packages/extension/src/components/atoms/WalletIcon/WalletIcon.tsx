import { FC, MouseEventHandler } from 'react';

import { Hashicon } from '@emeraldpay/hashicon-react';

import { useNetwork } from '../../../contexts';

export interface WalletIconProps {
  onClick?: MouseEventHandler<HTMLDivElement>;
  publicAddress: string;
  size?: 'sm' | 'md' | 'xl';
  isConnectedInformation?: boolean;
}

export const WalletIcon: FC<WalletIconProps> = ({
  publicAddress,
  onClick,
  size = 'md',
  isConnectedInformation = false
}) => {
  const { client } = useNetwork();

  const borderColor = client ? 'green' : 'red';

  const getSizeValues = () => {
    switch (size) {
      case 'sm':
        return { outer: 32, inner: 29, icon: 24 };
      case 'xl':
        return { outer: 60, inner: 60, icon: 50 };
      case 'md':
      default:
        return { outer: 45, inner: 42, icon: 35 };
    }
  };

  const { outer, inner, icon } = getSizeValues();

  return (
    <div
      role={onClick ? 'button' : undefined}
      aria-label={isConnectedInformation ? `Wallet icon with ${borderColor} border` : 'Wallet icon'}
      style={{
        width: `${outer}px`,
        height: `${outer}px`,
        border: isConnectedInformation ? `solid 2px ${borderColor}` : 'none',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : undefined
      }}
      onClick={onClick}
    >
      <div
        style={{
          borderRadius: '50%',
          backgroundColor: 'white',
          width: `${inner}px`,
          height: `${inner}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Hashicon value={publicAddress} size={icon} />
      </div>
    </div>
  );
};
