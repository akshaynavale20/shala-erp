/**
 * FeeReceipt.tsx — fee_receipt_d3.html exact implementation
 *
 * Two copies per A4 page: कार्यालय प्रत + विद्यार्थी प्रत (✂ cut line between)
 *
 * Per-copy layout:
 *   15mm indigo rail  |  Body (flex:1)
 *                     |    head      : compact school branding
 *                     |    topbar    : title + copy tag + receipt#/date
 *                     |    studentbar: 4-col grid (name/class/roll/GR)
 *                     |    grid2     : fee table (1.32fr) + payment kv (1fr)
 *                     |    spacer    : flex:1 — pushes footer to bottom
 *                     |    foot      : declaration + tamper + seal + 2 sigs
 *                     |    issued    : computer-generated notice strip
 */
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { registerFonts } from './fonts';
import { generateQrDataUrl, receiptVerifyUrl } from './qr';
import { loadLogoAsDataUrl } from './logoLoader';

// Mukta: tighter ascender/descender metrics than Noto — no line-overlap at compact sizes
const MK = 'Mukta';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Design tokens (mirrors CSS :root vars) ──────────────────────────────────
const C = {
  paper:       '#ffffff',
  ink:         '#15181f',
  inkSoft:     '#5b626f',
  muted:       '#8b94a3',
  accent:      '#1a1a2e',   // near-black navy → dark gray on laser ✓
  accent2:     '#2d3748',   // dark slate
  tint:        '#e4e4e4',   // clear gray (was blue near-white)
  rule:        '#c0c0c0',   // visible gray border
  ruleStrong:  '#888888',   // strong gray border
};

// ── Props ───────────────────────────────────────────────────────────────────
export interface FeeReceiptProps {
  payment: {
    receiptNumber: string;
    paymentDate: string;
    paymentMode: string;
    totalAmount: number;
    txnRef?: string;
    balanceDue?: number;
    academicYear?: string;
    amountInWords?: string;
    issuePlace?: string;
    remarks?: string;
    chequeNumber?: string;
    bankNameMr?: string;
  };
  student: {
    nameMr: string;
    fatherNameMr?: string;
    grNo?: string;
    rollNumber?: string;
    className?: string;
    division?: string;
  };
  demands: {
    feeHead: string;
    installmentLabel?: string;
    netAmount: number;
    concession?: number;
    paidNow: number;
  }[];
  sanstha?: any;
  unit?: any;
  userName?: string;
  qrDataUrl?: string;
  logoDataUrl?: string;   // pre-fetched base64 — avoids react-pdf cross-origin fetch
  isDuplicate?: boolean;  // true → show DUPLICATE / प्रत diagonal stamp
}

const MODE_LABELS: Record<string, string> = {
  cash: 'रोख', cheque: 'धनादेश', neft: 'NEFT / RTGS',
  upi: 'UPI', online: 'ऑनलाइन',
};

