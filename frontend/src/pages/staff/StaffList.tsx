import React from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Tag, message, Tooltip, Popconfirm, DatePicker, Row, Col,
  Upload, Avatar, Typography, Radio,
} from 'antd';
import { downloadIdentityCards } from '../../pdf/IdentityCard';
import { sansthaApi } from '../../api/client';
import { MrInput } from '../../components/common/MrInput';
import {
  PlusOutlined, EditOutlined, StopOutlined, UserOutlined, UploadOutlined,
  SearchOutlined, IdcardOutlined, CameraOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { staffApi, unitApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useUnitAccess } from '../../hooks/useUnitAccess';

const { Text } = Typography;
import { mediaUrl } from '../../api/client';

const GENDER_OPTIONS = [
  { value: 'male', label: 'पुरुष' },
  { value: 'female', label: 'स्त्री' },
  { value: 'other', label: 'इतर' },
];

const EMPLOYEE_TYPE_OPTIONS = [
  { value: 'permanent', label: 'कायम' },
  { value: 'temporary', label: 'तात्पुरता' },
  { value: 'contract', label: 'कंत्राटी' },
  { value: 'aided', label: 'अनुदानित' },
  { value: 'unaided', label: 'विनाअनुदानित' },
];

const EMPLOYEE_TYPE_COLORS: Record<string, string> = {
  permanent: 'green',
  temporary: 'orange',
  contract: 'blue',
  aided: 'purple',
  unaided: 'volcano',
};

export default function StaffList() {
  const { t } = useTranslation();
  const { user: me } = useAuthStore();
  const { unitId: lockedUnitId, canSwitch: canSwitchUnit } = useUnitAccess();
  const qc = useQueryClient();

  const [filterUnitId, setFilterUnitId]   = useState<string | undefined>(lockedUnitId ?? undefined);
  const [searchText,   setSearchText]     = useState('');
  const [filterDesig,  setFilterDesig]    = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>();
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [idCardLoading,   setIdCardLoading]   = useState(false);
  const [langModalOpen,   setLangModalOpen]   = useState(false);
  const [idCardLang,      setIdCardLang]      = useState<'mr' | 'en'>('mr');

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // ── data
  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff', me?.sansthaId, filterUnitId],
    queryFn: () => staffApi.findBySanstha(me!.sansthaId, filterUnitId),
    enabled: !!me?.sansthaId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { data: sansthaData } = useQuery({
    queryKey: ['sanstha', me?.sansthaId],
    queryFn: () => sansthaApi.findOne(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['staff'] });

  const doDownloadIDCards = async (lang: 'mr' | 'en') => {
    const selected = (filteredStaff as any[]).filter((s: any) => selectedRowKeys.includes(s.id));
    const noPhoto = selected.filter((s: any) => !s.photoUrl);
    if (noPhoto.length > 0) {
      message.warning(`${noPhoto.length} कर्मचाऱ्यांचा Photo नाही — तरी ID Card तयार होईल.`);
    }
    setIdCardLoading(true);
    try {
      const unit = (units as any[]).find((u: any) => u.id === filterUnitId);
      await downloadIdentityCards({
        persons: selected.map((s: any) => ({
          type: 'staff' as const,
          nameMr: s.nameMr,
          nameEn: s.nameEn,
          designationMr: s.designationMr,
          employeeType: s.employeeType,
          bloodGroup: s.bloodGroup,
          dob: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined,
          phone: s.phone,
          photoUrl: s.photoUrl,
        })),
        sanstha: sansthaData,
        unit,
        language: lang,
      });
    } catch {
      message.error('ID Card PDF तयार करताना त्रुटी आली');
    } finally {
      setIdCardLoading(false);
    }
  };

  const handlePrintIDCards = () => {
    if (!selectedRowKeys.length) { message.warning('ID Card साठी कर्मचारी निवडा'); return; }
    setLangModalOpen(true);
  };

  // client-side search on top of server-filtered list
  const filteredStaff = useMemo(() => {
    const q = searchText.toLowerCase();
    return (staffList as any[]).filter(s => {
      if (q && ![s.nameMr, s.nameEn, s.designationMr, s.phone].some((v: string) => v?.toLowerCase().includes(q))) return false;
      if (filterDesig && s.designationMr !== filterDesig) return false;
      return true;
    });
  }, [staffList, searchText, filterDesig]);

  const unitOptions = [
    { value: '', label: t('staff.allUnits') },
    ...(units as any[]).map((u) => ({ value: u.id, label: u.nameMr })),
  ];

  const unitNameMap = Object.fromEntries(
    (units as any[]).map((u) => [u.id, u.nameMr]),
  );

  // ── mutations
  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        sansthaId: me!.sansthaId,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
        joiningDate: values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : undefined,
        unitId: values.unitId || null,
      };
      return staffApi.create(payload);
    },
    onSuccess: () => {
      message.success(t('staff.saved'));
      invalidate();
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (e: any) => message.error(e.response?.data?.message || t('errors.serverError')),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
        joiningDate: values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : undefined,
        unitId: values.unitId || null,
      };
      return staffApi.update(editStaff.id, payload);
    },
    onSuccess: () => {
      message.success(t('staff.saved'));
      invalidate();
      setEditStaff(null);
    },
    onError: () => message.error(t('errors.serverError')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => staffApi.deactivate(id),
    onSuccess: () => { message.success(t('app.saved')); invalidate(); },
    onError: () => message.error(t('errors.serverError')),
  });

  const makePhotoUploadProps = (staffId: string, onUploaded?: (url: string) => void): UploadProps => ({
    accept: '.png,.jpg,.jpeg',
    showUploadList: false,
    beforeUpload: async (file) => {
      if (file.size > 2 * 1024 * 1024) {
        message.error('छायाचित्र फाईल २ MB पेक्षा कमी असणे आवश्यक');
        return false;
      }
      setUploadingFor(staffId);
      try {
        const result = await staffApi.uploadPhoto(staffId, file);
        invalidate();
        if (onUploaded && result?.photoUrl) onUploaded(result.photoUrl);
        message.success(t('staff.photoUploaded'));
      } catch {
        message.error(t('errors.serverError'));
      } finally {
        setUploadingFor(null);
      }
      return false;
    },
  });

  const openEdit = (record: any) => {
    setEditStaff(record);
    setEditPhotoUrl(record.photoUrl);
    editForm.setFieldsValue({
      ...record,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
      joiningDate: record.joiningDate ? dayjs(record.joiningDate) : null,
    });
  };

  // ── columns
  const columns = [
    {
      title: t('staff.columns.name'),
      key: 'name',
      render: (_: any, rec: any) => (
        <Space>
          <Upload {...makePhotoUploadProps(rec.id)} disabled={uploadingFor === rec.id}>
            <Tooltip title="फोटो बदला (क्लिक करा)">
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                {rec.photoUrl ? (
                  <img
                    src={mediaUrl(rec.photoUrl)!}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                    alt=""
                  />
                ) : (
                  <Avatar icon={<UserOutlined />} size={36} style={{ backgroundColor: '#1A5276' }} />
                )}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: '#1A5276', borderRadius: '50%',
                  width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CameraOutlined style={{ fontSize: 8, color: '#fff' }} />
                </div>
              </div>
            </Tooltip>
          </Upload>
          <div>
            <Text strong>{rec.nameMr}</Text>
            {rec.nameEn && <div style={{ fontSize: 12, color: '#888' }}>{rec.nameEn}</div>}
          </div>
        </Space>
      ),
    },
    {
      title: t('staff.columns.designation'),
      dataIndex: 'designationMr',
      key: 'designationMr',
    },
    {
      title: t('staff.columns.unit'),
      dataIndex: 'unitId',
      key: 'unitId',
      render: (unitId: string) => unitId ? (unitNameMap[unitId] || unitId) : <Text type="secondary">संस्था स्तर</Text>,
    },
    {
      title: t('staff.columns.employeeType'),
      dataIndex: 'employeeType',
      key: 'employeeType',
      render: (v: string) => {
        const opt = EMPLOYEE_TYPE_OPTIONS.find((o) => o.value === v);
        return <Tag color={EMPLOYEE_TYPE_COLORS[v] || 'default'}>{opt?.label || v}</Tag>;
      },
    },
    {
      title: t('staff.columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => v || '—',
    },
    {
      title: t('staff.columns.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('app.active') : t('app.inactive')}</Tag>,
    },
    {
      title: t('staff.columns.actions'),
      key: 'actions',
      width: 130,
      render: (_: any, rec: any) => (
        <Space>
          <Tooltip title={t('app.edit')}>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)} />
          </Tooltip>
          <Tooltip title={t('setup.users.deactivate')}>
            <Popconfirm
              title={t('staff.deactivateConfirm')}
              onConfirm={() => deactivateMutation.mutate(rec.id)}
              okText={t('app.yes')}
              cancelText={t('app.no')}
            >
              <Button size="small" icon={<StopOutlined />} danger disabled={!rec.isActive} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const staffFormFields = (_form: any) => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item name="nameMr" label={t('staff.nameMr')}
          rules={[{ required: true, message: t('validation.required', { field: t('staff.nameMr') }) }]}>
          <MrInput placeholder="e.g. ramesh" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="nameEn" label={t('staff.nameEn')}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="designationMr" label={t('staff.designationMr')}
          rules={[{ required: true, message: t('validation.required', { field: t('staff.designationMr') }) }]}>
          <MrInput placeholder="e.g. mukhyadhyapak" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="unitId" label={t('staff.unit')}>
          <Select allowClear placeholder={t('staff.allUnits')} options={(units as any[]).map((u) => ({ value: u.id, label: u.nameMr }))} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="gender" label={t('staff.gender')}>
          <Select allowClear options={GENDER_OPTIONS} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="employeeType" label={t('staff.employeeType')}
          rules={[{ required: true, message: t('validation.required', { field: t('staff.employeeType') }) }]}>
          <Select options={EMPLOYEE_TYPE_OPTIONS} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="joiningDate" label={t('staff.joiningDate')}
          rules={[{ required: true, message: t('validation.required', { field: t('staff.joiningDate') }) }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="dateOfBirth" label={t('staff.dateOfBirth')}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="qualificationMr" label={t('staff.qualificationMr')}>
          <MrInput />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="subjectMr" label={t('staff.subjectMr')}>
          <MrInput />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="phone" label={t('staff.phone')}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="email" label={t('staff.email')}
          rules={[{ type: 'email', message: t('validation.email') }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="salaryGrade" label={t('staff.salaryGrade')}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="bloodGroup" label="रक्तगट (Blood Group)">
          <Select allowClear options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => ({ value: g, label: g }))} placeholder="रक्तगट निवडा" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="aadhaarLast4" label={t('staff.aadhaarLast4')}
          rules={[{ max: 4, message: 'फक्त शेवटचे ४ अंक' }]}>
          <Input maxLength={4} placeholder="XXXX" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="saralId" label={t('staff.saralId')}>
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );

  return (
    <div>
      {/* Filter bar */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={7}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="नाव / पदनाम / दूरध्वनी शोधा"
            allowClear
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </Col>
        {canSwitchUnit && (
          <Col xs={12} sm={6} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('staff.filterByUnit')}
              allowClear
              value={filterUnitId || undefined}
              onChange={(v) => setFilterUnitId(v || undefined)}
              options={unitOptions}
            />
          </Col>
        )}
        <Col xs={12} sm={6} md={5}>
          <Select
            style={{ width: '100%' }}
            placeholder="पदनामानुसार"
            allowClear
            value={filterDesig}
            onChange={setFilterDesig}
            options={[...new Set((staffList as any[]).map(s => s.designationMr).filter(Boolean))].map(d => ({ value: d, label: d }))}
          />
        </Col>
        <Col xs={24} sm={24} md={7} style={{ textAlign: 'right' }}>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button
                icon={<IdcardOutlined />}
                loading={idCardLoading}
                onClick={handlePrintIDCards}
                style={{ borderColor: '#1A5276', color: '#1A5276' }}
              >
                ID Card Print ({selectedRowKeys.length})
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {t('staff.addNew')}
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={filteredStaff}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: true,
        }}
      />

      {/* ── Create modal */}
      <Modal
        title={t('staff.new')}
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        footer={null}
        width={720}
      >
        <Form form={createForm} layout="vertical" onFinish={createMutation.mutate}>
          {staffFormFields(createForm)}
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}
             >{t('app.save')}</Button>
            <Button onClick={() => { setCreateOpen(false); createForm.resetFields(); }}>{t('app.cancel')}</Button>
          </Space>
        </Form>
      </Modal>

      {/* ── Edit modal */}
      <Modal
        title={t('staff.edit')}
        open={!!editStaff}
        onCancel={() => setEditStaff(null)}
        footer={null}
        width={740}
      >
        {/* Photo upload section */}
        {editStaff && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '12px 16px', background: '#F4F7FB', borderRadius: 8, border: '1px solid #E8EFF7' }}>
            <Upload
              {...makePhotoUploadProps(editStaff.id, (url) => setEditPhotoUrl(url))}
              disabled={uploadingFor === editStaff.id}
            >
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                {editPhotoUrl ? (
                  <img
                    src={mediaUrl(editPhotoUrl)!}
                    style={{ width: 72, height: 88, objectFit: 'cover', borderRadius: 4, border: '2px solid #1A3A5C' }}
                    alt="staff photo"
                  />
                ) : (
                  <div style={{
                    width: 72, height: 88, borderRadius: 4,
                    background: '#D6E4F7', border: '2px dashed #1A3A5C',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    <CameraOutlined style={{ fontSize: 22, color: '#1A3A5C' }} />
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 4, right: 4,
                  background: '#1A3A5C', borderRadius: '50%',
                  width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UploadOutlined style={{ fontSize: 10, color: '#fff' }} />
                </div>
              </div>
            </Upload>
            <div>
              <div style={{ fontWeight: 600, color: '#1A3A5C', marginBottom: 4 }}>कर्मचारी छायाचित्र</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                फोटोवर क्लिक करून नवीन छायाचित्र अपलोड करा<br />
                PNG / JPEG · कमाल 2 MB
              </div>
              {uploadingFor === editStaff.id && (
                <div style={{ fontSize: 12, color: '#1A3A5C', marginTop: 4 }}>अपलोड होत आहे…</div>
              )}
            </div>
          </div>
        )}
        <Form form={editForm} layout="vertical" onFinish={updateMutation.mutate}>
          {staffFormFields(editForm)}
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}
             >{t('app.save')}</Button>
            <Button onClick={() => setEditStaff(null)}>{t('app.cancel')}</Button>
          </Space>
        </Form>
      </Modal>

      {/* ── Language picker modal for ID cards */}
      <Modal
        title="ID Card भाषा निवडा"
        open={langModalOpen}
        onOk={async () => {
          setLangModalOpen(false);
          await doDownloadIDCards(idCardLang);
        }}
        onCancel={() => setLangModalOpen(false)}
        okText="PDF तयार करा"
        cancelText="रद्द करा"
        okButtonProps={{ loading: idCardLoading }}
        width={360}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 12, color: '#555' }}>
            ID Card वर नावे व मजकूर कोणत्या भाषेत असावेत?
          </div>
          <Radio.Group
            value={idCardLang}
            onChange={e => setIdCardLang(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <Radio value="mr">
              <span style={{ fontWeight: 600 }}>मराठी</span>
              <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>— नावे, शाळा, संस्था मराठीत</span>
            </Radio>
            <Radio value="en">
              <span style={{ fontWeight: 600 }}>English</span>
              <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>— Names, School & Sanstha in English</span>
            </Radio>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  );
}
