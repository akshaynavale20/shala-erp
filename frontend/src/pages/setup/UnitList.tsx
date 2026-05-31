import {
  Table, Button, Modal, Form, Input, Select, Switch,
  Space, Tag, message,
} from 'antd';
import { MrInput, MrTextArea } from '../../components/common/MrInput';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { unitApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

const UNIT_TYPES = ['school', 'jr_college', 'pre_primary', 'degree_college', 'other'];

export default function UnitList() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units', user?.sansthaId],
    queryFn: () => unitApi.findBySanstha(user!.sansthaId),
    enabled: !!user?.sansthaId,
  });

  const mutation = useMutation({
    mutationFn: (values: any) =>
      editing
        ? unitApi.update(editing.id, values)
        : unitApi.create({ ...values, sansthaId: user!.sansthaId }),
    onSuccess: () => {
      message.success(t('setup.unit.saved'));
      qc.invalidateQueries({ queryKey: ['units'] });
      setOpen(false);
      form.resetFields();
      setEditing(null);
    },
    onError: () => message.error(t('errors.serverError')),
  });

  const openModal = (record?: any) => {
    setEditing(record || null);
    form.setFieldsValue(record || { aided: false });
    setOpen(true);
  };

  const columns = [
    {
      title: t('setup.unit.nameMr'),
      dataIndex: 'nameMr',
      key: 'nameMr',
    },
    {
      title: t('setup.unit.type'),
      dataIndex: 'unitType',
      key: 'unitType',
      render: (v: string) => (
        <Tag color={v === 'school' ? 'blue' : v === 'jr_college' ? 'purple' : 'default'}>
          {t(`setup.unit.types.${v}`)}
        </Tag>
      ),
    },
    {
      title: 'UDISE',
      dataIndex: 'udiseCode',
      key: 'udiseCode',
    },
    {
      title: t('setup.unit.aidedLabel'),
      dataIndex: 'aided',
      key: 'aided',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'orange'}>
          {v ? t('setup.unit.aided') : t('setup.unit.unaided')}
        </Tag>
      ),
    },
    {
      title: t('app.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          icon={<EditOutlined />}
          size="small"
          onClick={() => openModal(record)}
        >
          {t('app.edit')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
         
        >
          {t('setup.unit.new')}
        </Button>
      </div>

      <Table
        dataSource={units}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: t('setup.unit.noUnits') }}
      />

      <Modal
        title={editing ? t('app.edit') : t('setup.unit.new')}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); setEditing(null); }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={mutation.mutate}>
          <Form.Item
            name="nameMr"
            label={t('setup.unit.nameMr')}
            rules={[{ required: true, message: t('validation.required', { field: t('setup.unit.nameMr') }) }]}
          >
            <MrInput placeholder="e.g. zilla parishad shala" />
          </Form.Item>

          <Form.Item name="nameEn" label={t('setup.unit.nameEn')}>
            <Input />
          </Form.Item>

          <Form.Item
            name="unitType"
            label={t('setup.unit.type')}
            rules={[{ required: true, message: t('validation.required', { field: t('setup.unit.type') }) }]}
          >
            <Select>
              {UNIT_TYPES.map((v) => (
                <Select.Option key={v} value={v}>
                  {t(`setup.unit.types.${v}`)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="udiseCode" label="UDISE">
            <Input maxLength={11} />
          </Form.Item>

          <Form.Item name="divisionalBoard" label={t('setup.unit.divisionalBoard')}>
            <Input placeholder="e.g. CBSE / ICSE / State Board" />
          </Form.Item>

          <Form.Item name="addressMr" label={t('setup.unit.addressMr')}>
            <MrTextArea rows={2} placeholder="e.g. pune" />
          </Form.Item>

          <Form.Item name="phone" label={t('setup.unit.phone')}>
            <Input />
          </Form.Item>

          <Form.Item name="aided" label={t('setup.unit.aidedLabel')} valuePropName="checked">
            <Switch
              checkedChildren={t('setup.unit.aided')}
              unCheckedChildren={t('setup.unit.unaided')}
            />
          </Form.Item>

          <Form.Item name="establishedYear" label={t('setup.unit.establishedYear')}>
            <Input type="number" min={1800} max={2030} />
          </Form.Item>

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
             
            >
              {t('app.save')}
            </Button>
            <Button onClick={() => { setOpen(false); form.resetFields(); }}>
              {t('app.cancel')}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
