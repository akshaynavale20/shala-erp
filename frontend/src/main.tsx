import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Empty } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/mr';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(customParseFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(advancedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
import './i18n';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Ant Design theme override — VidyaSetu Design System (see DESIGN.md)
const antTheme = {
  token: {
    // Primary — navy (trust signal, used for links/focus rings/nav)
    colorPrimary: '#1A5276',
    colorLink:    '#1A5276',
    colorLinkHover: '#2471A3',

    // Typography
    fontFamily: "'Mukta', 'Noto Sans Devanagari', sans-serif",
    fontSize: 16,

    // Surfaces — warm off-white (replaces cold #F5F5F5)
    colorBgBase:      '#FAF8F5',
    colorBgLayout:    '#FAF8F5',
    colorBgContainer: '#FFFFFF',

    // Borders — warm gray
    colorBorder:          '#E8E2D9',
    colorBorderSecondary: '#E8E2D9',
    colorSplit:           '#E8E2D9',

    // Text — warm near-black
    colorText:          '#1C1917',
    colorTextSecondary: '#57534E',
    colorTextTertiary:  '#A8A29E',
    colorTextPlaceholder: '#A8A29E',

    // Radius scale (md = 8px)
    borderRadius:     8,
    borderRadiusLG:  12,
    borderRadiusSM:   4,
    borderRadiusXS:   4,
  },
  components: {
    // Saffron primary buttons — the key differentiator (see DESIGN.md)
    // This scopes the saffron to Button only; links/focus rings stay navy.
    Button: {
      colorPrimary:        '#C0722A',
      colorPrimaryHover:   '#9E5A1C',
      colorPrimaryActive:  '#9E5A1C',
      colorPrimaryBorder:  '#C0722A',
      primaryShadow:       '0 2px 0 rgba(192,114,42,0.1)',
    },
    // Table — warm header, comfortable rows
    Table: {
      headerBg:         '#F5F1EB',
      headerSortActiveBg: '#EDE7DC',
      rowHoverBg:       '#F5F1EB',
      borderColor:      '#E8E2D9',
    },
    // Menu — sidebar nav already styled via inline CSS but token keeps coherence
    Menu: {
      darkItemBg:           '#1A5276',
      darkSubMenuItemBg:    '#0F3A57',
      darkItemSelectedBg:   'rgba(192,114,42,0.2)',
      darkItemSelectedColor: '#FFFFFF',
    },
    // Inputs — warm focus ring
    Input: {
      activeBorderColor:  '#1A5276',
      hoverBorderColor:   '#2471A3',
    },
    Select: {
      optionActiveBg:    '#EAF2F8',
      optionSelectedBg:  '#EAF2F8',
    },
    // Card — white surface on warm bg
    Card: {
      colorBgContainer: '#FFFFFF',
    },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antTheme} renderEmpty={() => <Empty description="माहिती उपलब्ध नाही" />}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
