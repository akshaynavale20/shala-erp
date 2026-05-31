import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Table, Button, Modal, Form, Input, Select, DatePicker,
  InputNumber, Tabs, Space, Tag, Popconfirm, Row, Col, Statistic,
  Typography, Badge, Tooltip, Empty, InputNumber as InputNum, message,
} from 'antd';
import {
  PlusOutlined, CheckOutlined, PrinterOutlined,
  ArrowUpOutlined, ArrowDownOutlined, WalletOutlined,
  BookOutlined, BarChartOutlined,
  SearchOutlined, ReloadOutlined, FileExcelOutlined,
  BankOutlined,
} from '@ant-design/icons';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { accountsApi, sansthaApi, unitApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import {
  brandHeader, BRAND_CSS, openPrint,
  exportToExcel,
} from '../../utils/erp-print';
import { downloadReportPDF } from '../../pdf/ReportTable';

/** Convert erp-print { title, key, align } cols → ReportTable ColDef { header, key, align } */
function toCols(cols: { title: string; key: string; align?: string }[]) {
  return cols.map(c => ({ key: c.key, header: c.title, align: (c.align as any) || 'left' }));
}
import { MrInput } from '../../components/common/MrInput';
import { ComingSoonBanner } from '../../components/common/ComingSoon';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ── Category labels in Marathi ─────────────────────────────────────────────────
const INCOME_CATEGORIES: Record<string, string> = {
  fee_income: 'शुल्क उत्पन्न',
  grant_income: 'अनुदान',
  donation: 'देणगी',
  other_income: 'इतर उत्पन्न',
};

const EXPENSE_CATEGORIES: Record<string, string> = {
  salary: 'वेतन',
  rent: 'भाडे',
  electricity: 'वीजबिल',
  water: 'पाणीपट्टी',
  maintenance: 'देखभाल',
  stationery: 'लेखनसामग्री',
  equipment: 'साहित्य / उपकरण',
  exam_expense: 'परीक्षा खर्च',
  sports: 'क्रीडा',
  library: 'ग्रंथालय',
  other_expense: 'इतर खर्च',
};

const ALL_CATEGORIES = { ...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES };

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'रोख',
  cheque: 'धनादेश',
  neft: 'NEFT',
  upi: 'UPI',
  bank_transfer: 'बँक हस्तांतरण',
};

// ── Print voucher ──────────────────────────────────────────────────────────────
function printVoucher(record: any, sanstha?: any, unit?: any, userName?: string) {
  const categoryLabel = ALL_CATEGORIES[record.category] || record.category;
  const typeLabel = record.type === 'income' ? 'जमा' : 'खर्च';
  const amtColor = record.type === 'income' ? '#27AE60' : '#E74C3C';
  const serial = 'VCH-' + Date.now().toString(36).toUpperCase().slice(-6);
  const now = dayjs().format('DD/MM/YYYY HH:mm:ss');

  const html = `<html><head><meta charset="UTF-8"/>
<style>
${BRAND_CSS}
.page { max-width: 640px; margin: 0 auto; padding: 20px 24px; }
.amount-cell { font-size: 18px; font-weight: 700; color: ${amtColor}; }
table.data td { padding: 7px 10px; border: 1px solid #ccc; }
table.data td:first-child { font-weight: 600; width: 40%; background: #f9f9f9; }
</style></head><body>
<div class="page">
  ${brandHeader(sanstha, unit)}
  <div style="text-align:center;margin-bottom:10px">
    <span class="doc-title">${typeLabel} व्हाउचर / VOUCHER</span>
    ${record.voucherNumber ? `<div style="font-size:12px;color:#666;margin-top:4px">व्हाउचर क्र: ${record.voucherNumber}</div>` : ''}
  </div>
  <table class="data">
    <tr><td>तारीख</td><td>${record.transactionDate ? dayjs(record.transactionDate).format('DD/MM/YYYY') : '—'}</td></tr>
    <tr><td>प्रकार</td><td>${typeLabel}</td></tr>
    <tr><td>विभाग</td><td>${categoryLabel}</td></tr>
    <tr><td>वर्णन</td><td>${record.descriptionMr || '—'}</td></tr>
    <tr><td>पक्षाचे नाव</td><td>${record.partyNameMr || '—'}</td></tr>
    <tr><td>रक्कम</td><td class="amount-cell">₹ ${Number(record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
    <tr><td>भरणा पद्धत</td><td>${PAYMENT_METHODS[record.paymentMethod] || record.paymentMethod || '—'}</td></tr>
    ${record.referenceNumber ? `<tr><td>संदर्भ क्र.</td><td>${record.referenceNumber}</td></tr>` : ''}
    ${record.bankName ? `<tr><td>बँक</td><td>${record.bankName}</td></tr>` : ''}
    ${record.remarks ? `<tr><td>नोंद</td><td>${record.remarks}</td></tr>` : ''}
  </table>
  <div class="sign-row">
    <div class="sign"><div class="seal-box">शिक्का</div><div class="sign-label">संस्थेचा शिक्का</div></div>
    <div class="sign"><div class="sign-line"></div><div class="sign-label">प्रवेशकर्ता</div></div>
    <div class="sign"><div class="sign-line"></div><div class="sign-label">मंजूरकर्ता</div></div>
  </div>
  <div class="audit-footer">
    <span>📅 मुद्रित: ${now}</span>
    <span>👤 वापरकर्ता: ${userName || 'प्रणाली'}</span>
    <span>🔢 व्हाउचर क्र.: ${serial}</span>
  </div>
  <button class="print-btn no-print" onclick="window.print()" style="padding:10px 28px;background:#C0722A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-family:inherit">🖨️ Print / PDF Save करा</button>
</div>
</body></html>`;
  openPrint(html);
}

