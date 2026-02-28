import { CSSProperties, FC } from 'react';

import { CircularProgress } from '@mui/material';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import { useGemTokens } from '../../../hooks';
import { GemWallet } from '../index';

import './NFTImage.css';

interface NFTImageProps {
  imageURL?: string;
  height?: number;
  width?: number;
  style?: CSSProperties;
  fallbackScale?: number;
  pulseDuration?: number;
}

export const NFTImage: FC<NFTImageProps> = ({
  imageURL,
  height = 250,
  width = 250,
  style,
  fallbackScale = 2,
  pulseDuration = 0
}) => {
  const tokens = useGemTokens();

  return imageURL ? (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        animation: `pulse-nft ${pulseDuration}s linear`,
        ...style
      }}
    >
      {/* @ts-expect-error - React 19 compatibility issue */}
      <LazyLoadImage
        alt="NFT"
        height={height}
        style={{ borderRadius: '4px', boxShadow: '4px 4px 0px black' }}
        beforeLoad={() => <CircularProgress />}
        effect="blur"
        src={imageURL}
        width={width}
        // @ts-expect-error - React 19 compatibility issue with lazy-load-image-component
      />
    </div>
  ) : (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height,
        width,
        backgroundColor: tokens.background.default,
        borderRadius: '4px',
        boxShadow: '4px 4px 0px black',
        animation: `pulse-nft ${pulseDuration}s linear`,
        ...style
      }}
    >
      <GemWallet style={{ transform: `scale(${fallbackScale}` }} />
    </div>
  );
};
