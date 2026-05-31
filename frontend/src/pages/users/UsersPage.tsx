import { UserOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import UserList from '../setup/UserList';

const { Text } = Typography;

export default function UsersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <UserOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>वापरकर्ते व्यवस्थापन</Text>
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
        <UserList />
      </div>
    </div>
  );
}