// ── Advanced filter bar ────────────────────────────────────────────────────────
interface Filters {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  categories: string[];
  paymentMethod: string;
  partySearch: string;
  minAmount: number | null;
  maxAmount: number | null;
  unitId: string;
  approved: string;
}

const defaultFilters: Filters = {
  dateRange: null, categories: [], paymentMethod: '',
  partySearch: '', minAmount: null, maxAmount: null, unitId: '', approved: '',
};

function FilterBar({
  filters, onChange, units, filterType,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  units: any[];
  filterType: 'income' | 'expense' | 'all';
}) {
  const { t } = useTranslation();

  const getCats = () => {
    const income: Record<string, string> = {
      fee_income: t('accounts.incomeCategories.fee_income'),
      grant_income: t('accounts.incomeCategories.grant_income'),
      donation: t('accounts.incomeCategories.donation'),
      other_income: t('accounts.incomeCategories.other_income'),
    };
    const expense: Record<string, string> = {
      salary: t('accounts.expenseCategories.salary'),
      rent: t('accounts.expenseCategories.rent'),
      electricity: t('accounts.expenseCategories.electricity'),
      water: t('accounts.expenseCategories.water'),
      maintenance: t('accounts.expenseCategories.maintenance'),
      stationery: t('accounts.expenseCategories.stationery'),
      equipment: t('accounts.expenseCategories.equipment'),
      exam_expense: t('accounts.expenseCategories.exam_expense'),
      sports: t('accounts.expenseCategories.sports'),
      library: t('accounts.expenseCategories.library'),
      other_expense: t('accounts.expenseCategories.other_expense'),
    };
    if (filterType === 'income') return income;
    if (filterType === 'expense') return expense;
    return { ...income, ...expense };
  };
  const cats = getCats();

  const payMethods: Record<string, string> = {
    cash: t('accounts.paymentMethods.cash'),
    cheque: t('accounts.paymentMethods.cheque'),
    neft: t('accounts.paymentMethods.neft'),
    upi: t('accounts.paymentMethods.upi'),
    bank_transfer: t('accounts.paymentMethods.bank_transfer'),
  };

  return (
    <Card size="small" style={{ marginBottom: 12, background: '#F8FBFE' }}>
      <Space wrap>
        <RangePicker
          size="small"
          format="DD/MM/YYYY"
          value={filters.dateRange}
          placeholder={[t('accounts.filterBar.startDate'), t('accounts.filterBar.endDate')]}
          onChange={(v) => onChange({ dateRange: v as any })}
        />
        <Select
          size="small"
          mode="multiple"
          maxTagCount={1}
          allowClear
          placeholder={t('accounts.filterBar.category')}
          style={{ minWidth: 140 }}
          value={filters.categories}
          onChange={(v) => onChange({ categories: v })}
        >
          {Object.entries(cats).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}
        </Select>
        <Select
          size="small"
          allowClear
          placeholder={t('accounts.filterBar.paymentMethod')}
          style={{ width: 120 }}
          value={filters.paymentMethod || undefined}
          onChange={(v) => onChange({ paymentMethod: v || '' })}
        >
          {Object.entries(payMethods).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}
        </Select>
        <Input
          size="small"
          placeholder={t('accounts.filterBar.partySearch')}
          style={{ width: 130 }}
          prefix={<SearchOutlined />}
          value={filters.partySearch}
          onChange={(e) => onChange({ partySearch: e.target.value })}
          allowClear
        />
        {units.length > 1 && (
          <Select
            size="small"
            allowClear
            placeholder={t('accounts.filterBar.unit')}
            style={{ width: 140 }}
            value={filters.unitId || undefined}
            onChange={(v) => onChange({ unitId: v || '' })}
          >
            {units.map((u: any) => <Option key={u.id} value={u.id}>{u.nameMr}</Option>)}
          </Select>
        )}
        <Select
          size="small"
          allowClear
          placeholder={t('accounts.filterBar.approvalStatus')}
          style={{ width: 120 }}
          value={filters.approved || undefined}
          onChange={(v) => onChange({ approved: v || '' })}
        >
          <Option value="yes">{t('accounts.approved.yes')}</Option>
          <Option value="no">{t('accounts.approved.pending')}</Option>
        </Select>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => onChange({ ...defaultFilters })}
        >
          {t('app.reset')}
        </Button>
      </Space>
    </Card>
  );
}

