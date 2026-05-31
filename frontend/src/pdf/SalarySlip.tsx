/**
 * SalarySlip.tsx — Direction 3: "Modern Gazette" (Indigo modern)
 * Clean professional salary slip with indigo accent
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import BrandHeader from './components/BrandHeader';
import BrandFooter from './components/BrandFooter';
import AuditFooter from './components/AuditFooter';
import PageNumber from './components/PageNumber';
import { RPT, FONT, base } from './theme';
import { registerFonts } from './fonts';
import { loadLogoAsDataUrl } from './logoLoader';

export interface SalarySlipProps {
  slip: {
    month: number;
    year: number;
    grossSalary: number;
    totalDeduction: number;
    netSalary: number;
    earnings?: { nameMr: string; amount: number }[];
    deductions?: { nameMr: string; amount: number }[];
    paymentDate?: string;
    paymentMode?: string;
    status?: string;
  };
  staff: {
    nameMr?: string;
    designation?: string;
    employeeCode?: string;
    qualification?: string;
  } | null;
  sanstha?: any;
  unit?: any;
  userName?: string;
  logoDataUrl?: string;
}

const MONTH_MR = [
  'जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून',
  'जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर',
];

function fmt(n: number) {
  return `₹ ${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const s = StyleSheet.create({
  // ── Topbar: title + status ────────────────────────────────────────────
  topbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingBottom: 5, marginBottom: 10,
    borderBottomWidth: 2, borderBottomColor: RPT.accent,
  },
  titleText: { fontSize: 15, fontWeight: 700, color: RPT.accent, fontFamily: FONT },
  titleSub:  { fontSize: 7.5, color: RPT.muted, fontFamily: FONT, letterSpacing: 1.2, marginTop: 3 },
  statusPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2,
    fontSize: 8.5, fontWeight: 700, fontFamily: FONT,
  },

  // ── Staff info grid ────────────────────────────────────────────────────
  staffGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 5,
    backgroundColor: RPT.tint,
    borderWidth: 1, borderColor: RPT.rule,
    padding: '6 10', marginBottom: 10,
  },
  staffField: { minWidth: 110, marginRight: 12, marginBottom: 2 },
  fieldLabel: {
    fontSize: 7, color: RPT.muted, fontFamily: FONT,
    letterSpacing: 0.5, marginBottom: 1.5,
  },
  fieldValue: { fontSize: 9.5, fontWeight: 700, color: RPT.ink, fontFamily: FONT },

  // ── Earnings/Deductions two columns ───────────────────────────────────
  slipGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  slipSection: {
    flex: 1, borderWidth: 1, borderColor: RPT.rule,
  },
  sectionHeader: {
    padding: '4 8',
  },
  sectionHeaderText: {
    fontSize: 8, fontWeight: 700, fontFamily: FONT, letterSpacing: 0.5, color: '#fff',
  },
  tableRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RPT.rule },
  tableRowEven: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RPT.rule, backgroundColor: RPT.rowEven },
  cell: { padding: '3 6', fontSize: 8.5, fontFamily: FONT, flex: 1, color: RPT.ink },
  cellRight: { textAlign: 'right' },
  noData: { padding: '6 8', fontSize: 8.5, color: RPT.muted, fontFamily: FONT },

  // ── Summary box ────────────────────────────────────────────────────────
  summaryBox: {
    backgroundColor: RPT.accent,
    padding: '8 12', flexDirection: 'row',
    justifyContent: 'space-between', marginBottom: 8,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 7.5, color: 'rgba(255,255,255,0.75)', fontFamily: FONT, marginBottom: 2 },
  summaryValue: { fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: FONT },
  netValue:     { fontSize: 16, fontWeight: 700, color: '#FFD700', fontFamily: FONT },
});

export function SalarySlipPDF({ slip, staff, sanstha, unit, userName, logoDataUrl }: SalarySlipProps) {
  registerFonts();

  const monthLabel = MONTH_MR[(slip.month ?? 1) - 1];
  const earnings   = slip.earnings   || [];
  const deductions = slip.deductions || [];
  const isPaid     = slip.status === 'paid';

  return (
    <Document
      title={`वेतन स्लिप — ${staff?.nameMr || ''} — ${monthLabel} ${slip.year}`}
      author={sanstha?.nameMr || 'VidyaSetu'}
    >
      <Page size="A4" style={base.page}>
        <BrandHeader sanstha={sanstha} unit={unit} variant="report" logoDataUrl={logoDataUrl} />

        {/* Topbar */}
        <View style={s.topbar}>
          <View>
            <Text style={s.titleText}>वेतन स्लिप</Text>
            <Text style={s.titleSub}>{monthLabel} {slip.year} · SALARY SLIP</Text>
          </View>
          <View style={[s.statusPill, {
            backgroundColor: isPaid ? RPT.successBg : RPT.warningBg,
            color: isPaid ? RPT.success : RPT.warning,
          }]}>
            <Text style={{ fontSize: 8.5, fontWeight: 700, fontFamily: FONT,
              color: isPaid ? RPT.success : RPT.warning }}>
              {isPaid ? 'वेतन दिले' : 'प्रलंबित'}
              {isPaid && slip.paymentDate
                ? `  —  ${dayjs(slip.paymentDate).format('DD/MM/YYYY')}`
                : ''}
            </Text>
          </View>
        </View>

        {/* Staff info */}
        <View style={s.staffGrid}>
          <View style={s.staffField}>
            <Text style={s.fieldLabel}>कर्मचारी नाव</Text>
            <Text style={s.fieldValue}>{staff?.nameMr || '—'}</Text>
          </View>
          <View style={s.staffField}>
            <Text style={s.fieldLabel}>पद</Text>
            <Text style={s.fieldValue}>{staff?.designation || '—'}</Text>
          </View>
          <View style={s.staffField}>
            <Text style={s.fieldLabel}>कर्मचारी कोड</Text>
            <Text style={s.fieldValue}>{staff?.employeeCode || '—'}</Text>
          </View>
          {staff?.qualification && (
            <View style={s.staffField}>
              <Text style={s.fieldLabel}>शैक्षणिक पात्रता</Text>
              <Text style={s.fieldValue}>{staff.qualification}</Text>
            </View>
          )}
          <View style={s.staffField}>
            <Text style={s.fieldLabel}>वेतन माह</Text>
            <Text style={s.fieldValue}>{monthLabel} {slip.year}</Text>
          </View>
          {slip.paymentMode && (
            <View style={s.staffField}>
              <Text style={s.fieldLabel}>भुगतान पद्धत</Text>
              <Text style={s.fieldValue}>{slip.paymentMode}</Text>
            </View>
          )}
        </View>

        {/* Earnings | Deductions */}
        <View style={s.slipGrid}>
          {/* Earnings */}
          <View style={s.slipSection}>
            <View style={[s.sectionHeader, { backgroundColor: RPT.accent }]}>
              <Text style={[s.sectionHeaderText]}>उत्पन्न घटक (Earnings)</Text>
            </View>
            {earnings.length === 0 ? (
              <Text style={s.noData}>—</Text>
            ) : earnings.map((e, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowEven}>
                <Text style={s.cell}>{e.nameMr}</Text>
                <Text style={[s.cell, s.cellRight, { color: RPT.success }]}>{fmt(e.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Deductions */}
          <View style={s.slipSection}>
            <View style={[s.sectionHeader, { backgroundColor: RPT.danger }]}>
              <Text style={[s.sectionHeaderText]}>कपात घटक (Deductions)</Text>
            </View>
            {deductions.length === 0 ? (
              <Text style={s.noData}>—</Text>
            ) : deductions.map((d: { nameMr: string; amount: number }, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowEven}>
                <Text style={s.cell}>{d.nameMr}</Text>
                <Text style={[s.cell, s.cellRight, { color: RPT.danger }]}>{fmt(d.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary box */}
        <View style={s.summaryBox}>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>एकूण उत्पन्न</Text>
            <Text style={s.summaryValue}>{fmt(slip.grossSalary)}</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>एकूण कपात</Text>
            <Text style={s.summaryValue}>{fmt(slip.totalDeduction)}</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>निव्वळ वेतन</Text>
            <Text style={s.netValue}>{fmt(slip.netSalary)}</Text>
          </View>
        </View>

        <BrandFooter
          variant="report"
          signatures={[
            { label: 'संस्थेचा शिक्का', isSeal: true },
            { label: 'कर्मचारी स्वाक्षरी', sub: 'सही' },
            { label: 'मुख्याध्यापक', sub: 'सही व शिक्का' },
          ]}
        />
        <AuditFooter userName={userName} />
        <PageNumber />
      </Page>
    </Document>
  );
}

export async function downloadSalarySlip(props: SalarySlipProps): Promise<void> {
  registerFonts();
  const logoDataUrl = await loadLogoAsDataUrl(props.sanstha?.logoUrl);
  const blob = await pdf(<SalarySlipPDF {...props} logoDataUrl={logoDataUrl} />).toBlob();
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
