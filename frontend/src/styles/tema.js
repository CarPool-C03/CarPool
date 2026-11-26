import { createLightTheme } from '@fluentui/react-components';

const verde = {
  10: '#061a16', 20: '#092a22', 30: '#10382e', 40: '#154b3d',
  50: '#195b4a', 60: '#12604b', 70: '#12664f', 80: '#126b53',
  90: '#27876c', 100: '#52a489', 110: '#7cbea6', 120: '#a1d3c0',
  130: '#bee2d4', 140: '#d6ede3', 150: '#e6f5ee', 160: '#f2faf6',
};

export const temaCarPool = {
  ...createLightTheme(verde),
  colorBrandForeground1: verde[80],
  colorBrandForeground2: verde[50],
  colorBrandBackgroundHover: verde[50],
  colorBrandBackgroundPressed: verde[30],
  colorNeutralBackground2: '#f3f7f4',
  colorNeutralForeground1: '#15352d',
  colorNeutralForeground2: '#435f55',
  colorNeutralStroke2: '#d7e4dc',
  colorStrokeFocus2: verde[50],
  fontFamilyBase: '"Segoe UI", system-ui, sans-serif',
  borderRadiusMedium: '8px',
  borderRadiusLarge: '14px',
  borderRadiusXLarge: '22px',
};

export const schermoCompatto = '@media (max-width: 768px)';
