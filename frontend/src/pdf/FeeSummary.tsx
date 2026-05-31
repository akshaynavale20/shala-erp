/**
 * FeeSummary.tsx — Fee Collection Summary PDF
 *
 * Two-section layout:
 *   1. Summary stat cards  (total collected, count, average)
 *   2. Payment-mode table  (cash / online / cheque …)
 *   3. Unit-wise table     (per school breakdown)
 *
 * Uses the centralised design system:
 *   BrandHeader, BrandFooter, AuditFooter, PageNumber, theme tokens
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

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FeeSummaryProps {
  totalCollected: number;
  count: number;
  byMode: Record<string, number>;
  byUnit: Record<string, number>;
  unitNames: Record<string, string>;   // unitId → nameMr
  sanstha?: any;
  unit?: any;
  userName?: string;
  academicYearLabel?: string;
  filters?: { label: string; value: string }[];
  logoDataUrl?: string;
}

const PAY_MODE_LABEL: Record<string, string> = {
  cash: 'रोख (Cash)', online: 'Online', cheque: 'चेक (Cheque)',
  dd: 'DD', upi: 'UPI', neft: 'NEFT', other: 'इतर',
};

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Title bar
  titlebar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: 6, marginBottom: 8,
  },
  titleText: { fontSize: 15, fontWeight: 700, color: RPT.accent, fontFamily: FONT },
  dateBadge: {
    backgroundColor: RPT.accent, color: '#fff',
    fontWeight: 700, fontFamily: FONT, fontSize: 8,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 2,
  },

  // Params strip
  paramsStrip: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginBottom: 8, paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: RPT.rowEven,
    borderWidth: 0.8, borderColor: RPT.rule,
    borderLeftWidth: 3, borderLeftColor: RPT.accent,
    borderRadius: 1,
  },
  param: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginRight: 14, marginBottom: 1 },
  paramKey: { fontSize: 6.6, color: RPT.muted, fontFamily: FONT, letterSpacing: 0.4, fontWeight: 600 },
  paramVal: { fontSize: 8, color: RPT.accent, fontWeight: 600, fontFamily: FONT },

  // Summary stat cards
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, borderLeftWidth: 3, borderLeftColor: RPT.accent,
    backgroundColor: RPT.tint, padding: '6 8', borderRadius: 2,
    alignItems: 'center',
  },
  statLabel: { fontSize: 7, color: RPT.muted, fontFamily: FONT, marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: 700, fontFamily: FONT, color: RPT.accent },
  statValueGreen: { color: '#1a6b3c' },

  // Section heading
  sectionHead: {
    fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: FONT,
    backgroundColor: RPT.accentLight,
    paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 4, marginBottom: 0,
    letterSpacing: 0.4,
  },

  // Table
  tableOuter: { borderWidth: 1, borderColor: RPT.accent },
  tableHeader: { flexDirection: 'row', backgroundColor: RPT.accent },
  tableRowEven: { flexDirection: 'row', backgroundColor: RPT.paper },
  tableRowOdd:  { flexDirection: 'row', backgroundColor: RPT.rowEven },
  cellHdr: {
    paddingVertical: 4, paddingHorizontal: 6,
    fontSize: 7.5, fontWeight: 700, color: '#fff', fontFamily: FONT,
    borderRightWidth: 0.6, borderRightColor: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.2,
  },
  cell: {
    paddingVertical: 3.5, paddingHorizontal: 6,
    fontSize: 8.5, fontFamily: FONT, color: RPT.ink,
    borderRightWidth: 0.6, borderRightColor: RPT.rule,
    borderBottomWidth: 0.8, borderBottomColor: RPT.rule,
  },
  cellBold: { fontWeight: 700, color: RPT.accent },

  // Total band
  totalBand: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: RPT.tint,
    borderWidth: 1, borderTopWidth: 0, borderColor: RPT.accent,
    paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 10,
  },
  totalLabel: { fontSize: 8.5, fontWeight: 700, fontFamily: FONT, color: RPT.accent },

  // Two-col layout for side-by-side tables
  twoCol: { flexDirection: 'row', gap: 10 },
  colLeft: { flex: 2 },
  colRight: { flex: 3 },
});

// ── Simple Table ───────────────────────────────────────────────────────────────
function SimpleTable({ cols, rows, total }: {
  cols: { key: string; label: string; flex: number; align?: 'right' | 'left' }[];
  rows: Record<string, any>[];
  total?: Record<string, any>;
}) {
  return (
    <View style={s.tableOuter}>
      <View style={s.tableHeader}>
        {cols.map((c, i) => (
          <Text key={i} style={[s.cellHdr, { flex: c.flex, textAlign: c.align || 'left' }]}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={ri % 2 === 0 ? s.tableRowEven : s.tableRowOdd} wrap={false}>
          {cols.map((c, ci) => (
            <Text key={ci} style={[s.cell, { flex: c.flex, textAlign: c.align || 'left' }, ci === 0 ? s.cellBold : {}]}>
              {row[c.key] ?? '—'}
            </Text>
          ))}
        </View>
      ))}
      {total && (
        <View style={[s.tableRowEven, { backgroundColor: RPT.tint }]} wrap={false}>
          {cols.map((c, ci) => (
            <Text key={ci} style={[s.cell, s.cellBold, { flex: c.flex, textAlign: c.align || 'left' }]}>
              {total[c.key] ?? ''}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ── PDF Document ───────────────────────────────────────────────────────────────
export function FeeSummaryPDF({
  totalCollected, count, byMode, byUnit, unitNames,
  sanstha, unit, userName, academicYearLabel, filters, logoDataUrl,
}: FeeSummaryProps) {
  registerFonts();

  const now = dayjs().format('DD/MM/YYYY HH:mm');
  const avg = count > 0 ? Math.round(totalCollected / count) : 0;

  const modeRows = Object.entries(byMode)
    .filter(([, amt]) => Number(amt) > 0)
    .map(([mode, amt]) => ({
      mode: PAY_MODE_LABEL[mode] || mode,
      amt: fmt(Number(amt)),
      _raw: Number(amt),
    }));
  const modeTotal = modeRows.reduce((s, r) => s + r._raw, 0);

  const unitRows = Object.entries(byUnit)
    .filter(([, amt]) => Number(amt) > 0)
    .map(([uid, amt]) => ({
      name: unitNames[uid] || uid,
      amt: fmt(Number(amt)),
      _raw: Number(amt),
    }));
  const unitTotal = unitRows.reduce((s, r) => s + r._raw, 0);

  const MODE_COLS = [
    { key: 'mode', label: 'पद्धत',       flex: 3 },
    { key: 'amt',  label: 'रक्कम',       flex: 2, align: 'right' as const },
  ];
  const UNIT_COLS = [
    { key: 'name', label: 'शाळा',        flex: 4 },
    { key: 'amt',  label: 'संकलन',       flex: 2, align: 'right' as const },
  ];

  return (
    <Document title="शुल्क संकलन सारांश" author={sanstha?.nameMr || 'VidyaSetu'}>
      <Page size="A4" style={base.page}>

        <BrandHeader sanstha={sanstha} unit={unit} variant="report" logoDataUrl={logoDataUrl} />

        {/* Title bar */}
        <View style={s.titlebar}>
          <Text style={s.titleText}>शुल्क संकलन सारांश</Text>
          <Text style={s.dateBadge}>दिनांक {now}</Text>
        </View>

        {/* Filter strip */}
        {(filters && filters.length > 0) && (
          <View style={s.paramsStrip}>
            {academicYearLabel && (
              <View style={s.param}>
                <Text style={s.paramKey}>शैक्षणिक वर्ष</Text>
                <Text style={s.paramVal}>{academicYearLabel}</Text>
              </View>
            )}
            {filters.map((f, i) => (
              <View key={i} style={s.param}>
                <Text style={s.paramKey}>{f.label}</Text>
                <Text style={s.paramVal}>{f.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary stat cards */}
        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>एकूण संकलन</Text>
            <Text style={[s.statValue, s.statValueGreen]}>{fmt(totalCollected)}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>एकूण पावत्या</Text>
            <Text style={s.statValue}>{count}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>सरासरी / पावती</Text>
            <Text style={s.statValue}>{fmt(avg)}</Text>
          </View>
        </View>

        {/* Two-column tables */}
        <View style={s.twoCol}>
          {/* Left: mode-wise */}
          <View style={s.colLeft}>
            <Text style={s.sectionHead}>पद्धतनिहाय संकलन</Text>
            <SimpleTable
              cols={MODE_COLS}
              rows={modeRows}
              total={{ mode: 'एकूण', amt: fmt(modeTotal) }}
            />
          </View>

          {/* Right: unit-wise */}
          <View style={s.colRight}>
            <Text style={s.sectionHead}>शाळानिहाय संकलन</Text>
            <SimpleTable
              cols={UNIT_COLS}
              rows={unitRows}
              total={{ name: 'एकूण', amt: fmt(unitTotal) }}
            />
          </View>
        </View>

        <BrandFooter variant="report" />
        <AuditFooter userName={userName} />
        <PageNumber />
      </Page>
    </Document>
  );
}

// ── Download helper ────────────────────────────────────────────────────────────
export async function downloadFeeSummary(props: FeeSummaryProps): Promise<void> {
  registerFonts();
  const logoDataUrl = await loadLogoAsDataUrl(props.sanstha?.logoUrl);
  const blob = await pdf(<FeeSummaryPDF {...props} logoDataUrl={logoDataUrl} />).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