// ── Entry Modal ────────────────────────────────────────────────────────────────
function EntryModal({
  open, onClose, defaultType, sansthaId, editRecord,
}: {
  open: boolean; onClose: () => void;
  defaultType: 'income' | 'expense'; sansthaId: string; editRecord?: any;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [payMethod, setPayMethod] = useState<string>('cash');
  const { data: nextVoucher } = useQuery({
    queryKey: ['nextVoucher', sansthaId, type],
    queryFn: () => accountsApi.nextVoucher(sansthaId, type),
    enabled: open && !editRecord,
  });

  React.useEffect(() => {
    if (!open) return;
    if (editRecord) {
      form.setFieldsValue({
        ...editRecord,
        transactionDate: editRecord.transactionDate ? dayjs(editRecord.transactionDate) : dayjs(),
      });
      setType(editRecord.type);
      setPayMethod(editRecord.paymentMethod || 'cash');
    } else {
      form.resetFields();
      form.setFieldsValue({ type: defaultType, paymentMethod: 'cash', transactionDate: dayjs(), voucherNumber: nextVoucher?.voucherNumber || '' });
      setType(defaultType);
      setPayMethod('cash');
    }
  }, [open, editRecord, nextVoucher, defaultType]);

  const saveMut = useMutation({
    mutationFn: (vals: any) => {
      const payload = { ...vals, sansthaId, transactionDate: vals.transactionDate?.format('YYYY-MM-DD'), amount: Number(vals.amount) };
      return editRecord ? accountsApi.update(editRecord.id, payload) : accountsApi.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); onClose(); },
    onError: (e: any) => { message.error(e?.response?.data?.message || e?.message || 'नोंद जतन करता आली नाही'); },
  });

  const incomeCats: Record<string, string> = {
    fee_income: t('accounts.incomeCategories.fee_income'),
    grant_income: t('accounts.incomeCategories.grant_income'),
    donation: t('accounts.incomeCategories.donation'),
    other_income: t('accounts.incomeCategories.other_income'),
  };
  const expenseCats: Record<string, string> = {
    salary: t('accounts.expenseCategories.salary'),
    rent: t('accounts.expenseCategories.rent'),
    electricity: t('accounts.expenseCategories.electricity'),
    water: t('accounts.expenseCategories.water'),
    maintenance: t('accounts.expenseCategories.maintenance'),
    stationery: t('accounts.expenseCategories.stationery'),
    equipment: t('accounts.expenseCategories.equipment'),
    exam_expense: t('accounts.expenseCategories.exam_expense'),
    sports: t('accounts.expenseCategories.sports'),
    library: t('accounts.expenseCategories.library'),
    other_expense: t('accounts.expenseCategories.other_expense'),
  };
  const payMethods: Record<string, string> = {
    cash: t('accounts.paymentMethods.cash'),
    cheque: t('accounts.paymentMethods.cheque'),
    neft: t('accounts.paymentMethods.neft'),
    upi: t('accounts.paymentMethods.upi'),
    bank_transfer: t('accounts.paymentMethods.bank_transfer'),
  };

  return (
    <Modal
      open={open} onCancel={onClose}
      title={editRecord ? t('accounts.editEntry') : (type === 'income' ? t('accounts.newIncomeEntry') : t('accounts.newExpenseEntry'))}
      width={640} forceRender
      onOk={() => form.validateFields().then(vals => saveMut.mutate(vals))}
      okText={t('app.save')} cancelText={t('app.cancel')} confirmLoading={saveMut.isPending}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="type" label={t('accounts.fields.type')} rules={[{ required: true }]}>
              <Select onChange={(v) => { setType(v); form.setFieldValue('category', undefined); }}>
                <Option value="income">{t('accounts.fields.incomeOption')}</Option>
                <Option value="expense">{t('accounts.fields.expenseOption')}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="voucherNumber" label={t('accounts.fields.voucherNumber')}>
              <Input placeholder={t('accounts.fields.autoVoucher')} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="category" label={t('accounts.fields.category')} rules={[{ required: true }]}>
              <Select placeholder={t('accounts.fields.selectCategory')}>
                {(type === 'income' ? Object.entries(incomeCats) : Object.entries(expenseCats))
                  .map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="transactionDate" label={t('accounts.fields.date')} rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="descriptionMr" label={t('accounts.fields.description')} rules={[{ required: true }]}>
          <MrInput placeholder={t('accounts.fields.descriptionPlaceholder')} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="amount" label={t('accounts.fields.amount')} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="paymentMethod" label={t('accounts.fields.paymentMethod')} rules={[{ required: true }]}>
              <Select onChange={setPayMethod}>
                {Object.entries(payMethods).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        {['cheque', 'neft', 'bank_transfer', 'upi'].includes(payMethod) && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="referenceNumber" label={payMethod === 'cheque' ? t('accounts.fields.chequeNumber') : t('accounts.fields.referenceNumber')}>
                <Input />
              </Form.Item>
            </Col>
            {['cheque', 'neft', 'bank_transfer'].includes(payMethod) && (
              <Col span={12}>
                <Form.Item name="bankName" label={t('accounts.fields.bankName')}><Input /></Form.Item>
              </Col>
            )}
          </Row>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="partyNameMr" label={t('accounts.fields.partyName')}>
              <MrInput placeholder={t('accounts.fields.partyPlaceholder')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="remarks" label={t('accounts.fields.remarks')}>
              <MrInput placeholder={t('accounts.fields.remarksPlaceholder')} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// ── Apply client-side filters ──────────────────────────────────────────────────
function applyFilters(data: any[], filters: Filters, type?: 'income' | 'expense'): any[] {
  let d = type ? data.filter(r => r.type === type) : data;
  if (filters.dateRange) {
    const [from, to] = filters.dateRange;
    d = d.filter(r => {
      const date = dayjs(r.transactionDate);
      return date.isAfter(from.subtract(1, 'day')) && date.isBefore(to.add(1, 'day'));
    });
  }
  if (filters.categories.length) d = d.filter(r => filters.categories.includes(r.category));
  if (filters.paymentMethod) d = d.filter(r => r.paymentMethod === filters.paymentMethod);
  if (filters.partySearch) {
    const s = filters.partySearch.toLowerCase();
    d = d.filter(r => (r.partyNameMr || '').toLowerCase().includes(s) || (r.descriptionMr || '').toLowerCase().includes(s));
  }
  if (filters.unitId) d = d.filter(r => r.unitId === filters.unitId);
  if (filters.approved === 'yes') d = d.filter(r => r.isApproved);
  if (filters.approved === 'no')  d = d.filter(r => !r.isApproved);
  if (filters.minAmount != null) d = d.filter(r => Number(r.amount) >= filters.minAmount!);
  if (filters.maxAmount != null) d = d.filter(r => Number(r.amount) <= filters.maxAmount!);
  return d;
}

// ── Transactions Table ─────────────────────────────────────────────────────────
function TransactionsTable({
  data, loading, type, onApprove, onPrint, onEdit,
}: {
  data: any[]; loading: boolean; type: 'income' | 'expense';
  onApprove: (id: string) => void; onPrint: (r: any) => void; onEdit: (r: any) => void;
}) {
  const { t } = useTranslation();

  const getCategoryLabel = (c: string) => {
    const key = type === 'income' ? `accounts.incomeCategories.${c}` : `accounts.expenseCategories.${c}`;
    return t(key, { defaultValue: c });
  };

  const columns = [
    { title: t('accounts.columns.date'), dataIndex: 'transactionDate', key: 'date', width: 100,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—' },
    { title: t('accounts.columns.voucherNo'), dataIndex: 'voucherNumber', key: 'voucher', width: 110,
      render: (v: string) => v ? <Text code>{v}</Text> : '—' },
    { title: t('accounts.columns.category'), dataIndex: 'category', key: 'cat', width: 140,
      render: (c: string) => getCategoryLabel(c) },
    { title: t('accounts.columns.description'), dataIndex: 'descriptionMr', key: 'desc', ellipsis: true },
    { title: t('accounts.columns.party'), dataIndex: 'partyNameMr', key: 'party', width: 130, ellipsis: true,
      render: (v: string) => v || '—' },
    { title: t('accounts.columns.paymentMethod'), dataIndex: 'paymentMethod', key: 'pm', width: 90,
      render: (m: string) => <Tag>{t(`accounts.paymentMethods.${m}`, { defaultValue: m })}</Tag> },
    { title: t('accounts.columns.amount'), dataIndex: 'amount', key: 'amount', width: 110, align: 'right' as const,
      render: (a: number) => (
        <Text strong style={{ color: type === 'income' ? '#2e7d32' : '#c62828' }}>
          ₹{Number(a).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ) },
    { title: t('accounts.columns.approved'), dataIndex: 'isApproved', key: 'app', width: 80, align: 'center' as const,
      render: (v: boolean) => v ? <Badge status="success" text={t('accounts.approved.yes')} /> : <Badge status="warning" text={t('accounts.approved.pending')} /> },
    { title: t('app.actions'), key: 'action', width: 110,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Tooltip title={t('accounts.printVoucher')}>
            <Button size="small" icon={<PrinterOutlined />} onClick={() => onPrint(record)} />
          </Tooltip>
          <Tooltip title={t('app.edit')}>
            <Button size="small" onClick={() => onEdit(record)}>✏️</Button>
          </Tooltip>
          {!record.isApproved && (
            <Tooltip title={t('accounts.approveConfirm')}>
              <Popconfirm title={t('accounts.approveConfirm')} onConfirm={() => onApprove(record.id)} okText={t('app.yes')} cancelText={t('app.no')}>
                <Button size="small" type="primary" icon={<CheckOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ) },
  ];

  return (
    <Table
      dataSource={data} columns={columns} rowKey="id" loading={loading} size="small"
      scroll={{ x: 700 }}
      pagination={{ pageSize: 15, showTotal: (total) => `${t('app.total')}: ${total}` }}
      summary={(rows) => {
        const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
        return (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={6}><Text strong>{t('app.total')}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <Text strong style={{ color: type === 'income' ? '#2e7d32' : '#c62828' }}>
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} colSpan={2} />
          </Table.Summary.Row>
        );
      }}
    />
  );
}

// ── Cash Book Tab ──────────────────────────────────────────────────────────────
function CashBookTab({ allData, sanstha, unit, userName }: { allData: any[]; sanstha: any; unit: any; userName?: string }) {
  const { t } = useTranslation();
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const rows = useMemo(() => {
    let d = [...allData].sort((a, b) => a.transactionDate < b.transactionDate ? -1 : 1);
    if (dateRange) {
      const [from, to] = dateRange;
      d = d.filter(r => {
        const date = dayjs(r.transactionDate);
        return date.isAfter(from.subtract(1, 'day')) && date.isBefore(to.add(1, 'day'));
      });
    }
    return d;
  }, [allData, dateRange]);

  // Compute running balance
  const rowsWithBalance = useMemo(() => {
    let bal = openingBalance;
    return rows.map(r => {
      if (r.type === 'income') bal += Number(r.amount);
      else bal -= Number(r.amount);
      return { ...r, _balance: bal };
    });
  }, [rows, openingBalance]);

  const totalIncome  = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0);
  const closingBal   = openingBalance + totalIncome - totalExpense;

  const cashCols = [
    { title: t('accounts.cashBook.date'), dataIndex: 'transactionDate', key: 'date', width: 100,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    { title: t('accounts.cashBook.voucher'), dataIndex: 'voucherNumber', key: 'voucher', width: 110,
      render: (v: string) => v ? <Text code style={{ fontSize: 11 }}>{v}</Text> : '—' },
    { title: t('accounts.cashBook.description'), dataIndex: 'descriptionMr', key: 'desc', ellipsis: true },
    { title: t('accounts.cashBook.party'), dataIndex: 'partyNameMr', key: 'party', width: 130, ellipsis: true,
      render: (v: string) => v || '—' },
    { title: t('accounts.cashBook.credit'), key: 'credit', width: 110, align: 'right' as const,
      render: (_: any, r: any) => r.type === 'income'
        ? <Text strong style={{ color: '#2e7d32' }}>₹{Number(r.amount).toLocaleString('en-IN')}</Text>
        : '' },
    { title: t('accounts.cashBook.debit'), key: 'debit', width: 110, align: 'right' as const,
      render: (_: any, r: any) => r.type === 'expense'
        ? <Text strong style={{ color: '#c62828' }}>₹{Number(r.amount).toLocaleString('en-IN')}</Text>
        : '' },
    { title: t('accounts.cashBook.balance'), dataIndex: '_balance', key: 'balance', width: 120, align: 'right' as const,
      render: (v: number) => (
        <Text strong style={{ color: v >= 0 ? '#1A3A5C' : '#c62828' }}>
          ₹{v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ) },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 12, background: '#F8FBFE' }}>
        <Space wrap>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{t('accounts.cashBook.openingBalance')}:</span>
          <InputNum
            size="small" min={0} precision={2} style={{ width: 130 }}
            value={openingBalance}
            onChange={(v) => setOpeningBalance(Number(v) || 0)}
            prefix="₹"
          />
          <RangePicker
            size="small" format="DD/MM/YYYY"
            placeholder={[t('accounts.filterBar.startDate'), t('accounts.filterBar.endDate')]}
            value={dateRange}
            onChange={(v) => setDateRange(v as any)}
          />
          <Button
            size="small" icon={<PrinterOutlined />}
            onClick={() => downloadReportPDF({
              title: 'रोखवही (Cash Book)',
              cols: [
                { key: 'date',          header: 'तारीख',    align: 'left'  },
                { key: 'voucherNumber', header: 'व्हाउचर',  align: 'left'  },
                { key: 'descriptionMr', header: 'वर्णन',    align: 'left'  },
                { key: 'type',          header: 'प्रकार',   align: 'center'},
                { key: 'debit',         header: 'नावे (₹)', align: 'right' },
                { key: 'credit',        header: 'जमा (₹)',  align: 'right' },
                { key: 'balance',       header: 'शिल्लक',   align: 'right' },
              ],
              rows: rowsWithBalance.map(r => ({
                date:          r.transactionDate ? dayjs(r.transactionDate).format('DD/MM/YYYY') : '—',
                voucherNumber: r.voucherNumber || '—',
                descriptionMr: r.descriptionMr || '—',
                type:          r.type === 'income' ? 'जमा' : 'खर्च',
                debit:         r.type === 'expense' ? Number(r.amount).toLocaleString('en-IN') : '',
                credit:        r.type === 'income'  ? Number(r.amount).toLocaleString('en-IN') : '',
                balance:       r.balance !== undefined ? Number(r.balance).toLocaleString('en-IN') : '—',
              })),
              sanstha, unit, userName,
              summary: [{ label: 'प्रारंभिक शिल्लक', value: `₹ ${openingBalance.toLocaleString('en-IN')}` }],
              filters: dateRange ? [{ label: 'कालावधी', value: `${dateRange[0].format('DD/MM/YYYY')} – ${dateRange[1].format('DD/MM/YYYY')}` }] : [],
            })}
          >
            {t('accounts.cashBook.print')}
          </Button>
        </Space>
      </Card>
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6}><Card size="small" style={{ background: '#EEF4F9', textAlign: 'center' }}>
          <Text type="secondary">{t('accounts.cashBook.openingBalance')}</Text>
          <div style={{ fontWeight: 700, color: '#1A3A5C' }}>₹{openingBalance.toLocaleString('en-IN')}</div>
        </Card></Col>
        <Col xs={12} sm={6}><Card size="small" style={{ background: '#e8f5e9', textAlign: 'center' }}>
          <Text type="secondary">{t('accounts.totalIncome')}</Text>
          <div style={{ fontWeight: 700, color: '#2e7d32' }}>₹{totalIncome.toLocaleString('en-IN')}</div>
        </Card></Col>
        <Col xs={12} sm={6}><Card size="small" style={{ background: '#ffebee', textAlign: 'center' }}>
          <Text type="secondary">{t('accounts.totalExpense')}</Text>
          <div style={{ fontWeight: 700, color: '#c62828' }}>₹{totalExpense.toLocaleString('en-IN')}</div>
        </Card></Col>
        <Col xs={12} sm={6}><Card size="small" style={{ background: closingBal >= 0 ? '#e3f2fd' : '#fff3e0', textAlign: 'center' }}>
          <Text type="secondary">{t('accounts.cashBook.closingBalance')}</Text>
          <div style={{ fontWeight: 700, color: closingBal >= 0 ? '#1565c0' : '#e65100' }}>₹{closingBal.toLocaleString('en-IN')}</div>
        </Card></Col>
      </Row>
      <Table
        dataSource={rowsWithBalance} columns={cashCols} rowKey="id" size="small"
        pagination={{ pageSize: 20, showTotal: (total) => `${t('app.total')}: ${total}` }}
        locale={{ emptyText: <Empty description={t('accounts.noEntries')} /> }}
      />
    </div>
  );
}

// ── Reports Tab ────────────────────────────────────────────────────────────────
const MONTH_NAMES_MR_SHORT = ['जाने','फेब्रु','मार्च','एप्रिल','मे','जून','जुलै','ऑग','सप्टे','ऑक्टो','नोव्हे','डिसे'];

function ReportsTab({ allData, sanstha, unit, userName }: { allData: any[]; sanstha: any; unit: any; userName?: string }) {
  const { t } = useTranslation();
  // Monthly summary
  const monthlySummary = useMemo(() => {
    const map: Record<string, { label: string; income: number; expense: number }> = {};
    allData.forEach(r => {
      if (!r.transactionDate) return;
      const d = dayjs(r.transactionDate);
      const key = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES_MR_SHORT[d.month()]} ${d.year()}`;
      if (!map[key]) map[key] = { label, income: 0, expense: 0 };
      if (r.type === 'income')  map[key].income  += Number(r.amount);
      else                       map[key].expense += Number(r.amount);
    });
    return Object.entries(map).sort(([a], [b]) => a < b ? -1 : 1).map(([, v]) => v);
  }, [allData]);

  // Category-wise summary
  const categorySummary = useMemo(() => {
    const map: Record<string, { cat: string; income: number; expense: number }> = {};
    allData.forEach(r => {
      const cat = ALL_CATEGORIES[r.category] || r.category || 'इतर';
      if (!map[cat]) map[cat] = { cat, income: 0, expense: 0 };
      if (r.type === 'income')  map[cat].income  += Number(r.amount);
      else                       map[cat].expense += Number(r.amount);
    });
    return Object.values(map).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [allData]);

  const totalIncome  = allData.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = allData.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0);

  const monthlyPrintCols = [
    { title: 'माह', key: 'label' },
    { title: 'जमा (₹)', key: 'income', align: 'right' as const },
    { title: 'खर्च (₹)', key: 'expense', align: 'right' as const },
    { title: 'शिल्लक (₹)', key: 'balance', align: 'right' as const },
  ];

  const monthlyPrintRows = monthlySummary.map(r => ({
    ...r,
    income: r.income.toLocaleString('en-IN'),
    expense: r.expense.toLocaleString('en-IN'),
    balance: (r.income - r.expense).toLocaleString('en-IN'),
  }));

  const catPrintCols = [
    { title: 'प्रकार', key: 'cat' },
    { title: 'जमा (₹)', key: 'income', align: 'right' as const },
    { title: 'खर्च (₹)', key: 'expense', align: 'right' as const },
  ];
  const catPrintRows = categorySummary.map(r => ({
    ...r,
    income: r.income.toLocaleString('en-IN'),
    expense: r.expense.toLocaleString('en-IN'),
  }));

  return (
    <div>
      {/* Summary stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card size="small" style={{ background: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
          <div style={{ fontSize: 12, color: '#555' }}>{t('accounts.totalIncome')}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2e7d32' }}>₹{totalIncome.toLocaleString('en-IN')}</div>
        </Card></Col>
        <Col xs={24} sm={8}><Card size="small" style={{ background: '#ffebee', borderLeft: '4px solid #c62828' }}>
          <div style={{ fontSize: 12, color: '#555' }}>{t('accounts.totalExpense')}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#c62828' }}>₹{totalExpense.toLocaleString('en-IN')}</div>
        </Card></Col>
        <Col xs={24} sm={8}><Card size="small" style={{ background: '#e3f2fd', borderLeft: '4px solid #1565c0' }}>
          <div style={{ fontSize: 12, color: '#555' }}>{t('accounts.balance')}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1565c0' }}>₹{(totalIncome - totalExpense).toLocaleString('en-IN')}</div>
        </Card></Col>
      </Row>

      <Row gutter={16}>
        {/* Monthly summary */}
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ color: '#1A3A5C', fontWeight: 700 }}>{t('accounts.reports.monthlySummary')}</span>}
            size="small"
            extra={
              <Space>
                <Button size="small" icon={<PrinterOutlined />}
                  onClick={() => downloadReportPDF({
                    title: t('accounts.reports.monthlySummary'),
                    cols: toCols(monthlyPrintCols), rows: monthlyPrintRows,
                    sanstha, unit, userName,
                    filters: unit ? [{ label: 'शाळा', value: unit.nameMr || unit.nameEn }] : [],
                  })}>
                  {t('app.print')}
                </Button>
                <Button size="small" icon={<FileExcelOutlined />}
                  onClick={() => exportToExcel(monthlyPrintCols, monthlyPrintRows, 'monthly-summary')}>
                  Excel
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={monthlySummary} rowKey="label" size="small"
              pagination={false}
              columns={[
                { title: t('accounts.reports.month'), dataIndex: 'label', key: 'label', width: 100 },
                { title: t('accounts.reports.income'), dataIndex: 'income', key: 'inc', align: 'right' as const,
                  render: (v: number) => <Text style={{ color: '#2e7d32' }}>₹{v.toLocaleString('en-IN')}</Text> },
                { title: t('accounts.reports.expense'), dataIndex: 'expense', key: 'exp', align: 'right' as const,
                  render: (v: number) => <Text style={{ color: '#c62828' }}>₹{v.toLocaleString('en-IN')}</Text> },
                { title: t('accounts.reports.balance'), key: 'bal', align: 'right' as const,
                  render: (_: any, r: any) => {
                    const b = r.income - r.expense;
                    return <Text strong style={{ color: b >= 0 ? '#1565c0' : '#e65100' }}>₹{b.toLocaleString('en-IN')}</Text>;
                  } },
              ]}
              locale={{ emptyText: t('app.loading') }}
            />
          </Card>
        </Col>

        {/* Category-wise */}
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ color: '#1A3A5C', fontWeight: 700 }}>{t('accounts.reports.categorySummary')}</span>}
            size="small"
            extra={
              <Space>
                <Button size="small" icon={<PrinterOutlined />}
                  onClick={() => downloadReportPDF({
                    title: t('accounts.reports.categorySummary'),
                    cols: toCols(catPrintCols),
                    rows: catPrintRows,
                    sanstha, unit, userName,
                    filters: unit ? [{ label: 'शाळा', value: unit.nameMr || unit.nameEn }] : [],
                    summary: [
                      { label: 'एकूण जमा', value: `₹ ${totalIncome.toLocaleString('en-IN')}`, color: '#2e7d32' },
                      { label: 'एकूण खर्च', value: `₹ ${totalExpense.toLocaleString('en-IN')}`, color: '#c62828' },
                      { label: 'शिल्लक', value: `₹ ${(totalIncome - totalExpense).toLocaleString('en-IN')}` },
                    ],
                  })}>
                  {t('accounts.reports.printReport')}
                </Button>
                <Button size="small" icon={<FileExcelOutlined />}
                  onClick={() => exportToExcel(catPrintCols, catPrintRows, 'category-summary')}>
                  Excel
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={categorySummary} rowKey="cat" size="small"
              pagination={false}
              columns={[
                { title: t('accounts.reports.category'), dataIndex: 'cat', key: 'cat' },
                { title: t('accounts.reports.income'), dataIndex: 'income', key: 'inc', align: 'right' as const,
                  render: (v: number) => v > 0 ? <Text style={{ color: '#2e7d32' }}>₹{v.toLocaleString('en-IN')}</Text> : '—' },
                { title: t('accounts.reports.expense'), dataIndex: 'expense', key: 'exp', align: 'right' as const,
                  render: (v: number) => v > 0 ? <Text style={{ color: '#c62828' }}>₹{v.toLocaleString('en-IN')}</Text> : '—' },
              ]}
              locale={{ emptyText: t('app.loading') }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const { user } = useAuthStore();
  const { selectedUnitId, setSelectedUnitId } = useAppStore();
  const sansthaId = user?.sansthaId || '';
  const qc = useQueryClient();
  const userName = user?.nameMr || user?.email;

  const { data: sansthaData } = useQuery({
    queryKey: ['sanstha', sansthaId],
    queryFn: () => sansthaApi.findOne(sansthaId),
    enabled: !!sansthaId,
    staleTime: 10 * 60 * 1000,
  });
  const { data: units = [] } = useQuery({
    queryKey: ['units', sansthaId],
    queryFn: () => unitApi.findBySanstha(sansthaId),
    enabled: !!sansthaId,
    staleTime: 10 * 60 * 1000,
  });

  const activeUnit = (units as any[]).find((u: any) => u.id === selectedUnitId) ?? null;

  const [activeTab, setActiveTab] = useState<string>('income');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [incomeFilters, setIncomeFilters] = useState<Filters>({ ...defaultFilters });
  const [expenseFilters, setExpenseFilters] = useState<Filters>({ ...defaultFilters });

  // Fetch all data (no server-side filter — filter client-side for rich UX)
  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['accounts', sansthaId],
    queryFn: () => accountsApi.findAll(sansthaId, {}),
    enabled: !!sansthaId,
  });

  const { data: summary } = useQuery({
    queryKey: ['accounts-summary', sansthaId],
    queryFn: () => accountsApi.summary(sansthaId, {}),
    enabled: !!sansthaId,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => accountsApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const incomeFiltered  = useMemo(() => applyFilters(allData, incomeFilters,  'income'),  [allData, incomeFilters]);
  const expenseFiltered = useMemo(() => applyFilters(allData, expenseFilters, 'expense'), [allData, expenseFilters]);

  const totalIncome  = Number(summary?.totalIncome  || 0);
  const totalExpense = Number(summary?.totalExpense || 0);
  const balance      = Number(summary?.balance      || 0);

  const openAddModal = (type: 'income' | 'expense') => {
    setEditRecord(null);
    setActiveTab(type);
    setModalOpen(true);
  };

  const incomePrintCols = [
    { title: 'तारीख', key: 'transactionDate' },
    { title: 'व्हाउचर', key: 'voucherNumber' },
    { title: 'विभाग', key: '_cat' },
    { title: 'वर्णन', key: 'descriptionMr' },
    { title: 'पक्ष', key: 'partyNameMr' },
    { title: 'रक्कम (₹)', key: '_amount', align: 'right' as const },
  ];
  const toPrintRows = (rows: any[], catMap: Record<string, string>) =>
    rows.map(r => ({
      ...r,
      _cat: catMap[r.category] || r.category,
      transactionDate: r.transactionDate ? dayjs(r.transactionDate).format('DD/MM/YYYY') : '—',
      _amount: Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #DDE8F4', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WalletOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
          <Title level={4} style={{ margin: 0, color: '#1A3A5C', fontSize: 16 }}>जमा-खर्च व्यवस्थापन</Title>
        </div>
        <Select
          allowClear
          placeholder="शाळा / युनिट निवडा"
          style={{ width: 200 }}
          value={selectedUnitId || undefined}
          onChange={(v) => setSelectedUnitId(v || '')}
        >
          {(units as any[]).map((u: any) => <Option key={u.id} value={u.id}>{u.nameMr}</Option>)}
        </Select>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ background: '#e8f5e9', borderRadius: 10 }}>
              <Statistic
                title={<span style={{ fontSize: 14, fontWeight: 600 }}>एकूण जमा</span>}
                value={totalIncome} precision={2}
                prefix={<ArrowUpOutlined style={{ color: '#2e7d32' }} />}
                valueStyle={{ color: '#2e7d32', fontSize: 22 }} suffix="₹"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ background: '#ffebee', borderRadius: 10 }}>
              <Statistic
                title={<span style={{ fontSize: 14, fontWeight: 600 }}>एकूण खर्च</span>}
                value={totalExpense} precision={2}
                prefix={<ArrowDownOutlined style={{ color: '#c62828' }} />}
                valueStyle={{ color: '#c62828', fontSize: 22 }} suffix="₹"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ background: balance >= 0 ? '#e3f2fd' : '#fff3e0', borderRadius: 10 }}>
              <Statistic
                title={<span style={{ fontSize: 14, fontWeight: 600 }}>शिल्लक</span>}
                value={Math.abs(balance)} precision={2}
                prefix={<WalletOutlined style={{ color: balance >= 0 ? '#1565c0' : '#e65100' }} />}
                valueStyle={{ color: balance >= 0 ? '#1565c0' : '#e65100', fontSize: 22 }}
                suffix={<>₹{balance < 0 ? <Tag color="red" style={{ marginLeft: 4 }}>तूट</Tag> : null}</>}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Tabs */}
        <Card bodyStyle={{ padding: 0 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarStyle={{ paddingLeft: 16, paddingTop: 4, marginBottom: 0 }}
            tabBarExtraContent={
              activeTab === 'income' || activeTab === 'expense' ? (
                <Space style={{ paddingRight: 16 }}>
                  <Button
                    size="small" type="primary" icon={<PlusOutlined />}
                    style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
                    onClick={() => openAddModal('income')}
                  >जमा नोंद</Button>
                  <Button
                    size="small" type="primary" danger icon={<PlusOutlined />}
                    onClick={() => openAddModal('expense')}
                  >खर्च नोंद</Button>
                  <Button
                    size="small" icon={<PrinterOutlined />}
                    onClick={() => {
                      const rows = activeTab === 'income' ? incomeFiltered : expenseFiltered;
                      const catMap = activeTab === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                      const title = activeTab === 'income' ? 'जमा नोंदी' : 'खर्च नोंदी';
                      downloadReportPDF({ title, cols: toCols(incomePrintCols), rows: toPrintRows(rows, catMap), sanstha: sansthaData, unit: activeUnit, userName });
                    }}
                  >प्रिंट</Button>
                  <Button
                    size="small" icon={<FileExcelOutlined />}
                    onClick={() => {
                      const rows = activeTab === 'income' ? incomeFiltered : expenseFiltered;
                      const catMap = activeTab === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                      exportToExcel(incomePrintCols, toPrintRows(rows, catMap), activeTab === 'income' ? 'income' : 'expense');
                    }}
                  >Excel</Button>
                </Space>
              ) : null
            }
            items={[
              {
                key: 'income',
                label: <span><ArrowUpOutlined style={{ color: '#2e7d32' }} /> जमा ({incomeFiltered.length})</span>,
                children: (
                  <div style={{ padding: '12px 16px' }}>
                    <FilterBar filters={incomeFilters} onChange={(f) => setIncomeFilters(p => ({ ...p, ...f }))} units={units as any[]} filterType="income" />
                    <TransactionsTable
                      data={incomeFiltered} loading={isLoading} type="income"
                      onApprove={(id) => approveMut.mutate(id)}
                      onPrint={(r) => printVoucher(r, sansthaData, activeUnit, userName)}
                      onEdit={(r) => { setEditRecord(r); setModalOpen(true); }}
                    />
                  </div>
                ),
              },
              {
                key: 'expense',
                label: <span><ArrowDownOutlined style={{ color: '#c62828' }} /> खर्च ({expenseFiltered.length})</span>,
                children: (
                  <div style={{ padding: '12px 16px' }}>
                    <FilterBar filters={expenseFilters} onChange={(f) => setExpenseFilters(p => ({ ...p, ...f }))} units={units as any[]} filterType="expense" />
                    <TransactionsTable
                      data={expenseFiltered} loading={isLoading} type="expense"
                      onApprove={(id) => approveMut.mutate(id)}
                      onPrint={(r) => printVoucher(r, sansthaData, activeUnit, userName)}
                      onEdit={(r) => { setEditRecord(r); setModalOpen(true); }}
                    />
                  </div>
                ),
              },
              {
                key: 'cashbook',
                label: <span><BookOutlined /> रोखवही</span>,
                children: (
                  <div style={{ padding: '12px 16px' }}>
                    <CashBookTab allData={allData} sanstha={sansthaData} unit={activeUnit} userName={userName} />
                  </div>
                ),
              },
              {
                key: 'reports',
                label: <span><BarChartOutlined /> अहवाल</span>,
                children: (
                  <div style={{ padding: '12px 16px' }}>
                    <ReportsTab allData={allData} sanstha={sansthaData} unit={activeUnit} userName={userName} />
                  </div>
                ),
              },
              {
                key: 'budget',
                label: <span><BankOutlined /> बजेट</span>,
                children: (
                  <div style={{ padding: '12px 16px' }}>
                    <ComingSoonBanner
                      title="बजेट व्यवस्थापन"
                      features={[
                        'वार्षिक बजेट नियोजन',
                        'प्रकारनिहाय बजेट वाटप',
                        'बजेट विरुद्ध वास्तव तुलना',
                        'अतिखर्च सूचना',
                        'मंजूरी प्रवाह',
                      ]}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Add/Edit Modal */}
        <EntryModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditRecord(null); }}
          defaultType={(activeTab === 'income' || activeTab === 'expense') ? activeTab : 'income'}
          sansthaId={sansthaId}
          editRecord={editRecord}
        />
      </div>
    </div>
  );
}
