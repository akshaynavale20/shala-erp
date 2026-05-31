import React from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, Select, Tag, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import LanguageSwitcher from '../common/LanguageSwitcher';
import {
  DashboardOutlined, SettingOutlined, TeamOutlined,
  UserOutlined, CalendarOutlined, FileTextOutlined,
  DollarOutlined, BarChartOutlined, LogoutOutlined,
  BankOutlined, ReadOutlined, ScheduleOutlined, AppstoreOutlined,
  HomeOutlined, AuditOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useQuery } from '@tanstack/react-query';
import { sansthaApi, unitApi } from '../../api/client';
import { useCurrentYear } from '../../hooks/useCurrentYear';

const APP_VERSION = '1.0.0';
const APP_NAME = 'VidyaSetu';
const APP_NAME_MR = 'शाळा ERP';

import { mediaUrl } from '../../api/client';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/dashboard',   icon: <DashboardOutlined />, labelKey: 'nav.dashboard',    requiredPermissions: null },
  { key: '/students',    icon: <TeamOutlined />,      labelKey: 'nav.students',     requiredPermissions: ['student:read', 'student:create', 'student:edit'] },
  { key: '/staff',       icon: <UserOutlined />,      labelKey: 'nav.staff',        requiredPermissions: ['staff:read', 'staff:create'] },
  { key: '/attendance',  icon: <CalendarOutlined />,  labelKey: 'nav.attendance',   requiredPermissions: ['attendance:mark', 'attendance:read'] },
  { key: '/exams',       icon: <AuditOutlined />,     labelKey: 'nav.exams',        requiredPermissions: ['exam:read', 'exam:create', 'exam:marks_entry'] },
  { key: '/fees',        icon: <DollarOutlined />,    labelKey: 'nav.fees',         requiredPermissions: ['fee:read', 'fee:collect', 'fee:manage'] },
  { key: '/salary',      icon: <BankOutlined />,      labelKey: 'nav.salary',       requiredPermissions: ['salary:read', 'salary:run', 'salary:manage'] },
  { key: '/certificates',icon: <FileTextOutlined />,  labelKey: 'nav.certificates', requiredPermissions: ['certificate:read', 'certificate:issue'] },
  { key: '/reports',     icon: <BarChartOutlined />,  labelKey: 'nav.reports',      requiredPermissions: ['report:unit', 'report:sanstha'] },
  { key: '/accounts',    icon: <DollarOutlined />,    label: 'जमा-खर्च',            requiredPermissions: ['setup:manage'] },
  { key: '/classes',     icon: <AppstoreOutlined />,  label: 'इयत्ता',              requiredPermissions: ['setup:manage', 'unit:manage'] },
  { key: '/timetable',   icon: <ScheduleOutlined />,  label: 'वेळापत्रक',           requiredPermissions: ['student:read', 'staff:read'] },
  { key: '/library',     icon: <ReadOutlined />,      label: 'ग्रंथालय',            requiredPermissions: null },
  { key: '/users',       icon: <UserOutlined />,        label: 'वापरकर्ते',           requiredPermissions: ['setup:manage', 'user:manage'] },
  { key: '/setup',       icon: <SettingOutlined />,     labelKey: 'nav.setup',        requiredPermissions: ['setup:manage'] },
  { key: '/contact',     icon: <InfoCircleOutlined />,  label: 'Contact Us',          requiredPermissions: null },
];

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, isSansthaLevel } = useAuthStore();
  const { selectedUnitId, setSelectedUnitId } = useAppStore();
  const [siderCollapsed, setSiderCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 992);

  const { data: sanstha } = useQuery({
    queryKey: ['sanstha', user?.sansthaId],
    queryFn: () => sansthaApi.findOne(user!.sansthaId),
    enabled: !!user?.sansthaId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', user?.sansthaId],
    queryFn: () => unitApi.findBySanstha(user!.sansthaId),
    enabled: !!user?.sansthaId,
    staleTime: 10 * 60 * 1000,
  });

  useCurrentYear();

  const sansthaLevel = isSansthaLevel();

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.requiredPermissions === null) return true;
    return item.requiredPermissions.some(p => hasPermission(p));
  }).map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label ?? t(item.labelKey as any),
  }));

  const myUnitName = !sansthaLevel && user?.unitIds?.length
    ? (units as any[]).find(u => u.id === user.unitIds[0])?.nameMr
    : null;

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: user?.nameMr || 'प्रोफाइल',
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: t('auth.logout'),
        danger: true,
        onClick: () => { logout(); navigate('/login'); },
      },
    ],
  };

  const selectedUnit = (units as any[]).find(u => u.id === selectedUnitId);

  // Sanstha logo — shown in sidebar and header
  const logoUrl = mediaUrl((sanstha as any)?.logoUrl);
  const sansthaInitial = (sanstha as any)?.nameMr?.charAt(0) || 'श';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Left Nav Sidebar ─────────────────────────────────────────────────── */}
      <Sider
        width={230}
        breakpoint="lg"
        collapsedWidth={0}
        collapsed={siderCollapsed}
        onBreakpoint={(broken) => { setSiderCollapsed(broken); setIsMobile(broken); }}
        onCollapse={(collapsed) => setSiderCollapsed(collapsed)}
        style={{
          background: 'linear-gradient(180deg, #1A3A5C 0%, #0F2640 100%)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Brand block */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>

          {/* Logo + app name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 3, flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,255,255,0.2)' }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                background: 'linear-gradient(135deg, #2E86C1 0%, #1A5276 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)',
                fontSize: 22, fontWeight: 800, color: '#fff',
              }}>
                {sansthaInitial}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                  {APP_NAME_MR}
                </Text>
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 9, fontWeight: 600,
                  padding: '1px 5px', borderRadius: 4,
                  letterSpacing: 0.3, flexShrink: 0,
                }}>
                  v{APP_VERSION}
                </span>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9.5, display: 'block' }}>
                शाळा व्यवस्थापन प्रणाली
              </Text>
            </div>
          </div>

          {/* Sanstha name card */}
          {(sanstha as any)?.nameMr && (
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 7,
              padding: '6px 10px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, display: 'block', marginBottom: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                संस्था
              </Text>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 600, display: 'block', lineHeight: 1.4 }}>
                {(sanstha as any).nameMr}
              </Text>
              {((sanstha as any)?.ptrNumber || (sanstha as any)?.phone) && (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, display: 'block', marginTop: 2 }}>
                  {(sanstha as any).ptrNumber ? `PTR: ${(sanstha as any).ptrNumber}` : ''}
                  {(sanstha as any).ptrNumber && (sanstha as any).phone ? ' · ' : ''}
                  {(sanstha as any).phone || ''}
                </Text>
              )}
            </div>
          )}
        </div>

        {/* Nav menu — fills remaining space */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ background: 'transparent', border: 'none', marginTop: 6 }}
            theme="dark"
            items={visibleNavItems}
            onClick={({ key }) => navigate(key)}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, display: 'block' }}>
            {APP_NAME} v{APP_VERSION} · © Akshay Navale
          </Text>
        </div>
        </div>
      </Sider>

      {/* ── Mobile overlay — closes sidebar when tapping outside ────────────── */}
      {isMobile && !siderCollapsed && (
        <div className="mobile-sidebar-overlay" onClick={() => setSiderCollapsed(true)} />
      )}

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <Layout style={{ marginLeft: isMobile ? 0 : 230, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: '#fff',
          padding: isMobile ? '0 10px' : '0 20px',
          borderBottom: '1px solid #E8EFF7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 9,
          height: 52,
          lineHeight: '52px',
        }}>
          {/* Left: hamburger (mobile) + sanstha logo + unit context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSiderCollapsed(!siderCollapsed)}
              className="mobile-menu-btn"
            />
            {logoUrl ? (
              <img src={logoUrl} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, background: '#f0f5ff', padding: 2 }} />
            ) : (
              <HomeOutlined style={{ color: '#1A3A5C', fontSize: 14 }} />
            )}
            {sansthaLevel ? (
              <Select
                placeholder="शाळा निवडा"
                style={{ minWidth: 200 }}
                value={selectedUnitId || undefined}
                onChange={setSelectedUnitId}
                allowClear
                options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
                size="small"
                variant="outlined"
              />
            ) : (
              <Tag color="blue" style={{ margin: 0, fontSize: 12, padding: '2px 10px' }}>
                {myUnitName || '...'}
              </Tag>
            )}
            {selectedUnit && sansthaLevel && !isMobile && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {selectedUnit.nameMr}
              </Text>
            )}
          </div>

          {/* Right: language switcher + user menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LanguageSwitcher />
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F5FF'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <Avatar
                size={30}
                style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #2E86C1 100%)', fontSize: 13, fontWeight: 700 }}
              >
                {user?.nameMr?.charAt(0) || 'U'}
              </Avatar>
              {!isMobile && <div style={{ lineHeight: 1.3 }}>
                <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', color: '#1A3A5C' }}>
                  {user?.nameMr}
                </Text>
                <Text style={{ fontSize: 10, color: '#999', display: 'block' }}>
                  {user?.email || 'वापरकर्ता'}
                </Text>
              </div>}
            </Space>
          </Dropdown>
          </div>
        </Header>

        <Content style={{ minHeight: 'calc(100vh - 52px)', background: '#F4F7FB' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
