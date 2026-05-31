import { useState } from 'react';
import { Typography, Divider } from 'antd';
import {
  SettingOutlined, BankOutlined, ApartmentOutlined,
  CalendarOutlined, SafetyOutlined, UserOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { sansthaApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import SansthaForm from './SansthaForm';
import UnitList from './UnitList';
import AcademicYearList from './AcademicYearList';
import RoleList from './RoleList';
import UserList from './UserList';

const { Title, Text } = Typography;

const SIDEBAR_ITEMS = [
  {
    key: 'config',
    icon: <SettingOutlined />,
    label: 'संस्था सेटअप',
    items: [
      { id: 'sanstha',        label: 'संस्था माहिती',     icon: <BankOutlined /> },
      { id: 'units',          label: 'शाळा / घटक',        icon: <ApartmentOutlined /> },
      { id: 'academic-years', label: 'शैक्षणिक वर्षे',    icon: <CalendarOutlined /> },
    ],
  },
  {
    key: 'access',
    icon: <SafetyOutlined />,
    label: 'प्रवेश नियंत्रण',
    items: [
      { id: 'roles', label: 'भूमिका / परवानग्या', icon: <SafetyOutlined /> },
      { id: 'users', label: 'वापरकर्ते',           icon: <UserOutlined /> },
    ],
  },
];

const ALL_ITEMS = SIDEBAR_ITEMS.flatMap(g => g.items);

function Sidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <div style={{
      width: 220, minWidth: 220, borderRight: '1px solid #DDE8F4',
      background: '#F7FAFD', overflowY: 'auto', height: '100%',
    }}>
      {SIDEBAR_ITEMS.map(group => (
        <div key={group.key}>
          <div style={{
            padding: '9px 14px 5px', fontSize: 11, fontWeight: 700,
            color: '#1A3A5C', letterSpacing: 0.5,
            borderBottom: '1px solid #DDE8F4', background: '#EEF4F9',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {group.icon} {group.label}
          </div>
          {group.items.map(r => (
            <div
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                padding: '8px 14px 8px 24px', cursor: 'pointer', fontSize: 12.5,
                color: activeId === r.id ? '#1A3A5C' : '#3A4A5C',
                background: activeId === r.id ? '#D6E8F7' : 'transparent',
                fontWeight: activeId === r.id ? 600 : 400,
                borderLeft: activeId === r.id ? '3px solid #1A3A5C' : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (activeId !== r.id) (e.currentTarget as HTMLElement).style.background = '#E8F1F9'; }}
              onMouseLeave={e => { if (activeId !== r.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ opacity: 0.6, fontSize: 11 }}>{r.icon}</span>
              {r.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SetupPage() {
  const { user: me } = useAuthStore();
  const [activeSection, setActiveSection] = useState('sanstha');

  const { data: sanstha } = useQuery({
    queryKey: ['sanstha', me?.sansthaId],
    queryFn: () => sansthaApi.findOne(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 10 * 60 * 1000,
  });

  const activeLabel = ALL_ITEMS.find(i => i.id === activeSection)?.label || '';

  function renderContent() {
    switch (activeSection) {
      case 'sanstha':        return <SansthaForm />;
      case 'units':          return <UnitList />;
      case 'academic-years': return <AcademicYearList />;
      case 'roles':          return <RoleList />;
      case 'users':          return <UserList />;
      default:               return null;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <SettingOutlined style={{ fontSize: 20, color: '#1A3A5C' }} />
        <Title level={4} style={{ margin: 0, color: '#1A3A5C' }}>सेटअप</Title>
        <Divider type="vertical" />
        <Text type="secondary" style={{ fontSize: 12 }}>{sanstha?.nameMr || 'संस्था'}</Text>
        <Text style={{ fontSize: 11, background: '#EEF4F9', padding: '2px 10px', borderRadius: 12, color: '#1A3A5C', border: '1px solid #BCD4E8' }}>
          {activeLabel}
        </Text>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activeId={activeSection} onSelect={setActiveSection} />
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
