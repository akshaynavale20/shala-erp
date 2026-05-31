/**
 * BrandHeader — Reusable branded header for ERP PDF documents
 *
 * variant="cert"   → centered navy/gold formal crest (certificates)
 * variant="report" → 3-col grid letterhead (gr_register.html "Modern Gazette"):
 *                    [logo] [school name / address / meta] [QR placeholder]
 *                    followed by a double rule (2 px accent + 0.7 px lighter)
 */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { CERT, RPT, FONT, FONT_SERIF } from '../theme';

interface Props {
  sanstha?: any;
  unit?: any;
  variant?: 'cert' | 'report';
  logoDataUrl?: string;   // pre-fetched base64 — pass this instead of letting react-pdf fetch
}

const s = StyleSheet.create({
  // ═══════════════════════════════════════════════════════════════════
  // REPORT — 3-column letterhead  (matches gr_register.html)
  // ═══════════════════════════════════════════════════════════════════
  rptWrapper:  { marginBottom: 6 },

  // grid: [logo 44px] [flex text] [QR 44px]
  rptGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // left: logo circle
  rptCrestCol: { width: 44, alignItems: 'center', justifyContent: 'center' },
  logo:        { width: 40, height: 40, objectFit: 'contain' },
  rptLogoPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: RPT.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: FONT },

  // center: text
  rptTextCol: { flex: 1, minWidth: 0 },
  orgPre: {
    fontSize: 6.5, letterSpacing: 0.8, color: RPT.accentLight,
    fontWeight: 600, fontFamily: FONT, marginBottom: 1,
  },
  rptName: {
    fontSize: 15, fontWeight: 700, color: RPT.ink,
    fontFamily: FONT_SERIF, lineHeight: 1.1,
  },
  rptUnit: {
    fontSize: 9.5, fontWeight: 600, color: RPT.accent,
    fontFamily: FONT, marginTop: 1,
  },
  rptAddr: { fontSize: 8, color: RPT.inkSoft, fontFamily: FONT, marginTop: 1 },
  rptMeta: { fontSize: 7.5, color: RPT.muted,    fontFamily: FONT, marginTop: 1, lineHeight: 1.5 },

  // right: developer credit
  rptQrCol: { width: 52, alignItems: 'flex-end', justifyContent: 'flex-end' },
  rptQrBox: { display: 'none' as any },
  rptQrText: { display: 'none' as any },
  rptQrCap:  { display: 'none' as any },
  devCredit: {
    fontSize: 5.5, color: RPT.muted, fontFamily: FONT,
    textAlign: 'right', lineHeight: 1.6,
  },

  // double rule below header  (.rule-double in HTML design)
  doubleRulePrimary:   { borderTopWidth: 2,   borderTopColor: RPT.accent,      marginTop: 5 },
  doubleRuleSecondary: { borderTopWidth: 0.7, borderTopColor: RPT.accentLight, marginTop: 2 },

  // ═══════════════════════════════════════════════════════════════════
  // CERT — centered formal (unchanged)
  // ═══════════════════════════════════════════════════════════════════
  certWrapper: {
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 10,
  },
  certLogoImg: { width: 44, height: 44, objectFit: 'contain', marginBottom: 5 },
  certLogoPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: CERT.navy,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 5,
  },
  certName: {
    fontSize: 16, fontWeight: 700, color: CERT.navy,
    fontFamily: FONT_SERIF, textAlign: 'center', lineHeight: 1.2,
  },
  certUnit: {
    fontSize: 11, fontWeight: 600, color: CERT.navy,
    fontFamily: FONT, textAlign: 'center', marginTop: 2,
  },
  certAddr: {
    fontSize: 8.5, color: CERT.inkSoft, fontFamily: FONT,
    textAlign: 'center', marginTop: 2,
  },
  certMeta: {
    fontSize: 7.5, color: CERT.inkSoft, fontFamily: FONT,
    textAlign: 'center', marginTop: 1.5,
  },
  certDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 7, width: '100%',
  },
  certDivLine: { flex: 1, borderTopWidth: 0.8, borderTopColor: CERT.gold },
  certDivDot:  { width: 3, height: 3, backgroundColor: CERT.gold },
});

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function BrandHeader({ sanstha, unit, variant = 'report', logoDataUrl }: Props) {
  if (!sanstha) return null;

  const logoUrl = logoDataUrl
    ?? (sanstha.logoUrl ? `${API_BASE}${sanstha.logoUrl}` : null);
  const initial = sanstha.nameMr?.charAt(0) || 'श';

  const addrParts: string[] = [];
  if (unit?.address) addrParts.push(unit.address);
  else if (sanstha.addressMr) addrParts.push(sanstha.addressMr);
  if (sanstha.phone) addrParts.push(`दूरध्वनी: ${sanstha.phone}`);

  const metaParts: string[] = [];
  if (unit?.udiseCode)         metaParts.push(`UDISE: ${unit.udiseCode}`);
  if (unit?.recognitionNumber) metaParts.push(`मान्यता क्र.: ${unit.recognitionNumber}`);
  if (unit?.medium)            metaParts.push(`माध्यम: ${unit.medium}`);
  if (sanstha.ptrNumber)       metaParts.push(`PTR: ${sanstha.ptrNumber}`);

  const showUnit  = unit?.nameMr && unit.nameMr !== sanstha.nameMr;
  const boardName = sanstha.boardName || unit?.boardName;

  // ── Certificate variant — centered formal ─────────────────────────────────
  if (variant === 'cert') {
    return (
      <View style={s.certWrapper}>
        {logoUrl ? (
          <Image style={s.certLogoImg} src={logoUrl} />
        ) : (
          <View style={s.certLogoPlaceholder}>
            <Text style={s.logoText}>{initial}</Text>
          </View>
        )}
        <Text style={s.certName}>{sanstha.nameMr || ''}</Text>
        {showUnit && <Text style={s.certUnit}>{unit.nameMr}</Text>}
        {addrParts.length > 0 && <Text style={s.certAddr}>{addrParts.join(' | ')}</Text>}
        {metaParts.length > 0 && <Text style={s.certMeta}>{metaParts.join(' · ')}</Text>}
        <View style={s.certDivider}>
          <View style={s.certDivLine} />
          <View style={s.certDivDot} />
          <View style={s.certDivLine} />
        </View>
      </View>
    );
  }

  // ── Report variant — 3-col grid letterhead ────────────────────────────────
  return (
    <View style={s.rptWrapper}>
      <View style={s.rptGrid}>

        {/* Left: logo */}
        <View style={s.rptCrestCol}>
          {logoUrl ? (
            <Image style={s.logo} src={logoUrl} />
          ) : (
            <View style={s.rptLogoPlaceholder}>
              <Text style={s.logoText}>{initial}</Text>
            </View>
          )}
        </View>

        {/* Center: text block */}
        <View style={s.rptTextCol}>
          {boardName && <Text style={s.orgPre}>{boardName}</Text>}
          <Text style={s.rptName}>{sanstha.nameMr || ''}</Text>
          {showUnit  && <Text style={s.rptUnit}>{unit.nameMr}</Text>}
          {addrParts.length > 0 && <Text style={s.rptAddr}>{addrParts.join('  ·  ')}</Text>}
          {metaParts.length > 0 && <Text style={s.rptMeta}>{metaParts.join('  ·  ')}</Text>}
        </View>

        {/* Right: spacer (QR removed per design) */}
        <View style={s.rptQrCol} />

      </View>

      {/* Double rule — 2 px primary + 0.7 px lighter accent (matches .rule-double) */}
      <View style={s.doubleRulePrimary} />
      <View style={s.doubleRuleSecondary} />
    </View>
  );
}
