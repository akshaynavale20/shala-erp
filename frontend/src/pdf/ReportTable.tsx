/**
 * ReportTable.tsx — Direction 3: "Modern Gazette" (gr_register.html design)
 * Generic rich report PDF for all 14 report types.
 *
 * Upgraded to match gr_register.html visual vocabulary:
 *  • 3-col branded letterhead (via BrandHeader "report" variant)
 *  • Double rule separator (in BrandHeader)
 *  • Title bar: serif title (left) + solid count badge (right)
 *  • Parameters strip: left-bordered tint box with k/v pairs (.params)
 *  • Table: accent header, zebra rows (f0f0f0), accent GR-style first col
 *  • Total band: styled band below table with count label
 *  • Laser-safe colours (RPT tokens already updated)
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

export interface ColDef {
  key: string;
  header: string;
  width?: number;       // flex weight, default 1
  align?: 'left' | 'right' | 'center';
  bold?: boolean;
  color?: string;
}

export interface ReportTableProps {
  title: string;
  subtitle?: string;
  cols: ColDef[];
  rows: Record<string, any>[];
  sanstha?: any;
  unit?: any;
  userName?: string;
  summary?: { label: string; value: string; color?: string }[];
  filters?: { label: string; value: string }[];
  footerNote?: string;
  pageSize?: 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
  logoDataUrl?: string;
}

function fmt(v: any): string {
  if (v === null || v === undefined) return '—';
  return String(v);
}

const s = StyleSheet.create({
  // ── Title bar  (matches .titlebar + .doctitle + .countpill) ──────────────
  titlebar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: 6, marginBottom: 5,
  },
  titleBlock: { flex: 1 },
  // Serif title — matches .doctitle .t  (Noto Serif / FONT_SERIF)
  titleText: {
    fontSize: 15, fontWeight: 700, color: RPT.accent,
    fontFamily: FONT, lineHeight: 1,
  },
  subtitleText: {
    fontSize: 7.5, color: RPT.muted, fontFamily: FONT,
    letterSpacing: 1.0, marginTop: 2,
  },
  // Count badge — solid accent bg, white text  (.countpill .badge)
  countBadge: {
    backgroundColor: RPT.accent, color: '#fff',
    fontWeight: 700, fontFamily: FONT,
    fontSize: 9, paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 2,
  },
  countDate: { fontSize: 7, color: RPT.inkSoft, fontFamily: FONT, textAlign: 'right', marginTop: 2 },

  // ── Parameters strip  (matches .params — left-accent border) ─────────────
  paramsStrip: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 0,
    marginBottom: 6, paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: RPT.rowEven,           // very light gray (laser-safe)
    borderWidth: 0.8, borderColor: RPT.rule,
    borderLeftWidth: 3, borderLeftColor: RPT.accent,
    borderRadius: 1,
  },
  param: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginRight: 14, marginBottom: 1 },
  paramKey: {
    fontSize: 6.6, color: RPT.muted, fontFamily: FONT,
    letterSpacing: 0.4, fontWeight: 600,
    textTransform: 'uppercase' as any,
  },
  paramVal: { fontSize: 8, color: RPT.ink, fontFamily: FONT },
  paramValAccent: { fontSize: 8, color: RPT.accent, fontWeight: 600, fontFamily: FONT },

  // ── Summary cards ─────────────────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  summaryCard: {
    flex: 1,
    borderLeftWidth: 3, borderLeftColor: RPT.accentLight,
    backgroundColor: RPT.tint,
    padding: '5 7', borderRadius: 2,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 7, color: RPT.muted, fontFamily: FONT, letterSpacing: 0.4, marginBottom: 1 },
  summaryValue: { fontSize: 13, fontWeight: 700, fontFamily: FONT },

  // ── Table  (matches table.reg in HTML design) ─────────────────────────────
  tableWrap: { marginBottom: 0 },
  tableOuter: {
    borderWidth: 1, borderColor: RPT.accent,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: RPT.accent,
  },
  tableRowEven: { flexDirection: 'row', backgroundColor: RPT.paper },
  tableRowOdd:  { flexDirection: 'row', backgroundColor: RPT.rowEven },

  cellHdr: {
    paddingVertical: 5, paddingHorizontal: 5,
    fontSize: 7.8, fontWeight: 700, color: '#fff', fontFamily: FONT,
    letterSpacing: 0.2, lineHeight: 1.1,
    borderRightWidth: 0.6, borderRightColor: 'rgba(255,255,255,0.22)',
  },
  cell: {
    paddingVertical: 3.5, paddingHorizontal: 5,
    fontSize: 8.5, fontFamily: FONT, color: RPT.ink,
    borderRightWidth: 0.6, borderRightColor: RPT.rule,
    borderBottomWidth: 0.8, borderBottomColor: RPT.rule,
    lineHeight: 1.2,
  },
  // first-column accent style for GR no / serial (.gr class)
  cellAccent: { fontWeight: 700, color: RPT.accent },

  // ── Total band  (matches .totalband — below table, accent border) ─────────
  totalBand: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: RPT.tint,
    borderWidth: 1, borderTopWidth: 0, borderColor: RPT.accent,
    paddingHorizontal: 8, paddingVertical: 4,
    marginBottom: 8,
  },
  totalLabel: { fontSize: 9, fontWeight: 700, fontFamily: FONT, color: RPT.accent },
  totalCount: { color: RPT.accent, fontWeight: 700 },

  noData: { color: RPT.muted, fontFamily: FONT, textAlign: 'center', marginTop: 20, fontSize: 10 },
  footerNote: {
    fontSize: 7.5, color: RPT.muted, fontFamily: FONT,
    marginTop: 4, fontStyle: 'italic' as any,
  },
});

export function ReportTablePDF({
  title, subtitle, cols, rows, sanstha, unit, userName,
  summary, filters, footerNote, pageSize = 'A4', orientation = 'portrait', logoDataUrl,
}: ReportTableProps) {
  registerFonts();

  const pageStyle = orientation === 'landscape'
    ? { ...base.page, paddingTop: '10mm', paddingBottom: '14mm' }
    : base.page;

  const now = dayjs().format('DD/MM/YYYY  HH:mm');

  return (
    <Document title={title} author={sanstha?.nameMr || 'VidyaSetu'} subject="ERP Report">
      <Page size={pageSize} orientation={orientation} style={pageStyle}>
        {/* 3-col branded letterhead + double rule (BrandHeader "report" variant) */}
        <BrandHeader sanstha={sanstha} unit={unit} variant="report" logoDataUrl={logoDataUrl} />

        {/* Title bar — serif title (left) + solid count badge (right) */}
        <View style={s.titlebar}>
          <View style={s.titleBlock}>
            <Text style={s.titleText}>{title}</Text>
            {subtitle && <Text style={s.subtitleText}>{subtitle}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.countBadge}>एकूण {rows.length} नोंदी</Text>
            <Text style={s.countDate}>दिनांक {now}</Text>
          </View>
        </View>

        {/* Parameters strip — left-accent bordered, k/v pairs (.params) */}
        {filters && filters.length > 0 && (
          <View style={s.paramsStrip}>
            {filters.map((f, i) => (
              <View key={i} style={s.param}>
                <Text style={s.paramKey}>{f.label}</Text>
                <Text style={i === 0 ? s.paramValAccent : s.paramVal}>{f.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary cards */}
        {summary && summary.length > 0 && (
          <View style={s.summaryRow}>
            {summary.map((sm, i) => (
              <View key={i} style={[s.summaryCard, { borderLeftColor: sm.color || RPT.accentLight }]}>
                <Text style={s.summaryLabel}>{sm.label}</Text>
                <Text style={[s.summaryValue, { color: sm.color || RPT.accent }]}>{sm.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Table — accent header, zebra rows, accent first-col */}
        {rows.length > 0 ? (
          <View style={s.tableWrap}>
            <View style={s.tableOuter}>
              <View style={s.tableHeader} fixed>
                {cols.map((c, ci) => (
                  <Text
                    key={ci}
                    style={[s.cellHdr, { flex: c.width ?? 1, textAlign: c.align ?? 'left' }]}
                  >
                    {c.header}
                  </Text>
                ))}
              </View>

              {rows.map((row, ri) => (
                <View key={ri} style={ri % 2 === 0 ? s.tableRowEven : s.tableRowOdd} wrap={false}>
                  {cols.map((c, ci) => (
                    <Text
                      key={ci}
                      style={[
                        s.cell,
                        { flex: c.width ?? 1, textAlign: c.align ?? 'left' },
                        // first column gets accent bold treatment (GR/serial number)
                        ci === 0 ? s.cellAccent : {},
                        c.bold  ? { fontWeight: 700 } : {},
                        c.color ? { color: c.color }  : {},
                      ]}
                    >
                      {fmt(row[c.key])}
                    </Text>
                  ))}
                </View>
              ))}
            </View>

            {/* Total band below table (.totalband) */}
            <View style={s.totalBand}>
              <Text style={s.totalLabel}>
                एकूण नोंदी: <Text style={s.totalCount}>{rows.length}</Text>
              </Text>
              <Text style={{ fontSize: 7, color: RPT.muted, fontFamily: FONT }}>
                — : माहिती उपलब्ध नाही
              </Text>
            </View>
          </View>
        ) : (
          <Text style={s.noData}>कोणताही डेटा उपलब्ध नाही</Text>
        )}

        {footerNote && <Text style={s.footerNote}>* {footerNote}</Text>}

        <BrandFooter variant="report" />
        <AuditFooter userName={userName} />
        <PageNumber />
      </Page>
    </Document>
  );
}

export async function downloadReportPDF(props: ReportTableProps): Promise<void> {
  registerFonts();
  const logoDataUrl = await loadLogoAsDataUrl(props.sanstha?.logoUrl);
  const blob = await pdf(<ReportTablePDF {...props} logoDataUrl={logoDataUrl} />).toBlob();
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
