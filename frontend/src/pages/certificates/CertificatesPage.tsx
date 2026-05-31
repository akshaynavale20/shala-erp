import { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space, Tag, message,
  Typography, Popconfirm, Row, Col, DatePicker, Divider,
} from 'antd';
import { MrInput } from '../../components/common/MrInput';
import {
  PlusOutlined, PrinterOutlined, StopOutlined, UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { certificateApi, unitApi, gradeApi, sansthaApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { useCurrentYear } from '../../hooks/useCurrentYear';
import { brandHeader, BRAND_CSS, openPrint } from '../../utils/erp-print';
import { downloadCertificate } from '../../pdf/Certificate';
import { isCertPrinted, markCertPrinted } from '../../utils/printTracker';
import StudentSearchSelect from '../../components/common/StudentSearchSelect';

const { Text } = Typography;

// ─── Certificate type options ──────────────────────────────────────────────────
const CERT_TYPE_OPTS = [
  { value: 'bonafide',  label: 'बोनाफाईड प्रमाणपत्र' },
  { value: 'leaving',   label: 'शाळा सोडल्याचा दाखला (TC)' },
  { value: 'character', label: 'चारित्र्य प्रमाणपत्र' },
  { value: 'study',     label: 'अध्ययन प्रमाणपत्र' },
  { value: 'migration', label: 'स्थलांतर प्रमाणपत्र' },
  { value: 'medium',    label: 'माध्यम प्रमाणपत्र' },
];
const CERT_LABELS: Record<string, string> = Object.fromEntries(CERT_TYPE_OPTS.map(o => [o.value, o.label]));
const STATUS_COLORS: Record<string, string> = { issued: 'green', cancelled: 'red' };
const STATUS_LABELS: Record<string, string> = { issued: 'दिले', cancelled: 'रद्द' };

const CONDUCT_OPTS   = ['उत्कृष्ट', 'चांगले', 'समाधानकारक'].map(v => ({ value: v, label: v }));
const PROGRESS_OPTS  = ['उत्कृष्ट', 'चांगली', 'समाधानकारक'].map(v => ({ value: v, label: v }));
const PASSED_OPTS    = ['उत्तीर्ण', 'अनुत्तीर्ण', 'पात्र'].map(v => ({ value: v, label: v }));
const MEDIUM_OPTS    = ['मराठी', 'इंग्रजी', 'हिंदी', 'उर्दू', 'सेमी-इंग्रजी'].map(v => ({ value: v, label: v }));
const RELIGION_OPTS  = ['हिंदू', 'मुस्लिम', 'ख्रिश्चन', 'बौद्ध', 'जैन', 'शीख', 'इतर'].map(v => ({ value: v, label: v }));

// ─── Common CSS ────────────────────────────────────────────────────────────────
// CSS for cert-specific elements (layered on top of BRAND_CSS)
const CERT_EXTRA_CSS = `
  .cert-title { font-size: 17px; font-weight: bold; text-align: center; text-decoration: underline; margin: 14px 0; letter-spacing: 1px; color: #1A3A5C; }
  .meta-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; }
  table.data { width: 100%; border-collapse: collapse; margin: 10px 0; }
  table.data td { padding: 6px 10px; border: 1px solid #999; vertical-align: top; }
  table.data td.lbl { font-weight: bold; width: 42%; background: #f9f9f9; }
  .para { line-height: 2; margin: 10px 0; text-align: justify; }
  .cert-footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sig { text-align: center; }
  .sig-line { border-top: 1px solid #000; width: 180px; margin: 0 auto 4px; }
`;
const CSS = BRAND_CSS + CERT_EXTRA_CSS;

function certFooter(unit: any) {
  return `<div class="cert-footer">
    <div class="seal-box" style="width:100px;height:80px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;text-align:center">शिक्का</div>
    <div class="sig"><div class="sig-line"></div><div>मुख्याध्यापक / प्राचार्य</div><div style="font-size:11px;">${unit?.nameMr || ''}</div></div>
  </div>
  <div class="no-print" style="text-align:center;margin-top:20px">
    <button onclick="window.print()" style="padding:10px 28px;background:#C0722A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-family:inherit">🖨️ Print / PDF Save करा</button>
  </div>`;
}

function printTC(cert: any, student: any, unit: any, _sansthaName: string, sanstha?: any) {
  const m = cert.metadata || {};
  openPrint(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
  ${brandHeader(sanstha, unit)}
  <div class="cert-title">शाळा सोडल्याचा दाखला (Transfer Certificate)</div>
  <div class="meta-row"><span>TC क्र.: <strong>${cert.certificateNumber}</strong></span><span>दिनांक: <strong>${dayjs(cert.issueDate).format('DD/MM/YYYY')}</strong></span></div>
  <table class="data">
    <tr><td class="lbl">विद्यार्थ्याचे पूर्ण नाव (मराठी)</td><td>${student?.nameMr || '—'}</td></tr>
    <tr><td class="lbl">विद्यार्थ्याचे पूर्ण नाव (इंग्रजी)</td><td>${student?.nameEn || m.nameEn || '—'}</td></tr>
    <tr><td class="lbl">आईचे नाव</td><td>${student?.motherNameMr || m.motherNameMr || '—'}</td></tr>
    <tr><td class="lbl">वडिलांचे / पालकाचे नाव</td><td>${student?.fatherNameMr || '—'}</td></tr>
    <tr><td class="lbl">जन्म तारीख (अंकात)</td><td>${student?.dateOfBirth ? dayjs(student.dateOfBirth).format('DD/MM/YYYY') : '—'}</td></tr>
    <tr><td class="lbl">जन्म तारीख (अक्षरात)</td><td>${m.dobInWords || '—'}</td></tr>
    <tr><td class="lbl">राष्ट्रीयत्व</td><td>${m.nationality || 'भारतीय'}</td></tr>
    <tr><td class="lbl">धर्म</td><td>${student?.religion || m.religion || '—'}</td></tr>
    <tr><td class="lbl">जात / पोटजात</td><td>${student?.caste || m.caste || '—'}</td></tr>
    <tr><td class="lbl">मातृभाषा</td><td>${m.motherTongue || 'मराठी'}</td></tr>
    <tr><td class="lbl">सर्वसाधारण नोंदणी क्र.</td><td>${m.generalRegNo || student?.grNo || '—'}</td></tr>
    <tr><td class="lbl">शाळेत प्रवेश दिनांक</td><td>${m.admissionDate ? dayjs(m.admissionDate).format('DD/MM/YYYY') : '—'}</td></tr>
    <tr><td class="lbl">प्रवेश घेतलेला वर्ग</td><td>${m.admissionStd || '—'}</td></tr>
    <tr><td class="lbl">शेवटचा शिकलेला वर्ग</td><td>${m.classLastStudied || '—'}</td></tr>
    <tr><td class="lbl">शेवटची शैक्षणिक वर्षे</td><td>${m.lastAcademicYear || '—'}</td></tr>
    <tr><td class="lbl">उत्तीर्ण / अनुत्तीर्ण / पात्र</td><td>${m.passedOrFailed || '—'}</td></tr>
    <tr><td class="lbl">प्रगती</td><td>${m.progress || '—'}</td></tr>
    <tr><td class="lbl">वर्तन</td><td>${m.conduct || '—'}</td></tr>
    <tr><td class="lbl">थकबाकी (होय / नाही)</td><td>${m.duesCleared === true ? 'नाही (सर्व थकबाकी भरली)' : m.duesCleared === false ? 'होय' : '—'}</td></tr>
    <tr><td class="lbl">शाळेत हजर होता (दिनांकास)</td><td>${m.presentOnDate || '—'}</td></tr>
    <tr><td class="lbl">शाळा सोडण्याचे कारण</td><td>${m.reasonForLeaving || cert.purposeMr || '—'}</td></tr>
    <tr><td class="lbl">NCC / NSS / स्काऊट</td><td>${m.extraCurricular || '—'}</td></tr>
    <tr><td class="lbl">मागील TC क्र. (असल्यास)</td><td>${m.previousTCNumber || '—'}</td></tr>
    <tr><td class="lbl">शेरा</td><td>${cert.remarks || '—'}</td></tr>
  </table>
  ${certFooter(unit)}</body></html>`);
}

function printBonafide(cert: any, student: any, unit: any, _sansthaName: string, sanstha?: any) {
  const m = cert.metadata || {};
  openPrint(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
  ${brandHeader(sanstha, unit)}
  <div class="cert-title">बोनाफाईड प्रमाणपत्र (Bonafide Certificate)</div>
  <div class="meta-row"><span>प्र. क्र.: <strong>${cert.certificateNumber}</strong></span><span>दिनांक: <strong>${dayjs(cert.issueDate).format('DD/MM/YYYY')}</strong></span></div>
  <div class="para">
    हे प्रमाणित करण्यात येते की, <strong>${student?.nameMr || '—'}</strong>,
    ${student?.fatherNameMr ? `पुत्र / कन्या ${student.fatherNameMr},` : ''}
    हे / ही या शाळेत ${m.classLastStudied || m.currentStd || '—'} इयत्तेत शिकत आहे / आहेत.
    ${m.division ? `तुकडी: <strong>${m.division}</strong>.` : ''}
    त्यांचा जन्म दिनांक <strong>${student?.dateOfBirth ? dayjs(student.dateOfBirth).format('DD/MM/YYYY') : '—'}</strong> असा आहे.
    ${m.purpose ? `हे प्रमाणपत्र ${m.purpose} साठी देण्यात येत आहे.` : ''}
    शैक्षणिक वर्ष <strong>${m.academicYear || '—'}</strong> मध्ये ते / त्या या संस्थेचे / संस्थेची नियमित विद्यार्थी आहेत.
  </div>
  ${cert.remarks ? `<div class="para"><strong>शेरा:</strong> ${cert.remarks}</div>` : ''}
  ${certFooter(unit)}</body></html>`);
}

function printCharacter(cert: any, student: any, unit: any, _sansthaName: string, sanstha?: any) {
  const m = cert.metadata || {};
  openPrint(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
  ${brandHeader(sanstha, unit)}
  <div class="cert-title">चारित्र्य प्रमाणपत्र (Character Certificate)</div>
  <div class="meta-row"><span>प्र. क्र.: <strong>${cert.certificateNumber}</strong></span><span>दिनांक: <strong>${dayjs(cert.issueDate).format('DD/MM/YYYY')}</strong></span></div>
  <div class="para">
    हे प्रमाणित करण्यात येते की, <strong>${student?.nameMr || '—'}</strong>
    ${student?.fatherNameMr ? `(पुत्र/कन्या श्री/श्रीमती ${student.fatherNameMr})` : ''}
    हे/ही या शाळेत ${m.fromYear || '—'} ते ${m.toYear || '—'} या कालावधीत शिकले/शिकल्या.
    त्यांचे/त्यांच्या वर्तन <strong>${m.conduct || 'चांगले'}</strong> असून प्रगती <strong>${m.progress || 'समाधानकारक'}</strong> होती.
    ते/त्या एक चांगल्या चारित्र्याचे विद्यार्थी/विद्यार्थिनी आहेत.
    ${cert.purposeMr ? `हे प्रमाणपत्र ${cert.purposeMr} साठी देण्यात येत आहे.` : ''}
  </div>
  ${cert.remarks ? `<div class="para"><strong>शेरा:</strong> ${cert.remarks}</div>` : ''}
  ${certFooter(unit)}</body></html>`);
}

function printGeneric(cert: any, student: any, unit: any, _sansthaName: string, sanstha?: any) {
  const m = cert.metadata || {};
  openPrint(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
  ${brandHeader(sanstha, unit)}
  <div class="cert-title">${CERT_LABELS[cert.certificateType] || cert.certificateType}</div>
  <div class="meta-row"><span>प्र. क्र.: <strong>${cert.certificateNumber}</strong></span><span>दिनांक: <strong>${dayjs(cert.issueDate).format('DD/MM/YYYY')}</strong></span></div>
  <table class="data">
    <tr><td class="lbl">विद्यार्थ्याचे नाव</td><td>${student?.nameMr || '—'}</td></tr>
    <tr><td class="lbl">वडिलांचे नाव</td><td>${student?.fatherNameMr || '—'}</td></tr>
    ${m.currentStd ? `<tr><td class="lbl">इयत्ता</td><td>${m.currentStd}</td></tr>` : ''}
    ${m.academicYear ? `<tr><td class="lbl">शैक्षणिक वर्ष</td><td>${m.academicYear}</td></tr>` : ''}
    ${m.medium ? `<tr><td class="lbl">शिक्षणाचे माध्यम</td><td>${m.medium}</td></tr>` : ''}
    <tr><td class="lbl">कारण / उद्देश</td><td>${cert.purposeMr || '—'}</td></tr>
  </table>
  ${cert.remarks ? `<div class="para"><strong>शेरा:</strong> ${cert.remarks}</div>` : ''}
  ${certFooter(unit)}</body></html>`);
}

function printCertificate(cert: any, student: any, unit: any, sansthaName: string, sanstha?: any) {
  if (cert.certificateType === 'leaving')   return printTC(cert, student, unit, sansthaName, sanstha);
  if (cert.certificateType === 'bonafide')  return printBonafide(cert, student, unit, sansthaName, sanstha);
  if (cert.certificateType === 'character') return printCharacter(cert, student, unit, sansthaName, sanstha);
  return printGeneric(cert, student, unit, sansthaName, sanstha);
}

// ─── Type-specific extra form fields ──────────────────────────────────────────
function ExtraFields({ certType, academicYearOpts, gradeOpts, divisionOpts }: {
  certType: string;
  academicYearOpts: { value: string; label: string }[];
  gradeOpts: { value: string; label: string }[];
  divisionOpts: { value: string; label: string }[];
}) {
  if (certType === 'leaving') return (
    <>
      <Divider orientation={"left" as any} plain style={{ fontSize: 12 }}>TC तपशील</Divider>
      <Row gutter={12}>
        <Col span={12}><Form.Item name={['metadata', 'generalRegNo']} label="सर्वसाधारण नोंदणी क्र."><Input /></Form.Item></Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'admissionDate']} label="प्रवेश दिनांक">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'admissionStd']} label="प्रवेश वर्ग">
            <Select options={gradeOpts} placeholder="इयत्ता निवडा" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'classLastStudied']} label="शेवटचा वर्ग">
            <Select options={gradeOpts} placeholder="इयत्ता निवडा" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'lastAcademicYear']} label="शेवटचे शैक्षणिक वर्ष">
            <Select options={academicYearOpts} placeholder="वर्ष निवडा" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'passedOrFailed']} label="उत्तीर्ण / अनुत्तीर्ण">
            <Select options={PASSED_OPTS} />
          </Form.Item>
        </Col>
        <Col span={12}><Form.Item name={['metadata', 'progress']} label="प्रगती"><Select options={PROGRESS_OPTS} /></Form.Item></Col>
        <Col span={12}><Form.Item name={['metadata', 'conduct']} label="वर्तन"><Select options={CONDUCT_OPTS} /></Form.Item></Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'duesCleared']} label="थकबाकी नाही">
            <Select options={[{ value: true, label: 'होय (सर्व भरली)' }, { value: false, label: 'नाही (थकबाकी आहे)' }]} />
          </Form.Item>
        </Col>
        <Col span={12}><Form.Item name={['metadata', 'reasonForLeaving']} label="शाळा सोडण्याचे कारण"><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name={["metadata", "motherNameMr"]} label="आईचे नाव"><MrInput placeholder="e.g. sunita" /></Form.Item></Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'nationality']} label="राष्ट्रीयत्व">
            <Select options={['भारतीय', 'इतर'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'religion']} label="धर्म">
            <Select options={RELIGION_OPTS} allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'motherTongue']} label="मातृभाषा">
            <Select options={['मराठी', 'हिंदी', 'उर्दू', 'इंग्रजी', 'इतर'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
        </Col>
        <Col span={12}><Form.Item name={['metadata', 'dobInWords']} label="जन्म तारीख (अक्षरात)"><Input /></Form.Item></Col>
        <Col span={24}><Form.Item name={['metadata', 'extraCurricular']} label="NCC/NSS/स्काऊट उपक्रम"><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name={['metadata', 'previousTCNumber']} label="मागील TC क्र. (असल्यास)"><Input /></Form.Item></Col>
        <Col span={12}><Form.Item name={['metadata', 'presentOnDate']} label="हजर होता दिनांक"><Input placeholder="DD/MM/YYYY" /></Form.Item></Col>
      </Row>
    </>
  );

  if (certType === 'bonafide') return (
    <>
      <Divider orientation={"left" as any} plain style={{ fontSize: 12 }}>बोनाफाईड तपशील</Divider>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name={['metadata', 'classLastStudied']} label="सध्याचा वर्ग">
            <Select options={gradeOpts} placeholder="इयत्ता निवडा" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'division']} label="तुकडी">
            <Select options={divisionOpts} placeholder="तुकडी निवडा" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'academicYear']} label="शैक्षणिक वर्ष">
            <Select options={academicYearOpts} placeholder="वर्ष निवडा" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}><Form.Item name={['metadata', 'purpose']} label="उद्देश (मराठीत)"><Input placeholder="शिष्यवृत्ती साठी" /></Form.Item></Col>
      </Row>
    </>
  );

  if (certType === 'character') return (
    <>
      <Divider orientation={"left" as any} plain style={{ fontSize: 12 }}>चारित्र्य तपशील</Divider>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name={['metadata', 'fromYear']} label="वर्षापासून">
            <Select options={academicYearOpts} placeholder="वर्ष निवडा" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'toYear']} label="वर्षापर्यंत">
            <Select options={academicYearOpts} placeholder="वर्ष निवडा" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}><Form.Item name={['metadata', 'conduct']} label="वर्तन"><Select options={CONDUCT_OPTS} /></Form.Item></Col>
        <Col span={12}><Form.Item name={['metadata', 'progress']} label="प्रगती"><Select options={PROGRESS_OPTS} /></Form.Item></Col>
      </Row>
    </>
  );

  if (certType === 'medium') return (
    <>
      <Divider orientation={"left" as any} plain style={{ fontSize: 12 }}>माध्यम तपशील</Divider>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name={['metadata', 'classLastStudied']} label="वर्ग">
            <Select options={gradeOpts} placeholder="इयत्ता निवडा" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'medium']} label="माध्यम">
            <Select options={MEDIUM_OPTS} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'academicYear']} label="शैक्षणिक वर्ष">
            <Select options={academicYearOpts} placeholder="वर्ष निवडा" allowClear />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  if (certType === 'study' || certType === 'migration') return (
    <>
      <Divider orientation={"left" as any} plain style={{ fontSize: 12 }}>तपशील</Divider>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name={['metadata', 'classLastStudied']} label="शेवटचा वर्ग">
            <Select options={gradeOpts} placeholder="इयत्ता निवडा" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metadata', 'academicYear']} label="शैक्षणिक वर्ष">
            <Select options={academicYearOpts} placeholder="वर्ष निवडा" allowClear />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  return null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CertificatesPage() {
  const { user: me } = useAuthStore();
  const { selectedUnitId: globalUnit, setSelectedUnitId: setGlobalUnit } = useAppStore();
  const qc = useQueryClient();
  const [issueOpen, setIssueOpen]             = useState(false);
  const [filterUnit, setFilterUnit]           = useState<string | undefined>(globalUnit ?? undefined);
  const [formUnit, setFormUnit]               = useState<string | undefined>(globalUnit ?? undefined);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCertType, setSelectedCertType] = useState<string>('bonafide');
  const [form] = Form.useForm();
  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: sansthaData } = useQuery({
    queryKey: ['sanstha', me?.sansthaId],
    queryFn: () => sansthaApi.findOne(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 5 * 60 * 1000,
  });
  const sansthaName = (sansthaData as any)?.nameMr || 'संस्था';

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certs', me?.sansthaId, filterUnit],
    queryFn: () => certificateApi.findBySanstha(me!.sansthaId, filterUnit),
    enabled: !!me?.sansthaId,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', me?.sansthaId],
    queryFn: () => unitApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
  });

  const { years: academicYears } = useCurrentYear();

  const { data: grades = [] } = useQuery({
    queryKey: ['grades-cert', formUnit],
    queryFn: () => gradeApi.findByUnit(formUnit!),
    enabled: !!formUnit,
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions-cert', formUnit],
    queryFn: () => gradeApi.findDivisionsWithGrade(formUnit!),
    enabled: !!formUnit,
  });

  // Build option lists
  const academicYearOpts = (academicYears as any[]).map(y => ({
    value: y.labelMr || y.labelEn,
    label: y.labelMr || y.labelEn,
  }));

  const gradeOpts = (grades as any[]).map(g => ({
    value: g.gradeLabelMr || `इयत्ता ${g.gradeNumber}`,
    label: g.gradeLabelMr || `इयत्ता ${g.gradeNumber}`,
  }));

  const divisionOpts = (divisions as any[]).map(d => ({
    value: d.nameMr,
    label: `${d.gradeConfig?.gradeLabelMr || ''} — ${d.nameMr}`,
  }));

  // ── Auto-fill student data when student selected ─────────────────────────────
  const handleStudentSelect = (id: string, student: any) => {
    setSelectedStudent(student);
    if (!student) return;

    const certType = form.getFieldValue('certificateType') || selectedCertType;

    // Fields valid for ALL types
    form.setFieldValue('studentId', id);

    // Resolve grade label + division name from already-fetched lists
    const studentDiv  = (divisions as any[]).find(d => d.id === student.divisionId);
    const studentGrade = (grades as any[]).find(g => g.id === student.gradeConfigId);
    const gradeLabel  = studentDiv?.gradeConfig?.gradeLabelMr
      || studentGrade?.gradeLabelMr
      || (studentGrade?.gradeNumber ? `इयत्ता ${studentGrade.gradeNumber}` : '');
    const divName     = studentDiv?.nameMr || '';
    const currentAY   = (academicYears as any[]).find((y: any) => y.isCurrent || y.isActive);
    const ayLabel     = currentAY ? (currentAY.labelMr || currentAY.labelEn) : '';

    if (certType === 'leaving') {
      form.setFieldsValue({
        metadata: {
          ...form.getFieldValue('metadata'),
          motherNameMr:      student.motherNameMr  || '',
          religion:          student.religion       || '',
          nationality:       student.nationality    || 'भारतीय',
          motherTongue:      student.motherTongue   || 'मराठी',
          generalRegNo:      student.grNo           || '',
          classLastStudied:  gradeLabel,
          lastAcademicYear:  ayLabel,
        },
      });
    } else if (certType === 'bonafide') {
      form.setFieldsValue({
        metadata: {
          ...form.getFieldValue('metadata'),
          classLastStudied: gradeLabel,
          division:         divName,
          academicYear:     ayLabel,
        },
      });
    } else {
      // study, migration, medium, character — fill grade + year wherever applicable
      form.setFieldsValue({
        metadata: {
          ...form.getFieldValue('metadata'),
          classLastStudied: gradeLabel,
          academicYear:     ayLabel,
        },
      });
    }
  };

  const openIssueModal = () => {
    form.resetFields();
    setSelectedStudent(null);
    setSelectedCertType('bonafide');
    setFormUnit(filterUnit);
    form.setFieldsValue({
      certificateType: 'bonafide',
      issueDate: dayjs(),
      unitId: filterUnit,
    });
    setIssueOpen(true);
  };

  const closeIssueModal = () => {
    setIssueOpen(false);
    setSelectedStudent(null);
    setFormUnit(undefined);
    form.resetFields();
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const issueMutation = useMutation({
    mutationFn: async (values: any) => {
      const certNum = await certificateApi.nextNumber(values.unitId, values.certificateType);
      return certificateApi.issue({
        ...values,
        sansthaId: me!.sansthaId,
        issueDate: values.issueDate?.format?.('YYYY-MM-DD') || values.issueDate || dayjs().format('YYYY-MM-DD'),
        issuedBy: me!.id,
        certificateNumber: typeof certNum === 'string' ? certNum : (certNum as any).number || `CERT-${Date.now()}`,
      });
    },
    onSuccess: (cert: any) => {
      message.success('प्रमाणपत्र दिले');
      qc.invalidateQueries({ queryKey: ['certs'] });
      const unit = (units as any[]).find((u: any) => u.id === cert.unitId);
      // First print — mark and download (new cert is never duplicate)
      markCertPrinted(cert.id);
      downloadCertificate({
        cert,
        student: selectedStudent || {},
        sanstha: sansthaData,
        unit,
        userName: me?.nameMr || me?.email,
      }).catch(() => printCertificate(cert, selectedStudent, unit, sansthaName, sansthaData));
      closeIssueModal();
    },
    onError: () => message.error('त्रुटी'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => certificateApi.cancel(id),
    onSuccess: () => { message.success('प्रमाणपत्र रद्द झाले'); qc.invalidateQueries({ queryKey: ['certs'] }); },
  });

  // ── Table (certs list with student names) ────────────────────────────────────
  // Fetch all students for name lookup in table
  const { data: allStudents = [] } = useQuery({
    queryKey: ['students', me?.sansthaId, filterUnit],
    queryFn: () =>
      import('../../api/client').then(m => m.studentApi.findBySanstha(me!.sansthaId, { unitId: filterUnit })),
    enabled: !!me?.sansthaId,
  });

  const columns = [
    { title: 'क्र.', dataIndex: 'certificateNumber', key: 'num', width: 120,
      render: (v: string) => <Text code>{v}</Text> },
    { title: 'विद्यार्थी', key: 'student',
      render: (_: any, rec: any) => {
        const s = (allStudents as any[]).find(st => st.id === rec.studentId);
        return s ? (
          <Space size={4}>
            <UserOutlined style={{ color: '#1A5276' }} />
            <span>{s.nameMr}</span>
            {s.fatherNameMr && <Text type="secondary" style={{ fontSize: 12 }}>/ {s.fatherNameMr}</Text>}
          </Space>
        ) : <Text type="secondary">{rec.studentId?.slice(0,8)}…</Text>;
      }},
    { title: 'प्रकार', dataIndex: 'certificateType', key: 'type', width: 190,
      render: (v: string) => <Tag color="blue">{CERT_LABELS[v] || v}</Tag> },
    { title: 'दिनांक', dataIndex: 'issueDate', key: 'date', width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { title: 'कारण', dataIndex: 'purposeMr', key: 'purpose', render: (v: string) => v || '—' },
    { title: 'स्थिती', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag> },
    { title: 'कृती', key: 'actions', width: 130,
      render: (_: any, rec: any) => {
        const s = (allStudents as any[]).find(st => st.id === rec.studentId);
        const u = (units as any[]).find(un => un.id === rec.unitId);
        return (
          <Space>
            <Button size="small" icon={<PrinterOutlined />}
              onClick={() => {
                const _isDupC = isCertPrinted(rec.id);
                const _printCert = (dup?: boolean) => downloadCertificate({ cert: rec, student: s || {}, sanstha: sansthaData, unit: u, userName: me?.nameMr || me?.email, isDuplicate: dup }).catch(() => printCertificate(rec, s, u, sansthaName, sansthaData));
                if (_isDupC) {
                  Modal.confirm({
                    title: '⚠️ हे प्रमाणपत्र आधीच print झाले आहे',
                    content: 'हे DUPLICATE print असेल. पुढे जायचे का?',
                    okText: 'हो, DUPLICATE print करा',
                    cancelText: 'नको',
                    onOk: () => _printCert(true),
                  });
                } else {
                  markCertPrinted(rec.id);
                  _printCert(false);
                }
              }}>
              PDF
            </Button>
            {rec.status === 'issued' && (
              <Popconfirm title="प्रमाणपत्र रद्द करायचे?" onConfirm={() => cancelMutation.mutate(rec.id)} okText="होय" cancelText="नाही">
                <Button size="small" icon={<StopOutlined />} danger />
              </Popconfirm>
            )}
          </Space>
        );
      }},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', fontFamily: 'Mukta, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #DDE8F4',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <FileTextOutlined style={{ fontSize: 18, color: '#1A3A5C' }} />
        <Text strong style={{ fontSize: 16, color: '#1A3A5C' }}>प्रमाणपत्र व्यवस्थापन</Text>
        <div style={{ marginLeft: 'auto' }}>
          <Space>
            <Select placeholder="शाळा गाळणी" allowClear size="small" style={{ width: 180 }}
              options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
              onChange={v => { setFilterUnit(v); setGlobalUnit(v ?? null); }} />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openIssueModal}>
              प्रमाणपत्र द्या
            </Button>
          </Space>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#fff' }}>
      <Table
        dataSource={certs as any[]}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: 'कोणतेही प्रमाणपत्र नाही' }}
        size="small"
      />

      {/* ── Issue Modal ──────────────────────────────────────────────────────── */}
      <Modal
        title="नवीन प्रमाणपत्र द्या"
        open={issueOpen}
        onCancel={closeIssueModal}
        footer={null}
        width={700}
        forceRender
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={issueMutation.mutate}
          initialValues={{ certificateType: 'bonafide', issueDate: dayjs() }}
        >
          {/* ── Step 1: School + Type ──────────────────────────────────────── */}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="unitId" label="शाळा" rules={[{ required: true, message: 'शाळा निवडा' }]}>
                <Select
                  placeholder="शाळा निवडा"
                  options={(units as any[]).map(u => ({ value: u.id, label: u.nameMr }))}
                  onChange={v => {
                    setFormUnit(v);
                    form.setFieldValue('studentId', undefined);
                    setSelectedStudent(null);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certificateType" label="प्रमाणपत्र प्रकार" rules={[{ required: true }]}>
                <Select
                  options={CERT_TYPE_OPTS}
                  onChange={v => {
                    setSelectedCertType(v);
                    form.setFieldValue(['metadata'], {});
                    // Re-apply student auto-fill for new cert type
                    if (selectedStudent) {
                      setTimeout(() => handleStudentSelect(selectedStudent.id, selectedStudent), 0);
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Step 2: Student search → auto-fill ────────────────────────── */}
          <Form.Item
            name="studentId"
            label={
              <Space>
                <span>विद्यार्थी शोधा</span>
                {selectedStudent && (
                  <Tag color="blue" style={{ marginLeft: 4 }}>
                    {selectedStudent.nameMr}
                    {selectedStudent.rollNumber ? ` | रोल: ${selectedStudent.rollNumber}` : ''}
                    {selectedStudent.dateOfBirth ? ` | जन्म: ${dayjs(selectedStudent.dateOfBirth).format('DD/MM/YYYY')}` : ''}
                  </Tag>
                )}
              </Space>
            }
            rules={[{ required: true, message: 'विद्यार्थी निवडा' }]}
          >
            <StudentSearchSelect
              unitId={formUnit}
              value={form.getFieldValue('studentId')}
              onChange={handleStudentSelect}
              placeholder="नाव, वडिलांचे नाव किंवा रोल नंबरने शोधा..."
              allowClear
            />
          </Form.Item>

          {/* Auto-filled read-only student info strip */}
          {selectedStudent && (
            <div style={{ background: '#EBF5FB', border: '1px solid #AED6F1', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: 12 }}>
              <Row gutter={16}>
                {selectedStudent.fatherNameMr  && <Col><Text type="secondary">वडील:</Text> <strong>{selectedStudent.fatherNameMr}</strong></Col>}
                {selectedStudent.motherNameMr  && <Col><Text type="secondary">आई:</Text> <strong>{selectedStudent.motherNameMr}</strong></Col>}
                {selectedStudent.dateOfBirth   && <Col><Text type="secondary">जन्म:</Text> <strong>{dayjs(selectedStudent.dateOfBirth).format('DD/MM/YYYY')}</strong></Col>}
                {selectedStudent.grNo          && <Col><Text type="secondary">GR:</Text> <strong>{selectedStudent.grNo}</strong></Col>}
                {selectedStudent.religion      && <Col><Text type="secondary">धर्म:</Text> <strong>{selectedStudent.religion}</strong></Col>}
                {selectedStudent.caste         && <Col><Text type="secondary">जात:</Text> <strong>{selectedStudent.caste}</strong></Col>}
              </Row>
            </div>
          )}

          {/* ── Date + Purpose + Remarks ───────────────────────────────────── */}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="issueDate" label="दिनांक">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purposeMr" label="कारण / उद्देश"><MrInput placeholder="e.g. shishyavritti" /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="शेरा"><MrInput placeholder="e.g. sheera liha" /></Form.Item>
            </Col>
          </Row>

          {/* ── Type-specific fields ───────────────────────────────────────── */}
          <ExtraFields
            certType={selectedCertType}
            academicYearOpts={academicYearOpts}
            gradeOpts={gradeOpts}
            divisionOpts={divisionOpts}
          />

          <Space style={{ marginTop: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={issueMutation.isPending}
             
              disabled={!selectedStudent}
            >
              Issue करा व Print करा
            </Button>
            <Button onClick={closeIssueModal}>रद्द करा</Button>
          </Space>
        </Form>
      </Modal>
      </div>
    </div>
  );
}
