import { CSSProperties, FC, MouseEvent, useEffect, useMemo } from 'react';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';

import { navigation as navigationConstant } from '../../../constants';
import { useNavBarPosition } from '../../../contexts';
import { useGemTokens } from '../../../hooks';

const defaultDecoration = {
  '--decoration-left': '50%',
  '--decoration-width': '0'
};

const StyledBottomNavigationAction = styled(BottomNavigationAction)`
  border-top: none !important;
  box-shadow: none !important;
`;

export interface NavMenuProps {
  indexDefaultNav: number;
}

export const NavMenu: FC<NavMenuProps> = ({ indexDefaultNav }) => {
  const navigate = useNavigate();
  const { navBarPosition, setNavBarPosition } = useNavBarPosition();
  const tokens = useGemTokens();

  const StyledBottomNavigation = useMemo(() => {
    const indicatorColor = tokens.nav.indicator;

    return styled(BottomNavigation)`
      ${defaultDecoration}
      position: relative;
      border-top: none !important;
      box-shadow: ${tokens.nav.shadow};

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: var(--decoration-left);
        width: var(--decoration-width);
        height: 2px;
        background: ${indicatorColor};
        transition: 300ms;
        border-radius: 2px;
      }
    `;
  }, [tokens.nav.indicator, tokens.nav.shadow]);

  const navigation = useMemo(() => {
    return navigationConstant;
  }, []);

  useEffect(() => {
    if (indexDefaultNav !== -1) {
      const element = document.querySelectorAll('.MuiBottomNavigationAction-root')[
        indexDefaultNav
      ] as HTMLElement;
      if (element) {
        const reducedWidth = element.offsetWidth * 0.75;
        const adjustedLeft = element.offsetLeft + (element.offsetWidth - reducedWidth) / 2;
        setNavBarPosition({
          left: `${adjustedLeft}px`,
          width: `${reducedWidth}px`
        });
      }
    }
  }, [setNavBarPosition, indexDefaultNav]);

  const handleClick = (_: MouseEvent<HTMLButtonElement>, newValue: number) => {
    const { pathname } = navigation[newValue];
    navigate(pathname);
  };

  const style: CSSProperties & { [key: string]: string | number } = {
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: tokens.nav.background,
    '--decoration-left': navBarPosition.left,
    '--decoration-width': navBarPosition.width
  };

  return (
    <StyledBottomNavigation value={indexDefaultNav} style={style}>
      {navigation.map(({ label, icon }, index) => (
        <StyledBottomNavigationAction
          key={label}
          label={label}
          icon={icon}
          value={index}
          showLabel
          onClick={(e: MouseEvent<HTMLButtonElement>) => handleClick(e, index)}
        />
      ))}
    </StyledBottomNavigation>
  );
};
