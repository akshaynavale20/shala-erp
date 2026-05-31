import { TeamOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import StaffList from './StaffList';

const { Text } = Typography;

export default function StaffPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <TeamOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>कर्मचारी व्यवस्थापन</Text>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        <StaffList />
      </div>
    </div>
  );
}