function fmt(n: number) {
  return `₹ ${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page: A4, no outer padding — copies fill it
  page: {
    backgroundColor: C.paper,
    fontFamily: MK,
    fontSize: 8.5,
    color: C.ink,
    flexDirection: 'column',
  },

  // ── DUPLICATE corner badge (top-right, clearly visible) ─────────────────
  duplicateWrap: {
    position: 'absolute',
    top: '6mm',
    right: '6mm',
    zIndex: 10,
  },
  duplicateText: {
    backgroundColor: '#cc0000',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 700,
    fontFamily: MK,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    letterSpacing: 1.5,
  },

  // ── Cut line between copies ───────────────────────────────────────────────
  cutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: '10mm',
    paddingVertical: 2,
  },
  cutRule: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: C.ruleStrong,
    borderStyle: 'dashed' as any,
  },
  cutLabel: {
    fontSize: 5.5, letterSpacing: 1.5, color: C.muted, fontFamily: MK,
    paddingHorizontal: 3, textAlign: 'center',
  },

  // ── Receipt ───────────────────────────────────────────────────────────────
  copy: {
    flexDirection: 'row',
    flex: 1,
  },

  // ── Left rail (15mm, indigo) ──────────────────────────────────────────────
  rail: {
    width: '13mm',
    backgroundColor: C.accent,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '4mm',
  },
  railTitleWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1.5,
  },
  railWord: {
    fontSize: 8.5, fontWeight: 700, fontFamily: MK,
    color: 'rgba(255,255,255,0.92)', textAlign: 'center', letterSpacing: 0.3,
  },
  railQr: {
    width: '13mm', height: '13mm',
    backgroundColor: '#fff', borderRadius: 2,
    padding: 1,
  },
  railQrText: { fontSize: 5.5, color: C.accent, fontFamily: MK, textAlign: 'center' },
  railBadge: {
    fontSize: 5, letterSpacing: 1.2, color: 'rgba(255,255,255,0.7)',
    fontFamily: MK, textAlign: 'center',
  },

  // ── Body ─────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingTop: '2.5mm',
    paddingHorizontal: '6mm',
    paddingBottom: '2mm',
    flexDirection: 'column',
    justifyContent: 'space-between', // top block ↕ footer block — no flex-spacer needed
  },
  bodyTop:  { flexDirection: 'column' },
  bodyFoot: { flexDirection: 'column' },

  // ── Head (school branding) — centered ────────────────────────────────────
  head: { alignItems: 'center', flexDirection: 'column' },
  crest: { width: '11mm', height: '11mm', objectFit: 'contain', marginBottom: 3 },
  crestPlaceholder: {
    width: '11mm', height: '11mm', borderRadius: 15,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: 3,
  },
  crestPlaceholderText: { fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: MK },
  headText: { alignItems: 'center' },
  schoolName: {
    fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: MK,
    lineHeight: 1.25, textAlign: 'center',
  },
  addr: { fontSize: 6.5, color: C.inkSoft, fontFamily: MK, marginTop: 1, textAlign: 'center' },
  ids:  { fontSize: 6, color: C.muted, fontFamily: MK, marginTop: 0.5, lineHeight: 1.4, textAlign: 'center' },
  idsB: { fontWeight: 700, color: C.inkSoft },
  // decorative divider: line · dot · line
  headDivider: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginBottom: 1 },
  headDivLine: { flex: 1, borderTopWidth: 1.5, borderTopColor: C.accent },
  headDivDot:  { width: 4, height: 4, backgroundColor: C.accent },

  // ── Topbar ────────────────────────────────────────────────────────────────
  topbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: '1.5mm', paddingBottom: '1.5mm',
    borderBottomWidth: 1, borderBottomColor: C.rule,
  },
  doctitle: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  doctitleT: {
    fontSize: 13, fontWeight: 700, color: C.accent,
    fontFamily: MK, lineHeight: 1.2,
  },
  doctitleSub: {
    fontSize: 6, color: C.muted, fontFamily: MK, letterSpacing: 1.5,
    paddingBottom: 1,
  },
  copytag: {
    backgroundColor: C.tint, paddingHorizontal: '2mm', paddingVertical: '0.5mm',
    borderRadius: 2,
  },
  copytagText: { fontSize: 6, fontWeight: 700, color: C.accent, fontFamily: MK },
  metaRight: { alignItems: 'flex-end', gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLine: { fontSize: 6.5, color: C.inkSoft, fontFamily: MK, lineHeight: 1.55 },
  metaB: { fontWeight: 700, color: C.ink, fontSize: 6.5, fontFamily: MK },
  metaPill: {
    backgroundColor: C.tint, borderRadius: 2,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  metaPillText: { fontSize: 6.5, fontWeight: 700, color: C.accent, fontFamily: MK },

  // ── Student bar (4 columns) ───────────────────────────────────────────────
  studentbar: {
    flexDirection: 'row',
    paddingVertical: '1.5mm',
    borderBottomWidth: 1, borderBottomColor: C.rule,
    gap: 8,
  },
  sb: { flexDirection: 'column', gap: 1 },
  sbK: { fontSize: 6, color: C.muted, fontFamily: MK, letterSpacing: 0.3 },
  sbV: { fontSize: 9, color: C.ink, fontFamily: MK, lineHeight: 1.3 },
  sbAccent: { color: C.accent, fontWeight: 700 },

  // ── 2-column grid ─────────────────────────────────────────────────────────
  grid2: { flexDirection: 'row', gap: 12, marginTop: '2mm' },

  // ── Fee table (left column) ───────────────────────────────────────────────
  sectionCap: {
    fontSize: 6, letterSpacing: 1.2, color: C.muted, fontFamily: MK,
    marginBottom: '1.2mm',
  },
  feeHdr: {
    flexDirection: 'row',
    borderBottomWidth: 1.4, borderBottomColor: C.ruleStrong,
    paddingBottom: '1.2mm', marginBottom: 0,
  },
  feeTh: { fontSize: 6, color: C.muted, fontFamily: MK, letterSpacing: 0.3 },
  feeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: C.rule,
    paddingVertical: '1.2mm',
  },
  feeTd: { fontSize: 8, color: C.ink, fontFamily: MK, lineHeight: 1.25 },
  feeTdNo: { fontSize: 6.8, color: C.muted, fontFamily: MK, textAlign: 'center' },
  feeTdRight: { textAlign: 'right' },
  feeTotal: {
    flexDirection: 'row',
    borderTopWidth: 1.6, borderTopColor: C.accent,
    paddingTop: '1.8mm', marginTop: 0,
  },
  feeTotalLbl: {
    fontSize: 9.5, fontWeight: 700, color: C.accent, fontFamily: MK,
  },
  feeTotalAmt: {
    fontSize: 9.5, fontWeight: 700, color: C.accent, fontFamily: MK,
    textAlign: 'right',
  },

  // ── Right side: payment kv + amount box ───────────────────────────────────
  kv: {
    flexDirection: 'column', gap: 0.5,
    paddingVertical: '0.6mm',
    borderBottomWidth: 1, borderBottomColor: C.rule,
  },
  kvLast: {
    flexDirection: 'column', gap: 0.5, paddingVertical: '0.6mm',
  },
  kvK: { fontSize: 6, color: C.muted, fontFamily: MK, letterSpacing: 0.3 },
  kvV: { fontSize: 8.5, color: C.ink, fontFamily: MK, lineHeight: 1.3 },
  kvAccent: { color: C.accent, fontWeight: 700 },
  amtbox: {
    backgroundColor: C.tint, borderLeftWidth: 3, borderLeftColor: C.accent,
    paddingHorizontal: '3mm', paddingVertical: '1.6mm', marginTop: '2mm',
  },
  amtWords: { fontSize: 8.5, color: C.ink, fontFamily: MK, lineHeight: 1.3 },

  // ── Footer ────────────────────────────────────────────────────────────────
  foot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    gap: 10, paddingTop: '1.5mm',
  },
  declare: {
    fontSize: 6.5, lineHeight: 1.4, color: C.inkSoft, fontFamily: MK,
  },
  declareB: { fontWeight: 700, color: C.ink },
  tamper: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: '1mm',
  },
  tamperDot: {
    width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: C.accent,
  },
  tamperText: { fontSize: 6.5, color: C.inkSoft, fontFamily: MK },
  signrow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  sealWrap: { alignItems: 'center' },
  sealCircle: {
    width: '13mm', height: '13mm', borderRadius: 18,
    borderWidth: 1.5, borderColor: C.ruleStrong,
    borderStyle: 'dashed' as any,
    alignItems: 'center', justifyContent: 'center',
  },
  sealText: { fontSize: 5.5, color: C.muted, fontFamily: MK },
  sealCap: { fontSize: 5, color: C.muted, fontFamily: MK, marginTop: 2, textAlign: 'center' },
  sign: { alignItems: 'center', minWidth: '22mm' },
  signLine: {
    borderTopWidth: 1.1, borderTopColor: C.ink,
    width: '22mm', paddingTop: '1mm',
    fontSize: 7.5, fontWeight: 700, color: C.ink, fontFamily: MK, textAlign: 'center',
  },
  signSub: { fontSize: 5.5, color: C.muted, fontFamily: MK, marginTop: 1, textAlign: 'center' },

  // ── Issued strip ──────────────────────────────────────────────────────────
  issued: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: '1mm', paddingTop: '1mm',
    borderTopWidth: 1, borderTopColor: C.rule,
    fontSize: 5.5, color: C.muted, fontFamily: MK, letterSpacing: 0.3,
  },
});

// ── KV pair helper ──────────────────────────────────────────────────────────
function KV({ k, v, accent, last }: { k: string; v: string; accent?: boolean; last?: boolean }) {
  return (
    <View style={last ? s.kvLast : s.kv}>
      <Text style={s.kvK}>{k.toUpperCase()}</Text>
      <Text style={[s.kvV, accent ? s.kvAccent : {}]}>{v}</Text>
    </View>
  );
}

// ── One receipt copy ────────────────────────────────────────────────────────
interface CopyProps extends FeeReceiptProps {
  copyTag: string;
}

function CopySection({ copyTag, payment, student, demands, sanstha, unit, qrDataUrl, logoDataUrl }: CopyProps) {
  // Prefer pre-fetched base64 data URL; fall back to constructed URL only if not provided
  const logoUrl = logoDataUrl
    ?? (sanstha?.logoUrl ? `${API_BASE}${sanstha.logoUrl}` : null);
  const initial = sanstha?.nameMr?.charAt(0) || 'श';
  const modeLabel = MODE_LABELS[payment.paymentMode] || payment.paymentMode || '—';

  const addrParts: string[] = [];
  if (unit?.address) addrParts.push(unit.address);
  else if (sanstha?.addressMr) addrParts.push(sanstha.addressMr);

  const metaParts: string[] = [];
  if (unit?.udiseCode)         metaParts.push(`U-DISE: ${unit.udiseCode}`);
  if (unit?.recognitionNumber) metaParts.push(`मान्यता क्र.: ${unit.recognitionNumber}`);

  const classDiv = [student.className, student.division].filter(Boolean).join(' — ');
  const issuePlace = payment.issuePlace || unit?.city || unit?.address?.split(',')[0] || '';

  return (
    <View style={s.copy} wrap={false}>

      {/* Left rail */}
      <View style={s.rail}>
        <View style={s.railTitleWrap}>
          {['शुल्क', 'पावती'].map((w, i) => (
            <Text key={i} style={s.railWord}>{w}</Text>
          ))}
        </View>
        {qrDataUrl ? (
          <Image style={s.railQr} src={qrDataUrl} />
        ) : (
          <View style={s.railQr}>
            <Text style={s.railQrText}>QR</Text>
          </View>
        )}
        <Text style={s.railBadge}>पडताळणी</Text>
      </View>

      {/* Body */}
      <View style={s.body}>

       {/* ── Top block ── */}
       <View style={s.bodyTop}>

        {/* School head */}
        <View style={s.head}>
          {logoUrl ? (
            <Image style={s.crest} src={logoUrl} />
          ) : (
            <View style={s.crestPlaceholder}>
              <Text style={s.crestPlaceholderText}>{initial}</Text>
            </View>
          )}
          <View style={s.headText}>
            <Text style={s.schoolName}>{sanstha?.nameMr || ''}</Text>
            {unit?.nameMr && unit.nameMr !== sanstha?.nameMr && (
              <Text style={[s.addr, { fontWeight: 700, color: C.accent, textAlign: 'center' }]}>{unit.nameMr}</Text>
            )}
            {addrParts.length > 0 && <Text style={s.addr}>{addrParts.join(' | ')}</Text>}
            {metaParts.length > 0 && (
              <Text style={s.ids}>
                {metaParts.map((p, i) => (
                  <Text key={i}>{i > 0 ? '  ·  ' : ''}{p}</Text>
                ))}
              </Text>
            )}
          </View>
        </View>

        {/* Decorative divider under head */}
        <View style={s.headDivider}>
          <View style={s.headDivLine} />
          <View style={s.headDivDot} />
          <View style={s.headDivLine} />
        </View>

        {/* Topbar */}
        <View style={s.topbar}>
          <View style={s.doctitle}>
            <Text style={s.doctitleT}>शुल्क पावती</Text>
            <Text style={s.doctitleSub}>Fee Receipt</Text>
            {copyTag ? (
              <View style={s.copytag}>
                <Text style={s.copytagText}>{copyTag}</Text>
              </View>
            ) : null}
          </View>
          <View style={s.metaRight}>
            <View style={s.metaRow}>
              <Text style={s.metaLine}>पावती क्र.</Text>
              <View style={s.metaPill}>
                <Text style={s.metaPillText}>{payment.receiptNumber}</Text>
              </View>
              <Text style={s.metaLine}>दिनांक</Text>
              <Text style={s.metaB}>{dayjs(payment.paymentDate).format('DD/MM/YYYY')}</Text>
            </View>
            {payment.academicYear && (
              <View style={s.metaRow}>
                <Text style={s.metaLine}>शैक्षणिक वर्ष</Text>
                <Text style={s.metaB}>{payment.academicYear}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Student bar: 4 columns */}
        <View style={s.studentbar}>
          <View style={[s.sb, { flex: 1.6 }]}>
            <Text style={s.sbK}>विद्यार्थ्याचे नाव</Text>
            <Text style={[s.sbV, s.sbAccent]}>{student.nameMr}</Text>
          </View>
          <View style={[s.sb, { flex: 1 }]}>
            <Text style={s.sbK}>इयत्ता / तुकडी</Text>
            <Text style={s.sbV}>{classDiv || '—'}</Text>
          </View>
          <View style={[s.sb, { flex: 0.9 }]}>
            <Text style={s.sbK}>हजेरी क्र.</Text>
            <Text style={s.sbV}>{student.rollNumber || '—'}</Text>
          </View>
          <View style={[s.sb, { flex: 1.1 }]}>
            <Text style={s.sbK}>स. नों. क्र.</Text>
            <Text style={s.sbV}>{student.grNo || '—'}</Text>
          </View>
        </View>

        {/* 2-column grid: fee table | payment info */}
        <View style={s.grid2}>

          {/* Left: fee particulars table */}
          <View style={{ flex: 1.32 }}>
            <Text style={s.sectionCap}>शुल्क तपशील · Particulars</Text>
            {/* Header */}
            <View style={s.feeHdr}>
              <Text style={[s.feeTh, { width: '7mm', textAlign: 'center' }]}>अ.क्र.</Text>
              <Text style={[s.feeTh, { flex: 1 }]}>तपशील</Text>
              <Text style={[s.feeTh, { width: '18mm', textAlign: 'right' }]}>रक्कम (₹)</Text>
            </View>
            {/* Rows */}
            {demands.map((d, i) => (
              <View key={i} style={s.feeRow} wrap={false}>
                <Text style={[s.feeTdNo, { width: '7mm' }]}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.feeTd}>{d.feeHead}</Text>
                  {d.installmentLabel && (
                    <Text style={{ fontSize: 6, color: C.muted, fontFamily: MK }}>
                      {d.installmentLabel}
                    </Text>
                  )}
                </View>
                <Text style={[s.feeTd, s.feeTdRight, { width: '18mm' }]}>
                  {fmt(d.paidNow)}
                </Text>
              </View>
            ))}
            {/* Total */}
            <View style={s.feeTotal} wrap={false}>
              <View style={{ width: '7mm' }} />
              <Text style={[s.feeTotalLbl, { flex: 1 }]}>एकूण रक्कम</Text>
              <Text style={[s.feeTotalAmt, { width: '18mm' }]}>
                {fmt(payment.totalAmount)}
              </Text>
            </View>
          </View>

          {/* Right: payment details + amount in words */}
          <View style={{ flex: 1 }}>
            <Text style={s.sectionCap}>भरणा तपशील · Payment</Text>
            <KV k="भरणा पद्धत" v={modeLabel} />
            {(payment.txnRef || payment.chequeNumber) && (
              <KV k="संदर्भ / धनादेश क्र." v={payment.txnRef || payment.chequeNumber || ''} />
            )}
            {payment.bankNameMr && (
              <KV k="बँक" v={payment.bankNameMr} />
            )}
            {payment.balanceDue !== undefined ? (
              <KV k="येणे बाकी" v={fmt(payment.balanceDue)} accent last />
            ) : (
              <KV k="येणे बाकी" v="₹ ०" accent last />
            )}
            {payment.amountInWords && (
              <View style={s.amtbox}>
                <Text style={s.sectionCap}>अक्षरी रक्कम</Text>
                <Text style={s.amtWords}>{payment.amountInWords}</Text>
              </View>
            )}
          </View>

        </View>

       </View>

       {/* ── Bottom block — anchored to bottom by space-between ── */}
       <View style={s.bodyFoot}>

        {/* Footer: declaration + seal + signatures */}
        <View style={s.foot}>
          <View style={{ flex: 1 }}>
            <Text style={s.declare}>
              {'      '}वरील शुल्क शाळेच्या नोंदवहीनुसार स्वीकारण्यात आले असून ही पावती{' '}
              <Text style={s.declareB}>{issuePlace || sanstha?.nameMr || ''}</Text>
              {' '}येथे दिनांक{' '}
              <Text style={s.declareB}>{dayjs(payment.paymentDate).format('DD/MM/YYYY')}</Text>
              {' '}रोजी देण्यात आली.
            </Text>
            <View style={s.tamper}>
              <View style={s.tamperDot} />
              <Text style={s.tamperText}>
                भरलेले शुल्क परत मिळणार नाही. खाडाखोड केल्यास पावती रद्द.
              </Text>
            </View>
          </View>
          <View style={s.signrow}>
            <View style={s.sealWrap}>
              <View style={s.sealCircle}>
                <Text style={s.sealText}>शिक्का</Text>
              </View>
              <Text style={s.sealCap}>शाळेचा शिक्का</Text>
            </View>
            <View style={s.sign}>
              <Text style={s.signLine}>रोखपाल</Text>
              <Text style={s.signSub}>Cashier</Text>
            </View>
            <View style={s.sign}>
              <Text style={s.signLine}>मुख्याध्यापक</Text>
              <Text style={s.signSub}>सही व शिक्का</Text>
            </View>
          </View>
        </View>

        {/* Issued strip */}
        <View style={s.issued}>
          <Text>ही पावती विद्यार्थी सेवा प्रणालीद्वारे संगणकीय पद्धतीने तयार करण्यात आली आहे.</Text>
          <Text>पडताळणीसाठी QR स्कॅन करा</Text>
        </View>

       </View>
      </View>
    </View>
  );
}

// ── Main PDF ─────────────────────────────────────────────────────────────────
export function FeeReceiptPDF(props: FeeReceiptProps) {
  registerFonts();
  const { payment, sanstha } = props;

  return (
    <Document
      title={`शुल्क पावती — ${payment.receiptNumber}`}
      author={sanstha?.nameMr || 'VidyaSetu'}
      subject="Fee Receipt"
    >
      <Page size="A4" style={s.page}>
        <CopySection {...props} copyTag="कार्यालय प्रत" />
        <View style={s.cutWrap}>
          <View style={s.cutRule} />
          <Text style={s.cutLabel}>✂  कापा  /  CUT HERE  ✂</Text>
          <View style={s.cutRule} />
        </View>
        <CopySection {...props} copyTag="विद्यार्थी प्रत" />

        {/* DUPLICATE badge — top-right corner, clearly visible */}
        {props.isDuplicate && (
          <View style={s.duplicateWrap}>
            <Text style={s.duplicateText}>✦ DUPLICATE</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function downloadFeeReceipt(props: FeeReceiptProps): Promise<void> {
  registerFonts();

  // Pre-fetch sanstha logo + generate QR in parallel
  const [logoDataUrl, qrDataUrl] = await Promise.all([
    loadLogoAsDataUrl(props.sanstha?.logoUrl),
    generateQrDataUrl(receiptVerifyUrl(props.payment.receiptNumber)).catch(() => undefined),
  ]);

  const blob = await pdf(<FeeReceiptPDF {...props} logoDataUrl={logoDataUrl} qrDataUrl={qrDataUrl} />).toBlob();
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
