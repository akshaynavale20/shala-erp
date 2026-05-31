import { useState } from 'react';
import {
  Table, Tag, Typography, Tooltip, Collapse,
  Button, Modal, Form, Input, Select, Checkbox,
  Space, message, Divider,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

const { Text } = Typography;
const { Panel } = Collapse;

// Marathi permission labels for display
const PERMISSION_LABELS: Record<string, string> = {
  'setup:manage': 'सेटअप व्यवस्थापन',
  'unit:manage': 'शाळा व्यवस्थापन',
  'role:manage': 'भूमिका व्यवस्थापन',
  'user:manage': 'वापरकर्ता व्यवस्थापन',
  'student:create': 'विद्यार्थी नोंदणी',
  'student:read': 'विद्यार्थी पाहणे',
  'student:edit': 'विद्यार्थी संपादन',
  'student:delete': 'विद्यार्थी हटवणे',
  'staff:create': 'कर्मचारी नोंदणी',
  'staff:read': 'कर्मचारी पाहणे',
  'staff:edit': 'कर्मचारी संपादन',
  'attendance:mark': 'हजेरी नोंद',
  'attendance:read': 'हजेरी पाहणे',
  'exam:create': 'परीक्षा तयार करणे',
  'exam:marks_entry': 'गुण नोंद',
  'exam:read': 'परीक्षा पाहणे',
  'fee:collect': 'शुल्क संकलन',
  'fee:read': 'शुल्क पाहणे',
  'fee:manage': 'शुल्क व्यवस्थापन',
  'salary:run': 'वेतन चालवणे',
  'salary:read': 'वेतन पाहणे',
  'salary:manage': 'वेतन व्यवस्थापन',
  'certificate:issue': 'प्रमाणपत्र देणे',
  'certificate:read': 'प्रमाणपत्र पाहणे',
  'report:unit': 'शाळा अहवाल',
  'report:sanstha': 'संस्था अहवाल',
  'year:transition': 'वर्ष संक्रमण',
};

const PERMISSION_GROUPS = [
  { label: 'सेटअप', permissions: ['setup:manage', 'unit:manage', 'role:manage', 'user:manage'] },
  { label: 'विद्यार्थी', permissions: ['student:create', 'student:read', 'student:edit', 'student:delete'] },
  { label: 'कर्मचारी', permissions: ['staff:create', 'staff:read', 'staff:edit'] },
  { label: 'हजेरी', permissions: ['attendance:mark', 'attendance:read'] },
  { label: 'परीक्षा', permissions: ['exam:create', 'exam:marks_entry', 'exam:read'] },
  { label: 'शुल्क', permissions: ['fee:collect', 'fee:read', 'fee:manage'] },
  { label: 'वेतन', permissions: ['salary:run', 'salary:read', 'salary:manage'] },
  { label: 'प्रमाणपत्र', permissions: ['certificate:issue', 'certificate:read'] },
  { label: 'अहवाल', permissions: ['report:unit', 'report:sanstha'] },
  { label: 'वर्ष', permissions: ['year:transition'] },
];

const SCOPE_COLORS: Record<string, string> = {
  sanstha: 'blue',
  unit: 'green',
};

const SCOPE_LABELS: Record<string, string> = {
  sanstha: 'संस्था स्तर',
  unit: 'शाळा स्तर',
};

export default function RoleList() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles', user?.sansthaId],
    queryFn: () => roleApi.findBySanstha(user!.sansthaId),
    enabled: !!user?.sansthaId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['roles'] });

  const createMutation = useMutation({
    mutationFn: (values: any) =>
      roleApi.create({
        sansthaId: user!.sansthaId,
        nameMr: values.nameMr,
        nameEn: values.nameEn,
        scope: values.scope,
        permissions: values.permissions || [],
        isSystemRole: false,
      }),
    onSuccess: () => {
      message.success('भूमिका तयार झाली');
      invalidate();
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'भूमिका तयार करता आली नाही'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      roleApi.update(editRole.id, {
        nameMr: values.nameMr,
        nameEn: values.nameEn,
        permissions: values.permissions || [],
      }),
    onSuccess: () => {
      message.success('भूमिका अद्ययावत झाली');
      invalidate();
      setEditRole(null);
      editForm.resetFields();
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'अद्ययावत करता आले नाही'),
  });

  const columns = [
    {
      title: 'भूमिका',
      dataIndex: 'nameMr',
      key: 'nameMr',
      render: (name: string, rec: any) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{rec.nameEn}</Text>
        </div>
      ),
    },
    {
      title: 'स्तर',
      dataIndex: 'scope',
      key: 'scope',
      width: 140,
      render: (scope: string) => (
        <Tag color={SCOPE_COLORS[scope] || 'default'}>{SCOPE_LABELS[scope] || scope}</Tag>
      ),
    },
    {
      title: 'प्रकार',
      dataIndex: 'isSystemRole',
      key: 'isSystemRole',
      width: 120,
      render: (v: boolean) => (
        <Tag color={v ? 'orange' : 'purple'}>{v ? 'प्रणाली' : 'सानुकूल'}</Tag>
      ),
    },
    {
      title: 'परवानग्या',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 500 }}>
          {perms.map((p) => (
            <Tooltip key={p} title={p}>
              <Tag style={{ marginBottom: 2, fontSize: 11 }}>
                {PERMISSION_LABELS[p] || p}
              </Tag>
            </Tooltip>
          ))}
        </div>
      ),
    },
    {
      title: 'कृती',
      key: 'actions',
      width: 80,
      render: (_: any, rec: any) => (
        <Tooltip title="परवानग्या संपादित करा">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditRole(rec);
              editForm.setFieldsValue({
                nameMr: rec.nameMr,
                nameEn: rec.nameEn,
                permissions: rec.permissions,
              });
            }}
          />
        </Tooltip>
      ),
    },
  ];

  const sansthaRoles = (roles as any[]).filter((r) => r.scope === 'sanstha');
  const unitRoles = (roles as any[]).filter((r) => r.scope === 'unit');

  const PermissionPicker = ({ name }: { name: string }) => (
    <Form.Item name={name} label="परवानग्या" style={{ marginBottom: 0 }}>
      <Checkbox.Group style={{ width: '100%' }}>
        {PERMISSION_GROUPS.map((grp) => (
          <div key={grp.label} style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 4, color: '#555' }}>
              {grp.label}
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {grp.permissions.map((p) => (
                <Checkbox key={p} value={p} style={{ marginLeft: 0 }}>
                  <Text style={{ fontSize: 12 }}>{PERMISSION_LABELS[p]}</Text>
                </Checkbox>
              ))}
            </div>
          </div>
        ))}
      </Checkbox.Group>
    </Form.Item>
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
         
        >
          नवीन भूमिका
        </Button>
      </div>

      <Collapse defaultActiveKey={['sanstha', 'unit']} bordered={false} style={{ background: 'transparent' }}>
        <Panel
          header={<Text strong style={{ fontSize: 15 }}>संस्था स्तरीय भूमिका ({sansthaRoles.length})</Text>}
          key="sanstha"
        >
          <Table dataSource={sansthaRoles} columns={columns} rowKey="id"
            loading={isLoading} pagination={false} size="small" />
        </Panel>
        <Panel
          header={<Text strong style={{ fontSize: 15 }}>शाळा स्तरीय भूमिका ({unitRoles.length})</Text>}
          key="unit"
        >
          <Table dataSource={unitRoles} columns={columns} rowKey="id"
            loading={isLoading} pagination={false} size="small" />
        </Panel>
      </Collapse>

      <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
        * प्रणाली भूमिकांचे नाव बदलता येत नाही. फक्त परवानग्या अद्ययावत करता येतात.
      </div>

      {/* ── Create role modal */}
      <Modal
        title="नवीन भूमिका तयार करा"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={createMutation.mutate}>
          <Form.Item name="nameMr" label="भूमिकेचे नाव (मराठी)"
            rules={[{ required: true, message: 'मराठी नाव आवश्यक आहे' }]}>
            <Input placeholder="उदा. शाळा लिपिक" />
          </Form.Item>
          <Form.Item name="nameEn" label="भूमिकेचे नाव (English)"
            rules={[{ required: true, message: 'English name required' }]}>
            <Input placeholder="e.g. School Clerk" />
          </Form.Item>
          <Form.Item name="scope" label="स्तर"
            rules={[{ required: true, message: 'स्तर निवडा' }]}
            initialValue="unit">
            <Select
              options={[
                { value: 'sanstha', label: 'संस्था स्तर (सर्व शाळांसाठी)' },
                { value: 'unit', label: 'शाळा स्तर (एका शाळेसाठी)' },
              ]}
            />
          </Form.Item>
          <Divider />
          <PermissionPicker name="permissions" />
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}
               >
                भूमिका तयार करा
              </Button>
              <Button onClick={() => { setCreateOpen(false); createForm.resetFields(); }}>रद्द करा</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* ── Edit role modal */}
      <Modal
        title={`भूमिका संपादन — ${editRole?.nameMr}`}
        open={!!editRole}
        onCancel={() => { setEditRole(null); editForm.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={updateMutation.mutate}>
          {!editRole?.isSystemRole && (
            <>
              <Form.Item name="nameMr" label="भूमिकेचे नाव (मराठी)" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="nameEn" label="भूमिकेचे नाव (English)" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Divider />
            </>
          )}
          <PermissionPicker name="permissions" />
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}
               >
                जतन करा
              </Button>
              <Button onClick={() => { setEditRole(null); editForm.resetFields(); }}>रद्द करा</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
