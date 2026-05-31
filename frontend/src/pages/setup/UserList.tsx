import {
  Table, Button, Modal, Form, Input, Select, Space,
  Tag, message, Tooltip, Popconfirm, Divider, Typography, Alert,
} from 'antd';
import {
  PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined,
  UserAddOutlined, CloseCircleOutlined, KeyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { userApi, roleApi, unitApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { MrInput } from '../../components/common/MrInput';

const { Text } = Typography;

export default function UserList() {
  const { user: me } = useAuthStore();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [roleUser, setRoleUser] = useState<any>(null);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  // ── data ───────────────────────────────────────────────────────
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', me?.sansthaId],
    queryFn: () => userApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', me?.sansthaId],
    queryFn: () => roleApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  // ── mutations ──────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { roleId, unitId, ...userData } = values;
      const newUser = await userApi.create({ ...userData, sansthaId: me!.sansthaId });
      if (roleId) {
        await userApi.assignRole(newUser.id, { sansthaId: me!.sansthaId, roleId, unitId });
      }
      return newUser;
    },
    onSuccess: () => {
      message.success('वापरकर्ता तयार झाला');
      invalidate();
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'वापरकर्ता तयार करता आला नाही'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => userApi.update(editUser.id, values),
    onSuccess: () => { message.success('माहिती जतन झाली'); invalidate(); setEditUser(null); },
    onError: () => message.error('अद्ययावत करता आले नाही'),
  });

  const assignRoleMutation = useMutation({
    mutationFn: (values: any) =>
      userApi.assignRole(roleUser.id, { sansthaId: me!.sansthaId, ...values }),
    onSuccess: () => {
      message.success('भूमिका नियुक्त झाली');
      invalidate();
      roleForm.resetFields();
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'भूमिका नियुक्त करता आली नाही'),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, uurId }: any) => userApi.removeRole(userId, uurId),
    onSuccess: () => { message.success('भूमिका काढली'); invalidate(); },
    onError: () => message.error('भूमिका काढता आली नाही'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (u: any) => u.isActive ? userApi.deactivate(u.id) : userApi.reactivate(u.id),
    onSuccess: () => { message.success('स्थिती बदलली'); invalidate(); },
    onError: () => message.error('स्थिती बदलता आली नाही'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => userApi.resetPassword(id),
    onSuccess: (data: any) => {
      setResetTarget(null);
      setTempPassword(data.temporaryPassword);
      invalidate();
    },
    onError: (e: any) =>
      message.error(e.response?.data?.message || 'पासवर्ड रिसेट करता आला नाही'),
  });

  // ── select options ─────────────────────────────────────────────
  const createRoleId = Form.useWatch('roleId', createForm);
  const addRoleId = Form.useWatch('roleId', roleForm);
  const createRoleObj = (roles as any[]).find((r) => r.id === createRoleId);
  const addRoleObj = (roles as any[]).find((r) => r.id === addRoleId);

  const roleOptions = [
    {
      label: 'संस्था स्तरीय भूमिका',
      options: (roles as any[]).filter((r) => r.scope === 'sanstha').map((r) => ({ value: r.id, label: r.nameMr })),
    },
    {
      label: 'शाळा स्तरीय भूमिका',
      options: (roles as any[]).filter((r) => r.scope === 'unit').map((r) => ({ value: r.id, label: r.nameMr })),
    },
  ];
  const unitOptions = (units as any[]).map((u) => ({ value: u.id, label: u.nameMr }));

  const columns = [
    {
      title: 'नाव',
      dataIndex: 'nameMr',
      key: 'nameMr',
      render: (name: string, rec: any) => (
        <div>
          <Text strong>{name}</Text>
          {rec.mustChangePassword && (
            <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>पासवर्ड बदलणे आवश्यक</Tag>
          )}
        </div>
      ),
    },
    { title: 'ईमेल', dataIndex: 'email', key: 'email' },
    { title: 'फोन', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '—' },
    {
      title: 'भूमिका',
      key: 'roles',
      render: (_: any, rec: any) => {
        const assignments = (rec.unitRoles || []).filter((ur: any) => ur.isActive);
        if (!assignments.length) return <Text type="secondary">—</Text>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {assignments.map((ur: any) => (
              <Tag key={ur.id} color="blue">
                {ur.role?.nameMr || '—'}{!ur.unitId ? ' · संस्था' : ''}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'स्थिती',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'सक्रिय' : 'निष्क्रिय'}</Tag>,
    },
    {
      title: 'कृती',
      key: 'actions',
      width: me?.isSansthaDirector ? 180 : 140,
      render: (_: any, rec: any) => (
        <Space>
          <Tooltip title="संपादन">
            <Button size="small" icon={<EditOutlined />}
              onClick={() => { setEditUser(rec); editForm.setFieldsValue({ nameMr: rec.nameMr, phone: rec.phone }); }}
            />
          </Tooltip>
          <Tooltip title="भूमिका जोडा">
            <Button size="small" icon={<UserAddOutlined />}
              onClick={() => { setRoleUser(rec); roleForm.resetFields(); }}
            />
          </Tooltip>
          {/* Password reset — only Sanstha Sanchalak sees this */}
          {me?.isSansthaDirector && (
            <Tooltip title="पासवर्ड रिसेट करा">
              <Button
                size="small"
                icon={<KeyOutlined />}
                onClick={() => setResetTarget(rec)}
              />
            </Tooltip>
          )}
          <Tooltip title={rec.isActive ? 'निष्क्रिय करा' : 'सक्रिय करा'}>
            <Popconfirm
              title={rec.isActive ? 'हा वापरकर्ता निष्क्रिय करायचा?' : 'हा वापरकर्ता सक्रिय करायचा?'}
              onConfirm={() => toggleActiveMutation.mutate(rec)}
              okText="होय" cancelText="नाही"
            >
              <Button size="small"
                icon={rec.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                danger={rec.isActive}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          नवीन वापरकर्ता
        </Button>
      </div>

      <Table dataSource={users as any[]} columns={columns} rowKey="id" loading={isLoading} />

      {/* ── Create user modal ──────────────────────────────────── */}
      <Modal title="नवीन वापरकर्ता" open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }} footer={null} width={520}>
        <Form form={createForm} layout="vertical" onFinish={createMutation.mutate}>
          <Form.Item name="nameMr" label="नाव (मराठी)" rules={[{ required: true }]}>
            <MrInput />
          </Form.Item>
          <Form.Item name="email" label="ईमेल"
            rules={[{ required: true }, { type: 'email', message: 'चुकीचा ईमेल' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="फोन">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="प्रारंभिक पासवर्ड"
            rules={[{ required: true }, { min: 8, message: 'किमान ८ अक्षरे' }]}>
            <Input.Password />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="वापरकर्त्याला पहिल्या लॉगिनवर पासवर्ड बदलणे सक्ती होईल."
            style={{ marginBottom: 16 }}
          />
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="roleId" label="भूमिका (पर्यायी)">
            <Select placeholder="भूमिका निवडा" allowClear showSearch
              optionFilterProp="label" options={roleOptions} />
          </Form.Item>
          {createRoleObj?.scope === 'unit' && (
            <Form.Item name="unitId" label="शाळा" rules={[{ required: true, message: 'शाळा निवडा' }]}>
              <Select placeholder="शाळा निवडा" options={unitOptions} />
            </Form.Item>
          )}
          <Space>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              जतन करा</Button>
            <Button onClick={() => setCreateOpen(false)}>रद्द करा</Button>
          </Space>
        </Form>
      </Modal>

      {/* ── Edit user modal (no password field) ───────────────── */}
      <Modal title="वापरकर्ता संपादन" open={!!editUser}
        onCancel={() => setEditUser(null)} footer={null} width={480}>
        <Form form={editForm} layout="vertical" onFinish={updateMutation.mutate}>
          <Form.Item name="nameMr" label="नाव (मराठी)" rules={[{ required: true }]}>
            <MrInput />
          </Form.Item>
          <Form.Item name="phone" label="फोन">
            <Input />
          </Form.Item>
          <Alert
            type="warning"
            showIcon
            message="पासवर्ड बदल फक्त संस्था संचालक 'पासवर्ड रिसेट' बटणाने करू शकतो."
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              जतन करा</Button>
            <Button onClick={() => setEditUser(null)}>रद्द करा</Button>
          </Space>
        </Form>
      </Modal>

      {/* ── Manage roles modal ─────────────────────────────────── */}
      <Modal title={`भूमिका व्यवस्थापन — ${roleUser?.nameMr}`} open={!!roleUser}
        onCancel={() => setRoleUser(null)} footer={null} width={560}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>सध्याच्या भूमिका</Text>
        {(roleUser?.unitRoles || []).filter((ur: any) => ur.isActive).length === 0 ? (
          <Text type="secondary">कोणतीही भूमिका नाही</Text>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {(roleUser?.unitRoles || []).filter((ur: any) => ur.isActive).map((ur: any) => (
              <Tag key={ur.id} color="blue" style={{ marginBottom: 6 }}>
                {ur.role?.nameMr || '—'}{!ur.unitId ? ' · संस्था' : ''}
                <Tooltip title="भूमिका काढा">
                  <CloseCircleOutlined
                    style={{ marginLeft: 6, cursor: 'pointer' }}
                    onClick={() => removeRoleMutation.mutate({ userId: roleUser.id, uurId: ur.id })}
                  />
                </Tooltip>
              </Tag>
            ))}
          </div>
        )}

        <Divider />
        <Text strong style={{ display: 'block', marginBottom: 8 }}>नवीन भूमिका जोडा</Text>
        <Form form={roleForm} layout="vertical" onFinish={assignRoleMutation.mutate}>
          <Form.Item name="roleId" label="भूमिका" rules={[{ required: true, message: 'भूमिका निवडा' }]}>
            <Select placeholder="भूमिका निवडा" showSearch optionFilterProp="label" options={roleOptions} />
          </Form.Item>
          {addRoleObj?.scope === 'unit' && (
            <Form.Item name="unitId" label="शाळा" rules={[{ required: true, message: 'शाळा निवडा' }]}>
              <Select placeholder="शाळा निवडा" options={unitOptions} />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" loading={assignRoleMutation.isPending}>
            भूमिका जोडा</Button>
        </Form>
      </Modal>

      {/* ── Reset password confirmation modal ─────────────────── */}
      <Modal
        title="पासवर्ड रिसेट"
        open={!!resetTarget}
        onCancel={() => setResetTarget(null)}
        footer={null}
        width={460}
      >
        {resetTarget && (
          <>
            <Alert
              type="warning"
              showIcon
              message={`${resetTarget.nameMr} (${resetTarget.email}) यांचा पासवर्ड रिसेट होईल.`}
              description="एक तात्पुरता पासवर्ड तयार होईल. वापरकर्त्याला पहिल्या लॉगिनवर नवीन पासवर्ड सेट करावा लागेल."
              style={{ marginBottom: 20 }}
            />
            <Space>
              <Button
                type="primary"
                danger
                icon={<KeyOutlined />}
                loading={resetPasswordMutation.isPending}
                onClick={() => resetPasswordMutation.mutate(resetTarget.id)}
              >
                रिसेट करा
              </Button>
              <Button onClick={() => setResetTarget(null)}>रद्द करा</Button>
            </Space>
          </>
        )}
      </Modal>

      {/* ── Temp password display modal ─────────────────────────── */}
      <Modal
        title="तात्पुरता पासवर्ड"
        open={!!tempPassword}
        onCancel={() => setTempPassword(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setTempPassword(null)}>
            समजले, बंद करा
          </Button>,
        ]}
        width={420}
      >
        <Alert
          type="success"
          showIcon
          message="पासवर्ड रिसेट यशस्वी"
          style={{ marginBottom: 16 }}
        />
        <Alert
          type="warning"
          showIcon
          message="हा पासवर्ड फक्त एकदाच दिसेल. वापरकर्त्याला सांगा."
          style={{ marginBottom: 16 }}
        />
        <div style={{
          background: '#f0f4ff', border: '2px dashed #1A5276',
          padding: '16px 24px', borderRadius: 8, textAlign: 'center',
        }}>
          <Text copyable style={{ fontSize: 22, fontFamily: 'monospace', letterSpacing: 2, color: '#1A5276' }}>
            {tempPassword}
          </Text>
        </div>
        <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
          वापरकर्त्याने लॉगिन केल्यावर हा पासवर्ड बदलणे बंधनकारक आहे.
        </div>
      </Modal>
    </div>
  );
}
