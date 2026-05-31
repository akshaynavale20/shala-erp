/**
 * BrandFooter — Signature row + seal box + "computer-generated" note
 *
 * variant="cert"   → navy/gold style for certificates
 * variant="report" → indigo style for reports/slips
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { CERT, RPT, FONT } from '../theme';

interface Sig { label: string; sub?: string; isSeal?: boolean }

interface Props {
  signatures?: Sig[];
  variant?: 'cert' | 'report';
  note?: string;
}

const s = StyleSheet.create({
  // ── Report variant ─────────────────────────────────────────────────────
  rptRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 4 },
  rptBox: { alignItems: 'center', minWidth: 90 },
  rptLine: { borderTopWidth: 1, borderTopColor: RPT.ink, width: 90, marginBottom: 4 },
  rptLabel: { fontSize: 8.5, color: RPT.ink, fontFamily: FONT, textAlign: 'center' },
  rptSub:   { fontSize: 7, color: RPT.muted, fontFamily: FONT, textAlign: 'center', marginTop: 1 },
  rptSeal: {
    width: 64, height: 58, borderRadius: 32,
    borderWidth: 1.5, borderColor: RPT.ruleStrong,
    borderStyle: 'dashed' as any,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  rptSealText: { fontSize: 7, color: RPT.muted, fontFamily: FONT },
  rptNote: {
    marginTop: 8, paddingTop: 5,
    borderTopWidth: 0.5, borderTopColor: RPT.rule,
    flexDirection: 'row', justifyContent: 'space-between',
    fontSize: 6.8, color: RPT.muted, fontFamily: FONT,
  },

  // ── Certificate variant ────────────────────────────────────────────────
  certRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 4 },
  certBox: { alignItems: 'center', minWidth: 90 },
  certLine: { borderTopWidth: 1, borderTopColor: CERT.navy, width: 90, marginBottom: 4 },
  certLabel: { fontSize: 9, fontWeight: 700, color: CERT.navy, fontFamily: FONT, textAlign: 'center' },
  certSub:   { fontSize: 7, color: CERT.inkSoft, fontFamily: FONT, textAlign: 'center', marginTop: 1 },
  certSeal: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 1.5, borderColor: CERT.gold,
    borderStyle: 'dashed' as any,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  certSealText: { fontSize: 7, color: CERT.gold, fontFamily: FONT },
  certNote: {
    marginTop: 6, fontSize: 7, color: CERT.inkSoft, fontFamily: FONT,
    textAlign: 'center', letterSpacing: 0.3,
  },
});

const DEFAULT_CERT_SIGS: Sig[] = [
  { label: 'तयार करणार', sub: 'लिपिक / कारकून' },
  { label: 'शाळेचा शिक्का', isSeal: true },
  { label: 'मुख्याध्यापक', sub: 'सही व शिक्का' },
];

const DEFAULT_RPT_SIGS: Sig[] = [
  { label: 'संस्थेचा शिक्का', isSeal: true },
  { label: 'मुख्याध्यापक / प्राचार्य' },
];

export default function BrandFooter({
  signatures,
  variant = 'report',
  note,
}: Props) {
  const sigs = signatures ?? (variant === 'cert' ? DEFAULT_CERT_SIGS : DEFAULT_RPT_SIGS);
  const defaultNote = 'हे प्रमाणपत्र / दस्तऐवज संगणकीय प्रणालीद्वारे तयार करण्यात आले आहे.';

  if (variant === 'cert') {
    return (
      <>
        <View style={s.certRow}>
          {sigs.map((sig, i) => (
            <View key={i} style={s.certBox}>
              {sig.isSeal ? (
                <View style={s.certSeal}><Text style={s.certSealText}>शिक्का</Text></View>
              ) : (
                <View style={s.certLine} />
              )}
              <Text style={s.certLabel}>{sig.label}</Text>
              {sig.sub && <Text style={s.certSub}>{sig.sub}</Text>}
            </View>
          ))}
        </View>
        <Text style={s.certNote}>{note || defaultNote}</Text>
      </>
    );
  }

  return (
    <>
      <View style={s.rptRow}>
        {sigs.map((sig, i) => (
          <View key={i} style={s.rptBox}>
            {sig.isSeal ? (
              <View style={s.rptSeal}><Text style={s.rptSealText}>शिक्का</Text></View>
            ) : (
              <View style={s.rptLine} />
            )}
            <Text style={s.rptLabel}>{sig.label}</Text>
            {sig.sub && <Text style={s.rptSub}>{sig.sub}</Text>}
          </View>
        ))}
      </View>
      <View style={s.rptNote}>
        <Text>{note || defaultNote}</Text>
      </View>
    </>
  );
}
