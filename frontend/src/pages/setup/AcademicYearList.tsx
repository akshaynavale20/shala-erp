import { useState } from 'react';
import { Table, Button, Modal, Form, Select, Tag, message, Space, Switch, Alert } from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { academicYearApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'default',
  active: 'green',
  closing: 'orange',
  closed: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'आगामी',
  active: 'चालू',
  closing: 'समाप्त होत आहे',
  closed: 'संपले',
};

/** Generate ±3 years around today for the dropdown picker */
function buildYearOptions() {
  const today = new Date();
  const calYear = today.getFullYear();
  const startYear = today.getMonth() < 5 ? calYear - 1 : calYear;

  const opts = [];
  for (let offset = -2; offset <= 3; offset++) {
    const y = startYear + offset;
    const short = String(y + 1).slice(2);
    const labelEn = `${y}-${short}`;
    // Marathi numeral labels look like २०२५-२६ but we use ASCII for simplicity
    opts.push({
      value: labelEn,
      labelEn,
      labelMr: labelEn, // can be enhanced with Devanagari digits if needed
      startDate: `${y}-06-01`,
      endDate: `${y + 1}-03-31`,
    });
  }
  return opts;
}

export default function AcademicYearList() {
  const { user: me } = useAuthStore();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const selectedLabel = Form.useWatch('yearLabel', form);

  const { data: years = [], isLoading } = useQuery({
    queryKey: ['academic-years', me?.sansthaId],
    queryFn: () => academicYearApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const yearOptions = buildYearOptions();
  const existingLabels = new Set((years as any[]).map((y: any) => y.labelEn));
  const availableOptions = yearOptions.filter((o) => !existingLabels.has(o.value));

  const invalidate = () => qc.invalidateQueries({ queryKey: ['academic-years'] });

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const opt = yearOptions.find((o) => o.value === values.yearLabel)!;
      const payload = {
        sansthaId: me!.sansthaId,
        labelEn: opt.labelEn,
        labelMr: opt.labelMr,
        startDate: opt.startDate,
        endDate: opt.endDate,
        isCurrent: values.isCurrent ?? false,
        status: values.isCurrent ? 'active' : 'upcoming',
      };
      return academicYearApi.create(payload);
    },
    onSuccess: () => {
      message.success('शैक्षणिक वर्ष जतन झाले');
      invalidate();
      setOpen(false);
      form.resetFields();
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'त्रुटी आली'),
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id: string) => academicYearApi.update(id, { isCurrent: true, status: 'active' }),
    onSuccess: () => { message.success('चालू वर्ष बदलले'); invalidate(); },
    onError: () => message.error('अद्ययावत करता आले नाही'),
  });

  const columns = [
    {
      title: 'शैक्षणिक वर्ष',
      dataIndex: 'labelEn',
      key: 'label',
      render: (v: string, r: any) => (
        <Space>
          <strong>{v}</strong>
          {r.isCurrent && (
            <Tag color="green" icon={<CheckCircleOutlined />}>चालू वर्ष</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'सुरुवात',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'शेवट',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'स्थिती',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: 'कृती',
      key: 'action',
      render: (_: any, rec: any) => (
        !rec.isCurrent ? (
          <Button size="small" onClick={() => setCurrentMutation.mutate(rec.id)}
            loading={setCurrentMutation.isPending}>
            चालू वर्ष करा
          </Button>
        ) : null
      ),
    },
  ];

  const selectedOpt = yearOptions.find((o) => o.value === selectedLabel);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
         
        >
          नवीन शैक्षणिक वर्ष
        </Button>
      </div>

      <Table
        dataSource={years as any[]}
        columns={columns}
        rowKey="id"
        pagination={false}
        loading={isLoading}
        locale={{ emptyText: 'कोणतेही शैक्षणिक वर्ष नाही' }}
      />

      <Modal
        title="नवीन शैक्षणिक वर्ष"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={createMutation.mutate}>
          <Form.Item
            name="yearLabel"
            label="शैक्षणिक वर्ष निवडा"
            rules={[{ required: true, message: 'वर्ष निवडणे आवश्यक आहे' }]}
          >
            <Select
              placeholder="वर्ष निवडा"
              options={availableOptions.map((o) => ({ value: o.value, label: o.labelEn }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          {selectedOpt && (
            <Alert
              type="info"
              style={{ marginBottom: 16 }}
              message={`${selectedOpt.startDate} ते ${selectedOpt.endDate} (आपोआप सेट)`}
            />
          )}

          <Form.Item name="isCurrent" label="हे चालू वर्ष आहे?" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="होय" unCheckedChildren="नाही" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}
             >
              जतन करा
            </Button>
            <Button onClick={() => { setOpen(false); form.resetFields(); }}>रद्द करा</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
