/**
 * FeeCollectionTab — redesigned two-panel layout
 * Left:  Selector card → Student card → Fee summary card
 * Right: Pending demands table + Payment history
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message,
  Typography, InputNumber, Row, Col, DatePicker,
  Popconfirm, Alert, Checkbox, Statistic, Progress, Skeleton,
} from 'antd';
import {
  PrinterOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, FileTextOutlined, UserOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { feeApi, studentApi } from '../../api/client';
import StudentSearchSelect from '../../components/common/StudentSearchSelect';
import ClassDivisionSelect from '../../components/common/ClassDivisionSelect';
import { MrInput } from '../../components/common/MrInput';
import { brandHeader, BRAND_CSS, openPrint } from '../../utils/erp-print';
import { downloadFeeReceipt } from '../../pdf/FeeReceipt';
import { isReceiptPrinted, markReceiptPrinted } from '../../utils/printTracker';

const { Text, Title } = Typography;
const { Option } = Select;

// API_BASE used only in print functions via erp-print utility

const FEE_TYPE_LABELS: Record<string, string> = {
  tuition: 'शिक्षण शुल्क', exam: 'परीक्षा शुल्क', library: 'ग्रंथालय शुल्क',
  sports: 'क्रीडा शुल्क', computer: 'संगणक शुल्क', transport: 'वाहतूक शुल्क',
  hostel: 'वसतिगृह शुल्क', misc: 'विविध शुल्क',
};
const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: 'रोख', cheque: 'धनादेश', dd: 'DD', online: 'ऑनलाइन', upi: 'UPI', neft: 'NEFT',
};

// ── Print helpers ──────────────────────────────────────────────────────────────

// ── Amount in words (Marathi) ──────────────────────────────────────────────────
function amountInWords(n: number): string {
  const ones = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ',
                 'दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा',
                 'अठरा', 'एकोणीस', 'वीस', 'एकवीस', 'बावीस', 'तेवीस', 'चोवीस',
                 'पंचवीस', 'सव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस',
                 'एकतीस', 'बत्तीस', 'तेहतीस', 'चौतीस', 'पस्तीस', 'छत्तीस',
                 'सदोतीस', 'अडतीस', 'एकोणचाळीस', 'चाळीस', 'एकेचाळीस', 'बेचाळीस',
                 'त्रेचाळीस', 'चव्वेचाळीस', 'पंचेचाळीस', 'सेहेचाळीस', 'सत्तेचाळीस',
                 'अठ्ठेचाळीस', 'एकोणपन्नास', 'पन्नास', 'एकावन्न', 'बावन्न',
                 'त्रेपन्न', 'चोपन्न', 'पंचावन्न', 'छप्पन्न', 'सत्तावन्न', 'अठ्ठावन्न',
                 'एकोणसाठ', 'साठ', 'एकसष्ट', 'बासष्ट', 'त्रेसष्ट', 'चौसष्ट',
                 'पासष्ट', 'सहासष्ट', 'सदुसष्ट', 'अडुसष्ट', 'एकोणसत्तर', 'सत्तर',
                 'एकाहत्तर', 'बाहत्तर', 'त्र्याहत्तर', 'चौर्‍याहत्तर', 'पंच्याहत्तर',
                 'शहात्तर', 'सत्त्याहत्तर', 'अठ्ठ्याहत्तर', 'एकोणऐंशी', 'ऐंशी',
                 'एक्याऐंशी', 'ब्याऐंशी', 'त्र्याऐंशी', 'चौर्‍याऐंशी', 'पंच्याऐंशी',
                 'शहाऐंशी', 'सत्त्याऐंशी', 'अठ्ठ्याऐंशी', 'एकोणनव्वद', 'नव्वद',
                 'एक्याण्णव', 'ब्याण्णव', 'त्र्याण्णव', 'चौर्‍याण्णव', 'पंच्याण्णव',
                 'शहाण्णव', 'सत्त्याण्णव', 'अठ्ठ्याण्णव', 'नव्व्याण्णव'];
  const amount = Math.floor(n);
  if (amount === 0) return 'शून्य';
  const parts: string[] = [];
  const crore = Math.floor(amount / 10000000);
  const lakh  = Math.floor((amount % 10000000) / 100000);
  const thou  = Math.floor((amount % 100000) / 1000);
  const hund  = Math.floor((amount % 1000) / 100);
  const rest  = amount % 100;
  if (crore) parts.push(`${ones[crore] || crore} कोटी`);
  if (lakh)  parts.push(`${ones[lakh]  || lakh}  लाख`);
  if (thou)  parts.push(`${ones[thou]  || thou}  हजार`);
  if (hund)  parts.push(`${ones[hund]} शे`);
  if (rest)  parts.push(ones[rest] || String(rest));
  return parts.join(' ') + ' रुपये';
}

// Use shared BRAND_CSS + brandHeader from erp-print util
// Receipt-specific extra styles layered on top
const PRINT_CSS = BRAND_CSS + `
  .receipt-badge{display:inline-block;background:#1A3A5C;color:#fff;padding:3px 14px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:1px}
  .page{max-width:700px;margin:0 auto;padding:20px 24px}
`;

function printReceipt(payment: any, items: any[], demands: any[], structures: any[], studentName: string, _sansthaName: string, sanstha?: any, unit?: any) {
  const rows = items.map((item: any) => {
    const demand = demands.find((d: any) => d.id === item.demandId);
    const struct = demand ? structures.find((s: any) => s.id === demand.feeStructureId) : null;
    const label = struct
      ? `${FEE_TYPE_LABELS[struct.feeType] || struct.feeType} — ${struct.nameMr}${demand?.installmentLabel ? ` (${demand.installmentLabel})` : ''}`
      : item.demandId;
    return `<tr><td>${label}</td><td class="right">₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`;
  }).join('');

  const total = Number(payment.amount);
  const modeLabel = PAYMENT_MODE_LABELS[payment.paymentMode] || payment.paymentMode;

  const receiptCopy = (copyLabel: string, wm: string) => `
    <div class="${wm}">
      <div style="text-align:center;margin-bottom:6px">
        <span class="receipt-badge">शुल्क पावती &nbsp;/&nbsp; FEE RECEIPT</span>
        <span style="float:right;font-size:11px;color:#666;margin-top:4px">${copyLabel}</span>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">पावती क्रमांक</div><div class="info-value big blue">${payment.receiptNumber}</div></div>
        <div class="info-item"><div class="info-label">दिनांक</div><div class="info-value">${dayjs(payment.paymentDate).format('DD/MM/YYYY')}</div></div>
        <div class="info-item"><div class="info-label">विद्यार्थ्याचे नाव</div><div class="info-value">${studentName}</div></div>
        <div class="info-item"><div class="info-label">भरणा पद्धत</div><div class="info-value">${modeLabel}</div></div>
        ${payment.chequeNumber ? `<div class="info-item"><div class="info-label">धनादेश क्रमांक</div><div class="info-value">${payment.chequeNumber}</div></div>` : ''}
        ${payment.bankNameMr ? `<div class="info-item"><div class="info-label">बँक</div><div class="info-value">${payment.bankNameMr}</div></div>` : ''}
        ${payment.utrNumber ? `<div class="info-item"><div class="info-label">UTR / संदर्भ क्रमांक</div><div class="info-value">${payment.utrNumber}</div></div>` : ''}
      </div>
      <table>
        <tr><th>शुल्काचा तपशील</th><th class="right" style="width:140px">रक्कम (₹)</th></tr>
        ${rows}
        <tr class="total-row">
          <td>एकूण भरलेली रक्कम</td>
          <td class="right big blue">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>
      <div class="words">अक्षरी: ${amountInWords(total)}</div>
      ${payment.remarks ? `<div style="font-size:11px;margin-top:4px;color:#555">नोंद: ${payment.remarks}</div>` : ''}
      <div class="sign-row">
        <div class="sign"><div class="seal-box">शिक्का</div><div class="sign-label">संस्थेचा शिक्का</div></div>
        <div class="sign"><div class="sign-line"></div><div class="sign-label">शुल्क संकलक</div></div>
        <div class="sign"><div class="sign-line"></div><div class="sign-label">मुख्याध्यापक</div></div>
      </div>
    </div>`;

  const html = `<html><head><meta charset="UTF-8"/><title>शुल्क पावती</title>
    <style>${PRINT_CSS}</style></head><body>
    <div class="page">
      ${brandHeader(sanstha, unit)}
      ${receiptCopy('मूळ प्रत / ORIGINAL', 'watermark')}
      <hr class="cut-line"/>
      <div class="duplicate">
        ${receiptCopy('प्रतिलिपी / DUPLICATE', '')}
      </div>
    </div>
    <div class="no-print" style="text-align:center;margin:16px">
      <button onclick="window.print()" style="padding:10px 24px;background:#C0722A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">🖨️ Print / PDF Save करा</button>
    </div>
    
  </body></html>`;

  openPrint(html, 'width=750,height=900');
}

function printLedger(student: any, demands: any[], structures: any[], outstanding: any, _sansthaName: string, sanstha?: any, unit?: any) {
  const rows = demands.map((d: any) => {
    const s = structures.find((x: any) => x.id === d.feeStructureId);
    const label = s
      ? `${FEE_TYPE_LABELS[s.feeType] || s.feeType} — ${s.nameMr}${d.installmentLabel ? ` (${d.installmentLabel})` : ''}`
      : d.feeStructureId;
    const bal = Math.max(0, +d.netAmount - +d.paidAmount);
    const dueDate = d.dueDate ? dayjs(d.dueDate).format('DD/MM/YYYY') : '—';
    const isPastDue = d.dueDate && dayjs(d.dueDate).isBefore(dayjs(), 'day') && bal > 0;
    return `<tr>
      <td>${label}</td>
      <td class="center" style="font-size:11px;color:${isPastDue ? '#E74C3C' : '#333'}">${dueDate}</td>
      <td class="right">₹${Number(d.netAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
      <td class="right green">₹${Number(d.paidAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
      <td class="right ${bal > 0 ? 'red bold' : 'green'}">₹${bal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
    </tr>`;
  }).join('');

  const totalDemand = Number(outstanding?.totalDemand ?? 0);
  const totalPaid   = Number(outstanding?.totalPaid ?? 0);
  const totalBal    = Number(outstanding?.outstanding ?? 0);

  const html = `<html><head><meta charset="UTF-8"/><title>शुल्क खाते</title>
    <style>${PRINT_CSS}</style></head><body>
    <div class="page">
      ${brandHeader(sanstha, unit)}
      <div style="text-align:center;margin-bottom:10px">
        <span class="receipt-badge">विद्यार्थी शुल्क खाते &nbsp;/&nbsp; FEE LEDGER</span>
      </div>
      <div class="info-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="info-item"><div class="info-label">विद्यार्थ्याचे नाव</div><div class="info-value">${student?.nameMr || '—'}</div></div>
        <div class="info-item"><div class="info-label">वडिलांचे नाव</div><div class="info-value">${student?.fatherNameMr || '—'}</div></div>
        <div class="info-item"><div class="info-label">GR क्रमांक</div><div class="info-value">${student?.grNo || student?.grNumber || '—'}</div></div>
        <div class="info-item"><div class="info-label">दिनांक</div><div class="info-value">${dayjs().format('DD/MM/YYYY')}</div></div>
      </div>
      <table>
        <tr>
          <th>शुल्काचा तपशील</th>
          <th class="center" style="width:90px">देय तारीख</th>
          <th class="right" style="width:100px">एकूण देय</th>
          <th class="right" style="width:100px">भरले</th>
          <th class="right" style="width:100px">बाकी</th>
        </tr>
        ${rows}
        <tr class="total-row">
          <td colspan="2" class="bold">एकूण</td>
          <td class="right">₹${totalDemand.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
          <td class="right green">₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
          <td class="right ${totalBal > 0 ? 'red' : 'green'}">₹${totalBal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        </tr>
      </table>
      ${totalBal > 0 ? `<div style="background:#FFF3CD;border:1px solid #FFEAA7;padding:8px 12px;border-radius:4px;margin-top:8px;font-size:12px">
        <strong>⚠ थकबाकी:</strong> ₹${totalBal.toLocaleString('en-IN')} — ${amountInWords(totalBal)}
      </div>` : `<div style="background:#D5F5E3;border:1px solid #A9DFBF;padding:8px 12px;border-radius:4px;margin-top:8px;font-size:12px">
        <strong>✅ सर्व शुल्क भरले आहे</strong>
      </div>`}
      <div class="sign-row">
        <div class="sign"><div class="seal-box">शिक्का</div><div class="sign-label">संस्थेचा शिक्का</div></div>
        <div class="sign"><div class="sign-line"></div><div class="sign-label">पालक / विद्यार्थी</div></div>
        <div class="sign"><div class="sign-line"></div><div class="sign-label">मुख्याध्यापक</div></div>
      </div>
    </div>
    <div class="no-print" style="text-align:center;margin:16px">
      <button onclick="window.print()" style="padding:10px 24px;background:#C0722A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">🖨️ Print / PDF Save करा</button>
    </div>
    
  </body></html>`;

  openPrint(html, 'width=750,height=700');
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  me: any;
  units: any[];
  academicYears: any[];
  sansthaName: string;
  sansthaData: any;
  pageUnit?: string;
  pageYear?: string;
  // Pre-selected student from class-view click-through
  externalStudent?: string;
  externalStudentObj?: any;
}

export default function FeeCollectionTab({
  me, units: _units, academicYears: _academicYears, sansthaName, sansthaData,
  pageUnit, pageYear, externalStudent, externalStudentObj,
}: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  // ── Selector state ────────────────────────────────────────────────────────────
  const [selectedGrade, setSelectedGrade] = useState<string>();
  const [selectedDiv,   setSelectedDiv]   = useState<string>();
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(externalStudent);
  const [selectedStudentObj, setSelectedStudentObj] = useState<any>(externalStudentObj ?? null);
  const [collectModal, setCollectModal]   = useState(false);
  const [selectedDemandIds, setSelectedDemandIds] = useState<string[]>([]);
  const [partialAmounts, setPartialAmounts] = useState<Record<string, number>>({});

  // Sync when class-view pushes a student in
  useEffect(() => {
    if (externalStudent && externalStudent !== selectedStudent) {
      setSelectedStudent(externalStudent);
      setSelectedStudentObj(externalStudentObj ?? null);
      setSelectedDemandIds([]);
      setPartialAmounts({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalStudent]);
  const [form] = Form.useForm();

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: demands = [], isLoading: demandsLoading } = useQuery({
    queryKey: ['demands', selectedStudent, pageYear],
    queryFn: () => feeApi.studentDemands(selectedStudent!, pageYear),
    enabled: !!selectedStudent,
  });

  // Auto-select all pending demands when they load
  useEffect(() => {
    const pending = (demands as any[]).filter(d => !d.isWaived && +d.paidAmount < +d.netAmount);
    if (pending.length > 0 && selectedDemandIds.length === 0) {
      setSelectedDemandIds(pending.map((d: any) => d.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demands]);

  const { data: outstanding, isLoading: outLoading } = useQuery({
    queryKey: ['outstanding', selectedStudent, pageYear],
    queryFn: () => feeApi.studentOutstanding(selectedStudent!, pageYear!),
    enabled: !!selectedStudent && !!pageYear,
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['structures', me?.sansthaId, pageUnit, pageYear],
    queryFn: () => feeApi.findStructures(me!.sansthaId, { unitId: pageUnit, academicYearId: pageYear }),
    enabled: !!me?.sansthaId && !!pageUnit,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', selectedStudent, pageYear],
    queryFn: () => feeApi.studentPayments(selectedStudent!, pageYear),
    enabled: !!selectedStudent,
  });

  const { data: receiptData } = useQuery({
    queryKey: ['receipt', pageUnit],
    queryFn: () => feeApi.nextReceiptNumber(pageUnit!),
    enabled: !!pageUnit && collectModal,
  });

  // Students for the selected division (inline list)
  const { data: divStudents = [], isLoading: divStudentsLoading } = useQuery({
    queryKey: ['students-division', me?.sansthaId, pageUnit, selectedDiv],
    queryFn: () => studentApi.findBySanstha(me!.sansthaId, { unitId: pageUnit, divisionId: selectedDiv }),
    enabled: !!me?.sansthaId && !!pageUnit && !!selectedDiv,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const collectMut = useMutation({
    mutationFn: (vals: any) => feeApi.collect({
      ...vals,
      unitId: pageUnit,
      academicYearId: pageYear,
      studentId: selectedStudent,
      sansthaId: me.sansthaId,
      paymentDate: vals.paymentDate?.format?.('YYYY-MM-DD') || vals.paymentDate,
      items: selectedDemandIds.map(id => ({ demandId: id, amount: partialAmounts[id] ?? getPendingAmount(id) })),
    }),
    onSuccess: (result) => {
      message.success(t('fees.collection.success'));
      qc.invalidateQueries({ queryKey: ['demands'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['receipt'] });
      qc.invalidateQueries({ queryKey: ['outstanding'] });
      qc.invalidateQueries({ queryKey: ['fee-metrics'] });
      setCollectModal(false);
      setSelectedDemandIds([]);
      setPartialAmounts({});
      form.resetFields();
      // Build react-pdf receipt
      const receiptDemands = (result.items || []).map((item: any) => {
        const demand = (demands as any[]).find((d: any) => d.id === item.demandId);
        const struct = demand ? (structures as any[]).find((s: any) => s.id === demand.feeStructureId) : null;
        return {
          feeHead: struct ? `${FEE_TYPE_LABELS[struct.feeType] || struct.feeType} — ${struct.nameMr}` : (demand?.installmentLabel || item.demandId),
          installmentLabel: demand?.installmentLabel,
          netAmount: Number(demand?.netAmount || item.amount),
          concession: Number(demand?.concessionAmount || 0),
          paidNow: Number(item.amount),
        };
      });
      const _rid = result.payment.id || result.payment.receiptNumber;
      const _isDup1 = isReceiptPrinted(_rid);
      if (_isDup1) {
        Modal.confirm({
          title: '⚠️ ही पावती आधीच print झाली आहे',
          content: 'हे DUPLICATE print असेल. पुढे जायचे का?',
          okText: 'हो, DUPLICATE print करा',
          cancelText: 'नको',
          onOk: () => downloadFeeReceipt({
            payment: {
              receiptNumber: result.payment.receiptNumber,
              paymentDate: result.payment.paymentDate,
              paymentMode: result.payment.paymentMode,
              totalAmount: Number(result.payment.amount),
              remarks: result.payment.remarks,
              chequeNumber: result.payment.chequeNumber,
              bankNameMr: result.payment.bankNameMr,
            },
            student: { nameMr: selectedStudentObj?.nameMr || '', fatherNameMr: selectedStudentObj?.fatherNameMr, grNo: selectedStudentObj?.grNo, rollNumber: selectedStudentObj?.rollNumber },
            demands: receiptDemands, sanstha: sansthaData,
            unit: (_units as any[]).find(u => u.id === pageUnit),
            userName: me?.nameMr || me?.email,
            isDuplicate: true,
          }).catch(() => printReceipt(result.payment, result.items, demands as any[], structures as any[], selectedStudentObj?.nameMr || '', sansthaName, sansthaData)),
        });
      } else {
        markReceiptPrinted(_rid);
        downloadFeeReceipt({
          payment: {
            receiptNumber: result.payment.receiptNumber,
            paymentDate: result.payment.paymentDate,
            paymentMode: result.payment.paymentMode,
            totalAmount: Number(result.payment.amount),
            remarks: result.payment.remarks,
            chequeNumber: result.payment.chequeNumber,
            bankNameMr: result.payment.bankNameMr,
          },
          student: {
            nameMr: selectedStudentObj?.nameMr || '',
            fatherNameMr: selectedStudentObj?.fatherNameMr,
            grNo: selectedStudentObj?.grNo,
            rollNumber: selectedStudentObj?.rollNumber,
          },
          demands: receiptDemands,
          sanstha: sansthaData,
          unit: (_units as any[]).find(u => u.id === pageUnit),
          userName: me?.nameMr || me?.email,
        }).catch(() => {
          // Fallback to legacy HTML print if react-pdf fails
          printReceipt(result.payment, result.items, demands as any[], structures as any[], selectedStudentObj?.nameMr || '', sansthaName, sansthaData);
        });
      }
    },
    onError: (e: any) => message.error(e.response?.data?.message || t('app.error')),
  });

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => feeApi.cancelPayment(id, reason),
    onSuccess: () => {
      message.success(t('fees.paymentCancelled'));
      qc.invalidateQueries({ queryKey: ['demands'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['outstanding'] });
      qc.invalidateQueries({ queryKey: ['fee-metrics'] });
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getPendingAmount = (id: string) => {
    const d = (demands as any[]).find(x => x.id === id);
    return d ? Math.max(0, +d.netAmount - +d.paidAmount) : 0;
  };

  const pendingDemands = (demands as any[]).filter(d => !d.isWaived && +d.paidAmount < +d.netAmount);
  const selectedTotal  = selectedDemandIds.reduce((s, id) => s + (partialAmounts[id] ?? getPendingAmount(id)), 0);
  const resetStudent = () => {
    setSelectedStudent(undefined);
    setSelectedStudentObj(null);
    setSelectedDemandIds([]);
    setPartialAmounts({});
  };

  const openCollect = () => {
    if (!selectedDemandIds.length) { message.warning(t('fees.collection.selectAtLeastOne')); return; }
    form.setFieldsValue({ paymentDate: dayjs(), paymentMode: 'cash', receiptNumber: receiptData?.receiptNumber, collectedBy: me?.nameMr || me?.email || '' });
    setCollectModal(true);
  };

  const selectAll = () => {
    const ids = pendingDemands.map((d: any) => d.id);
    setSelectedDemandIds(ids);
  };

  // ── Table columns ─────────────────────────────────────────────────────────────
  const demandCols = [
    {
      title: '', key: 'check', width: 36,
      render: (_: any, r: any) => (
        <Checkbox
          checked={selectedDemandIds.includes(r.id)}
          onChange={e => setSelectedDemandIds(prev => e.target.checked ? [...prev, r.id] : prev.filter(x => x !== r.id))}
        />
      ),
    },
    {
      title: t('fees.collection.columns.feeType'), key: 'type',
      render: (_: any, r: any) => {
        const s = (structures as any[]).find(x => x.id === r.feeStructureId);
        return s ? <span><Text strong>{t(`fees.feeTypes.${s.feeType}`, { defaultValue: s.feeType })}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{s.nameMr}</Text></span> : '—';
      },
    },
    { title: t('fees.collection.columns.installment'), dataIndex: 'installmentLabel', key: 'inst', width: 80, render: (v: any) => v || '—' },
    {
      title: t('fees.collection.columns.dueDate'), dataIndex: 'dueDate', key: 'due', width: 95,
      render: (v: any) => {
        if (!v) return '—';
        const overdue = dayjs().isAfter(dayjs(v));
        return <span style={{ color: overdue ? '#E74C3C' : undefined, fontWeight: overdue ? 600 : undefined }}>{dayjs(v).format('DD/MM/YY')}</span>;
      },
    },
    { title: t('fees.collection.columns.due'), dataIndex: 'netAmount', key: 'net', width: 80, align: 'right' as const, render: (v: any) => `₹${Number(v).toFixed(0)}` },
    { title: t('fees.collection.columns.paid'), dataIndex: 'paidAmount', key: 'paid', width: 80, align: 'right' as const,
      render: (v: any) => <Text style={{ color: '#27AE60' }}>₹{Number(v).toFixed(0)}</Text> },
    { title: t('fees.collection.columns.balance'), key: 'bal', width: 80, align: 'right' as const,
      render: (_: any, r: any) => {
        const b = +r.netAmount - +r.paidAmount;
        return <Text style={{ color: b > 0 ? '#E74C3C' : '#27AE60', fontWeight: 600 }}>₹{b.toFixed(0)}</Text>;
      },
    },
    {
      title: t('fees.collection.columns.thisTime'), key: 'partial', width: 100,
      render: (_: any, r: any) => {
        const pending = getPendingAmount(r.id);
        return selectedDemandIds.includes(r.id) ? (
          <InputNumber size="small" min={0} max={pending} precision={0} defaultValue={pending}
            onChange={v => setPartialAmounts(prev => ({ ...prev, [r.id]: Number(v) }))}
            style={{ width: 88 }} />
        ) : null;
      },
    },
  ];

  const payHistoryCols = [
    { title: t('fees.collection.columns.receiptNo'), dataIndex: 'receiptNumber', key: 'rn', width: 110 },
    { title: t('fees.collection.columns.date'), dataIndex: 'paymentDate', key: 'dt', width: 90, render: (v: any) => dayjs(v).format('DD/MM/YY') },
    { title: t('fees.collection.columns.amount'), dataIndex: 'amount', key: 'amt', width: 90, align: 'right' as const, render: (v: any) => `₹${Number(v).toFixed(0)}` },
    { title: t('fees.collection.columns.mode'), dataIndex: 'paymentMode', key: 'pm', width: 80, render: (v: any) => t(`fees.paymentModes.${v}`, { defaultValue: v }) },
    { title: t('fees.collection.columns.status'), key: 'status', width: 80, render: (_: any, r: any) => r.isCancelled ? <Tag color="red">{t('fees.paymentCancelled')}</Tag> : <Tag color="green">{t('fees.paymentPaid')}</Tag> },
    {
      title: t('app.actions'), key: 'act', width: 90,
      render: (_: any, r: any) => (
        <Space size={4}>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => {
            const histDemands = (r.items || []).map((item: any) => {
              const demand = (demands as any[]).find((d: any) => d.id === item.demandId);
              const struct = demand ? (structures as any[]).find((s: any) => s.id === demand.feeStructureId) : null;
              return {
                feeHead: struct ? `${FEE_TYPE_LABELS[struct.feeType] || struct.feeType} — ${struct.nameMr}` : (demand?.installmentLabel || item.demandId),
                installmentLabel: demand?.installmentLabel,
                netAmount: Number(demand?.netAmount || item.amount),
                concession: Number(demand?.concessionAmount || 0),
                paidNow: Number(item.amount),
              };
            });
            const _histId  = r.id || r.receiptNumber;
            const _isDupH  = isReceiptPrinted(_histId);
            if (!_isDupH) markReceiptPrinted(_histId);
            const _printHistReceipt = (dup: boolean) => downloadFeeReceipt({
              payment: {
                receiptNumber: r.receiptNumber,
                paymentDate: r.paymentDate,
                paymentMode: r.paymentMode,
                totalAmount: Number(r.amount),
                remarks: r.remarks,
                chequeNumber: r.chequeNumber,
                bankNameMr: r.bankNameMr,
                txnRef: r.utrNumber,
              },
              student: {
                nameMr: selectedStudentObj?.nameMr || '',
                fatherNameMr: selectedStudentObj?.fatherNameMr,
                grNo: selectedStudentObj?.grNo,
                rollNumber: selectedStudentObj?.rollNumber,
              },
              demands: histDemands,
              sanstha: sansthaData,
              unit: (_units as any[]).find(u => u.id === pageUnit),
              userName: me?.nameMr || me?.email,
              isDuplicate: dup,
            }).catch(() => {
              printReceipt(r, r.items || [], demands as any[], structures as any[], selectedStudentObj?.nameMr || '', sansthaName, sansthaData);
            });
            if (_isDupH) {
              Modal.confirm({
                title: '⚠️ ही पावती आधीच print झाली आहे',
                content: 'हे DUPLICATE print असेल. पुढे जायचे का?',
                okText: 'हो, DUPLICATE print करा',
                cancelText: 'नको',
                onOk: () => _printHistReceipt(true),
              });
            } else {
              _printHistReceipt(false);
            }
          }} />
          {!r.isCancelled && (
            <Popconfirm title={t('fees.collection.cancelConfirm')} onConfirm={() => cancelMut.mutate({ id: r.id, reason: 'रद्द' })} okText={t('app.yes')} cancelText={t('app.no')}>
              <Button size="small" danger icon={<CloseCircleOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  if (!pageUnit || !pageYear) {
    return <Alert type="info" message={t('fees.collection.selectSchoolYear')} showIcon />;
  }

  const outData = outstanding as any;
  const totalDemand = outData?.totalDemand ?? 0;
  const totalPaid   = outData?.totalPaid   ?? 0;
  const outAmt      = outData?.outstanding ?? 0;
  const collPct     = totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 100) : 0;
  const allPaid     = selectedStudent && !outLoading && outAmt === 0 && totalDemand > 0;

  return (
    <Row gutter={16} align="top">
      {/* ── LEFT PANEL ── */}
      <Col xs={24} lg={8}>
        {/* Selector card */}
        <Card
          size="small"
          title={<span style={{ fontSize: 13 }}><SearchOutlined /> {t('fees.collection.studentSelect')}</span>}
          style={{ background: '#EBF5FB', border: '1px solid #AED6F1', marginBottom: 12 }}
          bodyStyle={{ paddingBottom: 8 }}
        >
          {/* Step 1: Grade → Division cascade */}
          <div style={{ marginBottom: 10 }}>
            <ClassDivisionSelect
              unitId={pageUnit}
              academicYearId={pageYear}
              gradeValue={selectedGrade}
              divisionValue={selectedDiv}
              onGradeChange={v => { setSelectedGrade(v); setSelectedDiv(undefined); resetStudent(); }}
              onDivisionChange={v => { setSelectedDiv(v); resetStudent(); }}
            />
          </div>

          {/* Step 2a: Inline student list when division is selected */}
          {selectedDiv ? (
            <div>
              {divStudentsLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (divStudents as any[]).length === 0 ? (
                <Alert type="warning" message={t('fees.collection.noStudentsInDiv')} showIcon style={{ fontSize: 12 }} />
              ) : (
                <div
                  style={{
                    border: '1px solid #AED6F1',
                    borderRadius: 6,
                    maxHeight: 280,
                    overflowY: 'auto',
                    background: '#fff',
                  }}
                >
                  {(divStudents as any[]).map((s: any) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudent(s.id);
                        setSelectedStudentObj(s);
                        setSelectedDemandIds([]);
                        setPartialAmounts({});
                      }}
                      style={{
                        padding: '7px 10px',
                        cursor: 'pointer',
                        background: selectedStudent === s.id ? '#D4E6F1' : undefined,
                        borderBottom: '1px solid #EEF4F9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (selectedStudent !== s.id) (e.currentTarget as HTMLElement).style.background = '#F0F8FF'; }}
                      onMouseLeave={e => { if (selectedStudent !== s.id) (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <span style={{ fontWeight: selectedStudent === s.id ? 700 : 500, fontSize: 13 }}>{s.nameMr}</span>
                      <span style={{ color: '#7B8D9E', fontSize: 11 }}>
                        {s.rollNumber ? `रोल ${s.rollNumber}` : (s.grNo || '')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Step 2b: Direct search when no division selected */
            <StudentSearchSelect
              unitId={pageUnit}
              value={selectedStudent}
              onChange={(id, student) => {
                setSelectedStudent(id);
                setSelectedStudentObj(student);
                setSelectedDemandIds([]);
                setPartialAmounts({});
              }}
              placeholder={t('fees.collection.searchPlaceholder')}
              allowClear
            />
          )}

          {/* Always show search below list for quick jump */}
          {selectedDiv && (divStudents as any[]).length > 0 && (
            <div style={{ marginTop: 6 }}>
              <StudentSearchSelect
                unitId={pageUnit}
                divisionId={selectedDiv}
                value={selectedStudent}
                onChange={(id, student) => {
                  setSelectedStudent(id);
                  setSelectedStudentObj(student);
                  setSelectedDemandIds([]);
                  setPartialAmounts({});
                }}
                placeholder={t('fees.collection.directSearch')}
                allowClear
              />
            </div>
          )}
        </Card>

        {/* Student info card */}
        {selectedStudentObj && (
          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}><UserOutlined /> {t('fees.collection.studentInfo')}</span>}
            style={{ border: '1px solid #A9DFBF', marginBottom: 12 }}
          >
            <Title level={5} style={{ margin: 0 }}>{selectedStudentObj.nameMr}</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>{selectedStudentObj.fatherNameMr}</Text>
            <div style={{ marginTop: 8 }}>
              {selectedStudentObj.grNo && <Tag color="blue">GR: {selectedStudentObj.grNo}</Tag>}
              {selectedStudentObj.rollNumber && <Tag>रोल: {selectedStudentObj.rollNumber}</Tag>}
            </div>

          </Card>
        )}

        {/* Fee summary card */}
        {selectedStudent && pageYear && (
          <Card
            size="small"
            title={t('fees.collection.feeSummary')}
            style={{ border: '1px solid #D5D8DC' }}
            extra={
              (demands as any[]).length > 0 && (
                <Button size="small" icon={<PrinterOutlined />}
                  onClick={() => printLedger(selectedStudentObj, demands as any[], structures as any[], outstanding, sansthaName, sansthaData)}>
                  {t('fees.collection.printLedger')}
                </Button>
              )
            }
          >
            {outLoading ? <Skeleton active paragraph={{ rows: 2 }} /> : allPaid ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 28, color: '#27AE60' }} />
                <div style={{ color: '#27AE60', fontWeight: 600, marginTop: 6 }}>{t('fees.collection.allPaid')}</div>
              </div>
            ) : (
              <>
                <Row gutter={8}>
                  <Col span={8}>
                    <Statistic
                      title={<span style={{ fontSize: 10 }}>{t('fees.collection.totalDue')}</span>}
                      value={`₹${totalDemand.toFixed(0)}`}
                      valueStyle={{ fontSize: 14, color: '#2980B9' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title={<span style={{ fontSize: 10 }}>{t('fees.collection.totalPaid')}</span>}
                      value={`₹${totalPaid.toFixed(0)}`}
                      valueStyle={{ fontSize: 14, color: '#27AE60' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title={<span style={{ fontSize: 10, fontWeight: 700 }}>{t('fees.collection.outstanding')}</span>}
                      value={`₹${outAmt.toFixed(0)}`}
                      valueStyle={{ fontSize: 26, color: '#E74C3C', fontWeight: 700 }}
                    />
                  </Col>
                </Row>
                <Progress
                  percent={collPct}
                  size="small"
                  strokeColor={collPct >= 80 ? '#27AE60' : collPct >= 50 ? '#F39C12' : '#E74C3C'}
                  style={{ marginTop: 8 }}
                  format={p => `${p}%`}
                />
              </>
            )}
          </Card>
        )}
      </Col>

      {/* ── RIGHT PANEL ── */}
      <Col xs={24} lg={16}>
        {!selectedStudent ? (
          <Card style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
            <UserOutlined style={{ fontSize: 40, marginBottom: 12 }} />
            <div>{t('fees.collection.selectFromLeft')}</div>
          </Card>
        ) : (
          <>
            {/* Pending demands */}
            {pendingDemands.length === 0 && !demandsLoading && (demands as any[]).length > 0 ? (
              <Alert type="success" message={t('fees.collection.allFeesPaid')} icon={<CheckCircleOutlined />} showIcon style={{ marginBottom: 12 }} />
            ) : (
              <Card
                title={<span><WarningOutlined style={{ color: '#F39C12' }} /> {t('fees.collection.pendingFees')} {pendingDemands.length > 0 ? `(${pendingDemands.length})` : ''}</span>}
                extra={
                  <Space>
                    <Button size="small" onClick={selectAll} disabled={!pendingDemands.length}>{t('fees.collection.selectAll')}</Button>
                    <Text strong style={{ color: '#1A5276' }}>{t('fees.collection.selected')}: ₹{selectedTotal.toFixed(0)}</Text>
                    <Button type="primary" style={{ background: '#1A5276' }} onClick={openCollect} disabled={!selectedDemandIds.length}>
                      {t('fees.collection.collectBtn')}
                    </Button>
                  </Space>
                }
                style={{ marginBottom: 12 }}
              >
                <Table
                  dataSource={pendingDemands}
                  columns={demandCols}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  loading={demandsLoading}
                  summary={() => pendingDemands.length > 0 ? (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} />
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>₹{(pendingDemands as any[]).reduce((s, d) => s + +d.netAmount, 0).toFixed(0)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text style={{ color: '#27AE60' }}>₹{(pendingDemands as any[]).reduce((s, d) => s + +d.paidAmount, 0).toFixed(0)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text style={{ color: '#E74C3C', fontWeight: 700 }}>₹{(pendingDemands as any[]).reduce((s, d) => s + (+d.netAmount - +d.paidAmount), 0).toFixed(0)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} />
                    </Table.Summary.Row>
                  ) : null}
                />
              </Card>
            )}

            {/* Payment history */}
            <Card title={<span><FileTextOutlined /> {t('fees.payHistory')}</span>}>
              <Table
                dataSource={payments as any[]}
                columns={payHistoryCols}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </>
        )}
      </Col>

      {/* ── Collection modal ── */}
      <Modal
        open={collectModal}
        title={t('fees.collectModal.title', { name: selectedStudentObj?.nameMr || '' })}
        onCancel={() => setCollectModal(false)}
        onOk={() => form.validateFields().then(vals => collectMut.mutate(vals))}
        okText={t('fees.collectModal.issueReceipt')}
        cancelText={t('app.cancel')}
        confirmLoading={collectMut.isPending}
        width={520}
      >
        <Alert style={{ marginBottom: 12 }} type="info" message={t('fees.collectModal.totalAmount', { amount: selectedTotal.toFixed(2) })} />
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="receiptNumber" label={t('fees.collectModal.receiptNumber')} rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentDate" label={t('fees.collectModal.date')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="paymentMode" label={t('fees.collectModal.paymentMode')} rules={[{ required: true }]}>
            <Select>{Object.entries(PAYMENT_MODE_LABELS).map(([v]) => <Option key={v} value={v}>{t(`fees.paymentModes.${v}`, { defaultValue: v })}</Option>)}</Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.paymentMode !== c.paymentMode}>
            {({ getFieldValue }) => {
              const mode = getFieldValue('paymentMode');
              return (
                <>
                  {mode === 'cheque' && (
                    <Row gutter={12}>
                      <Col span={12}><Form.Item name="chequeNumber" label={t('fees.collectModal.chequeNumber')}><Input /></Form.Item></Col>
                      <Col span={12}><Form.Item name="chequeDate" label={t('fees.collectModal.chequeDate')}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                  )}
                  {(mode === 'neft' || mode === 'upi' || mode === 'online') && (
                    <Form.Item name="utrNumber" label={t('fees.collectModal.utrNumber')}><Input /></Form.Item>
                  )}
                  {(mode === 'cheque' || mode === 'neft') && (
                    <Form.Item name="bankNameMr" label={t('fees.collectModal.bankName')}><MrInput /></Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>
          <Form.Item name="collectedBy" label={t('fees.collectModal.collectedBy')}><Input disabled /></Form.Item>
          <Form.Item name="remarks" label={t('fees.collectModal.remarks')}><MrInput /></Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}
