/**
 * Certificate.tsx — Direction 3: "Modern Gazette" (exact implementation)
 *
 * Layout mirrors tc_direction3.html exactly:
 *   • Indigo left rail  (24mm wide, full height, title stacked vertically, QR, badge)
 *   • Body column       (flex:1, padding 9mm 12mm 7mm)
 *     – head: 18mm crest + school text block
 *     – topbar: title + serial pills, 2px indigo border-bottom
 *     – fields: 2-column rows; uppercase muted .k labels, 11pt serif .v values
 *     – declaration: tint bg, 3px indigo border-left
 *     – tamper: dot + small text
 *     – foot: seal left + 2 signatures right
 *     – issued: tiny border-top footer
 */
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import BrandHeader from './components/BrandHeader';
import BrandFooter from './components/BrandFooter';
import AuditFooter from './components/AuditFooter';
import PageNumber from './components/PageNumber';
import { FONT, FONT_SERIF } from './theme';
import { registerFonts } from './fonts';
import { loadLogoAsDataUrl } from './logoLoader';
import { generateQrDataUrl, certVerifyUrl } from './qr';

export interface CertificateProps {
  cert: {
    certificateType: string;
    certificateNumber: string;
    issueDate: string;
    purposeMr?: string;
    remarks?: string;
    metadata?: Record<string, any>;
  };
  student: {
    nameMr?: string;
    nameEn?: string;
    fatherNameMr?: string;
    motherNameMr?: string;
    dateOfBirth?: string;
    grNo?: string;
    religion?: string;
    caste?: string;
  };
  sanstha?: any;
  unit?: any;
  userName?: string;
  logoDataUrl?: string;
  qrDataUrl?: string;
  isDuplicate?: boolean;
}

// ── Design tokens (Direction 3) ────────────────────────────────────────────
const C = {
  paper:       '#ffffff',
  ink:         '#15181f',
  inkSoft:     '#5b626f',
  muted:       '#8b94a3',
  accent:      '#1a1a2e',   // near-black navy → dark gray on laser ✓
  accent2:     '#2d3748',
  tint:        '#e0e0e0',   // visible gray for meta boxes (was blue near-white)
  rule:        '#b0b0b0',   // visible border (Certificate uses wider rules; slightly lighter than RPT)
  ruleStrong:  '#787878',
};

const CERT_TITLES: Record<string, string> = {
  bonafide:  'बोनाफाईड प्रमाणपत्र',
  leaving:   'शाळा सोडल्याचा दाखला',
  character: 'चारित्र्य प्रमाणपत्र',
  study:     'अध्ययन प्रमाणपत्र',
  migration: 'स्थलांतर प्रमाणपत्र',
  medium:    'माध्यम प्रमाणपत्र',
};
const CERT_SUBTITLES: Record<string, string> = {
  bonafide:  'BONAFIDE CERTIFICATE',
  leaving:   'TRANSFER / LEAVING CERTIFICATE',
  character: 'CHARACTER CERTIFICATE',
  study:     'STUDY CERTIFICATE',
  migration: 'MIGRATION CERTIFICATE',
  medium:    'MEDIUM CERTIFICATE',
};

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Page: flex row, no padding (rail + body fill it)
  page: {
    flexDirection: 'row',
    backgroundColor: C.paper,
    fontFamily: FONT,
    fontSize: 10,
  },

  // ── DUPLICATE corner badge (top-right, clearly visible) ─────────────────
  duplicateWrap: {
    position: 'absolute',
    top: '8mm',
    right: '8mm',
    zIndex: 10,
  },
  duplicateText: {
    backgroundColor: '#cc0000',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 700,
    fontFamily: FONT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    letterSpacing: 1.5,
  },

  // ── Left Rail ────────────────────────────────────────────────────────────
  rail: {
    width: '24mm',
    backgroundColor: C.accent,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '11mm',
    paddingHorizontal: 0,
  },
  railTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  railTitleWord: {
    fontSize: 8.5,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: FONT,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  railMiddle: {
    alignItems: 'center',
    gap: 3,
  },
  railQr: {
    width: '16mm',
    height: '16mm',
    backgroundColor: '#ffffff',
    padding: '1mm',
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railQrText: {
    fontSize: 6,
    color: C.accent,
    fontFamily: FONT,
    textAlign: 'center',
  },
  railBadge: {
    fontSize: 6,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.70)',
    fontFamily: FONT,
    textAlign: 'center',
  },

  // ── Body ─────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingTop: '9mm',
    paddingHorizontal: '12mm',
    paddingBottom: '7mm',
  },

  // ── Topbar ────────────────────────────────────────────────────────────────
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '6mm',
    paddingBottom: '3mm',
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
  },
  docTitleT: {
    fontSize: 17, fontWeight: 700, color: C.accent, fontFamily: FONT_SERIF, lineHeight: 1,
  },
  docTitleSub: {
    fontSize: 7, color: C.muted, fontFamily: FONT,
    letterSpacing: 1.2, marginTop: 3,
  },
  metaBlock: { alignItems: 'flex-end', gap: 2.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 7.5, color: C.inkSoft, fontFamily: FONT },
  pill: {
    backgroundColor: C.tint, color: C.accent, fontWeight: 700,
    fontFamily: FONT, fontSize: 7.5,
    paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 1,
  },

  // ── Field rows ────────────────────────────────────────────────────────────
  fieldsWrap: { marginTop: '5mm' },
  // Two-column row (gap simulated with paddingRight on left cell)
  frow: { flexDirection: 'row', gap: '8mm' },
  // Full-width row (grid-column: 1/-1)
  frowFull: { flexDirection: 'row' },
  // Each field item — compact vertical padding to fit TC (15 rows) on A4
  item: {
    flex: 1,
    flexDirection: 'column',
    gap: 1,
    paddingVertical: '1.2mm',
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
  },
  itemK: {
    fontSize: 7, color: C.muted, fontFamily: FONT,
    letterSpacing: 0.4, fontWeight: 700,
  },
  itemV: {
    fontSize: 10.5, color: C.ink, fontFamily: FONT_SERIF, lineHeight: 1.3,
  },
  itemVAccent: {
    fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: FONT_SERIF, lineHeight: 1.3,
  },

  // ── Declaration block ─────────────────────────────────────────────────────
  declare: {
    marginTop: '4mm',
    backgroundColor: C.tint,
    borderLeftWidth: 3, borderLeftColor: C.accent,
    padding: '3mm 4mm',
    fontSize: 9,
    lineHeight: 1.55,
    color: C.ink,
    fontFamily: FONT_SERIF,
  },
  declareB: { fontWeight: 700, color: C.accent },

  // ── Tamper line ───────────────────────────────────────────────────────────
  tamperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: '2.5mm',
  },
  tamperDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.accent,
  },
  tamperText: {
    fontSize: 7.5, color: C.inkSoft, fontFamily: FONT, flex: 1,
  },

});

// ── Helper components ───────────────────────────────────────────────────────

function FieldItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={s.item}>
      <Text style={s.itemK}>{label}</Text>
      <Text style={accent ? s.itemVAccent : s.itemV}>{value || '—'}</Text>
    </View>
  );
}

// Two-column row — wrap={false} prevents row from splitting across pages
function FRow({ left, right }: {
  left: { label: string; value: string; accent?: boolean };
  right?: { label: string; value: string; accent?: boolean };
}) {
  return (
    <View wrap={false} style={right ? s.frow : s.frowFull}>
      <FieldItem {...left} />
      {right && <FieldItem {...right} />}
    </View>
  );
}

// ── TC Field list ───────────────────────────────────────────────────────────

function TCFields({ cert, student }: Pick<CertificateProps, 'cert' | 'student'>) {
  const m = cert.metadata || {};
  return (
    <View style={s.fieldsWrap}>
      <FRow left={{ label: 'विद्यार्थ्याचे संपूर्ण नाव', value: student.nameMr || '—', accent: true }} />
      <FRow
        left={{ label: 'विद्यार्थ्याचे नाव (इंग्रजी)', value: student.nameEn || m.nameEn || '—' }}
        right={{ label: 'आईचे नाव', value: student.motherNameMr || m.motherNameMr || '—' }}
      />
      <FRow
        left={{ label: 'वडिलांचे / पालकाचे नाव', value: student.fatherNameMr || '—' }}
        right={{ label: 'राष्ट्रीयत्व', value: m.nationality || 'भारतीय' }}
      />
      <FRow
        left={{ label: 'मातृभाषा', value: m.motherTongue || 'मराठी' }}
        right={{ label: 'धर्म', value: student.religion || m.religion || '—' }}
      />
      <FRow
        left={{ label: 'जात', value: student.caste || m.caste || '—' }}
        right={{ label: 'पोटजात', value: m.subCaste || '—' }}
      />
      <FRow left={{ label: 'जन्मस्थळ (गाव, तालुका, जिल्हा, राज्य)', value: m.placeOfBirth || '—' }} />
      <FRow
        left={{ label: 'जन्मतारीख (अंकी)', value: student.dateOfBirth ? dayjs(student.dateOfBirth).format('DD/MM/YYYY') : '—', accent: true }}
        right={{ label: 'जन्मतारीख (अक्षरी)', value: m.dobInWords || '—' }}
      />
      <FRow left={{ label: 'मागील शाळा व इयत्ता', value: m.lastSchool || '—' }} />
      <FRow
        left={{ label: 'या शाळेतील प्रवेश दिनांक', value: m.admissionDate ? dayjs(m.admissionDate).format('DD/MM/YYYY') : '—' }}
        right={{ label: 'प्रवेशाची इयत्ता', value: m.admissionStd || '—' }}
      />
      <FRow
        left={{ label: 'सोडतेवेळी शिकत असलेली इयत्ता', value: m.classLastStudied || '—', accent: true }}
        right={{ label: 'शाळा सोडल्याची तारीख', value: m.leavingDate || '—' }}
      />
      <FRow
        left={{ label: 'प्रगती', value: m.progress || '—' }}
        right={{ label: 'वर्तणूक', value: m.conduct || '—' }}
      />
      <FRow
        left={{ label: 'शाळा सोडल्याचे कारण', value: m.reasonForLeaving || cert.purposeMr || '—' }}
        right={{ label: 'शेरा / अभिप्राय', value: cert.remarks || '—' }}
      />
    </View>
  );
}

// ── Bonafide Fields ─────────────────────────────────────────────────────────

function BonafideFields({ cert, student }: Pick<CertificateProps, 'cert' | 'student'>) {
  const m = cert.metadata || {};
  return (
    <View style={s.fieldsWrap}>
      <FRow left={{ label: 'विद्यार्थ्याचे संपूर्ण नाव', value: student.nameMr || '—', accent: true }} />
      <FRow
        left={{ label: 'वडिलांचे नाव', value: student.fatherNameMr || '—' }}
        right={{ label: 'आईचे नाव', value: student.motherNameMr || '—' }}
      />
      <FRow
        left={{ label: 'जन्मतारीख', value: student.dateOfBirth ? dayjs(student.dateOfBirth).format('DD/MM/YYYY') : '—', accent: true }}
        right={{ label: 'GR क्र.', value: student.grNo || '—' }}
      />
      <FRow
        left={{ label: 'इयत्ता', value: m.classLastStudied || '—', accent: true }}
        right={{ label: 'तुकडी', value: m.division || '—' }}
      />
      {m.academicYear && (
        <FRow left={{ label: 'शैक्षणिक वर्ष', value: m.academicYear }} />
      )}
    </View>
  );
}

// ── Character Fields ────────────────────────────────────────────────────────

function CharacterFields({ cert, student }: Pick<CertificateProps, 'cert' | 'student'>) {
  const m = cert.metadata || {};
  return (
    <View style={s.fieldsWrap}>
      <FRow left={{ label: 'विद्यार्थ्याचे संपूर्ण नाव', value: student.nameMr || '—', accent: true }} />
      <FRow
        left={{ label: 'वडिलांचे नाव', value: student.fatherNameMr || '—' }}
        right={{ label: 'GR क्र.', value: student.grNo || '—' }}
      />
      <FRow
        left={{ label: 'कालावधी (पासून)', value: m.fromYear || '—' }}
        right={{ label: 'कालावधी (पर्यंत)', value: m.toYear || '—' }}
      />
      <FRow
        left={{ label: 'प्रगती', value: m.progress || 'समाधानकारक' }}
        right={{ label: 'वर्तन', value: m.conduct || 'चांगले' }}
      />
    </View>
  );
}

// ── Generic Fields ──────────────────────────────────────────────────────────

function GenericFields({ cert, student }: Pick<CertificateProps, 'cert' | 'student'>) {
  const m = cert.metadata || {};
  return (
    <View style={s.fieldsWrap}>
      <FRow left={{ label: 'विद्यार्थ्याचे नाव', value: student.nameMr || '—', accent: true }} />
      <FRow
        left={{ label: 'वडिलांचे नाव', value: student.fatherNameMr || '—' }}
        right={{ label: 'GR क्र.', value: student.grNo || '—' }}
      />
      {m.classLastStudied && <FRow left={{ label: 'इयत्ता', value: m.classLastStudied }} />}
      {m.academicYear && <FRow left={{ label: 'शैक्षणिक वर्ष', value: m.academicYear }} />}
      {m.medium && <FRow left={{ label: 'शिक्षणाचे माध्यम', value: m.medium }} />}
      <FRow left={{ label: 'कारण / उद्देश', value: cert.purposeMr || '—' }} />
    </View>
  );
}

// ── Declaration text per cert type ──────────────────────────────────────────

function Declaration({
  cert, student, unit,
}: Pick<CertificateProps, 'cert' | 'student' | 'unit'>) {
  const m  = cert.metadata || {};
  const ct = cert.certificateType;

  if (ct === 'leaving') {
    return (
      <View style={s.declare}>
        <Text>
          {'        '}वर उल्लेखिलेली सर्व माहिती शाळेच्या सर्वसाधारण नोंदवहीवरून घेतली असून ती बरोबर आहे. हा दाखला{' '}
          <Text style={s.declareB}>{m.issuePlaceMr || unit?.nameMr || '—'}</Text>
          {' '}येथे दिनांक{' '}
          <Text style={s.declareB}>{dayjs(cert.issueDate).format('DD/MM/YYYY')}</Text>
          {' '}रोजी देण्यात आला.
        </Text>
      </View>
    );
  }
  if (ct === 'bonafide') {
    return (
      <View style={s.declare}>
        <Text>
          {'        '}हे प्रमाणित करण्यात येते की,{' '}
          <Text style={s.declareB}>{student.nameMr || '—'}</Text>
          {student.fatherNameMr ? `, पुत्र / कन्या ${student.fatherNameMr},` : ''}
          {' '}हे / ही या शाळेत{' '}
          <Text style={s.declareB}>{m.classLastStudied || '—'}</Text>
          {m.division ? ` तुकडी ${m.division} मध्ये` : ''}{' '}शिकत आहे / आहेत. त्यांचा जन्म दिनांक{' '}
          <Text style={s.declareB}>{student.dateOfBirth ? dayjs(student.dateOfBirth).format('DD/MM/YYYY') : '—'}</Text>
          {' '}असा आहे.
          {m.academicYear ? ` शैक्षणिक वर्ष ${m.academicYear} मध्ये ते / त्या नियमित विद्यार्थी आहेत.` : ''}
          {m.purpose ? ` हे प्रमाणपत्र ${m.purpose} साठी देण्यात येत आहे.` : ''}
        </Text>
      </View>
    );
  }
  if (ct === 'character') {
    return (
      <View style={s.declare}>
        <Text>
          {'        '}हे प्रमाणित करण्यात येते की,{' '}
          <Text style={s.declareB}>{student.nameMr || '—'}</Text>
          {student.fatherNameMr ? ` (पुत्र / कन्या श्री / श्रीमती ${student.fatherNameMr})` : ''}
          {' '}हे / ही या शाळेत{' '}
          {m.fromYear || '—'} ते {m.toYear || '—'}{' '}या कालावधीत शिकले / शिकल्या. त्यांचे वर्तन{' '}
          <Text style={s.declareB}>{m.conduct || 'चांगले'}</Text>
          {' '}असून प्रगती{' '}
          <Text style={s.declareB}>{m.progress || 'समाधानकारक'}</Text>
          {' '}होती. ते / त्या एक चांगल्या चारित्र्याचे विद्यार्थी / विद्यार्थिनी आहेत.
          {cert.purposeMr ? ` हे प्रमाणपत्र ${cert.purposeMr} साठी देण्यात येत आहे.` : ''}
        </Text>
      </View>
    );
  }
  return (
    <View style={s.declare}>
      <Text>
        हे प्रमाणित करण्यात येते की{student.nameMr ? ` ${student.nameMr}` : ''}{cert.purposeMr ? ` यांना ${cert.purposeMr} साठी हे प्रमाणपत्र देण्यात येत आहे` : ''}. दिनांक{' '}
        <Text style={s.declareB}>{dayjs(cert.issueDate).format('DD/MM/YYYY')}</Text>.
      </Text>
    </View>
  );
}

// ── Main PDF ────────────────────────────────────────────────────────────────

export function CertificatePDF({ cert, student, sanstha, unit, userName, logoDataUrl, qrDataUrl, isDuplicate }: CertificateProps) {
  registerFonts();

  const certTitle    = CERT_TITLES[cert.certificateType]    || cert.certificateType;
  const certSubtitle = CERT_SUBTITLES[cert.certificateType] || cert.certificateType.toUpperCase();

  // Rail vertical title: split into words for stacked rendering
  const railWords = certTitle.split(' ').filter(Boolean);

  return (
    <Document
      title={`${certTitle} — ${student.nameMr}`}
      author={sanstha?.nameMr || 'VidyaSetu'}
    >
      <Page size="A4" style={s.page}>

        {/* ── Left Rail ─────────────────────────────────────────────────── */}
        <View style={s.rail}>
          {/* Stacked vertical title (top) */}
          <View style={s.railTitleWrap}>
            {railWords.map((word: string, i: number) => (
              <Text key={i} style={s.railTitleWord}>{word}</Text>
            ))}
          </View>

          {/* QR + पडताळणी badge (middle) */}
          <View style={s.railMiddle}>
            <View style={s.railQr}>
              {qrDataUrl
                ? <Image src={qrDataUrl} style={{ width: '14mm', height: '14mm' }} />
                : <Text style={s.railQrText}>QR{'\n'}कोड</Text>
              }
            </View>
            <Text style={s.railBadge}>पडताळणी</Text>
          </View>

          {/* School badge (bottom) */}
          <Text style={s.railBadge}>शाळा{'\n'}प्रमाण</Text>
        </View>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <View style={s.body}>

          {/* Shared branded header */}
          <BrandHeader sanstha={sanstha} unit={unit} variant="cert" logoDataUrl={logoDataUrl} />

          {/* Topbar: doc title + serial pills */}
          <View style={s.topbar}>
            <View>
              <Text style={s.docTitleT}>{certTitle}</Text>
              <Text style={s.docTitleSub}>{certSubtitle}</Text>
            </View>
            <View style={s.metaBlock}>
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>प्रमाणपत्र क्र.</Text>
                <Text style={s.pill}>{cert.certificateNumber}</Text>
              </View>
              {student.grNo && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>GR क्र.</Text>
                  <Text style={s.pill}>{student.grNo}</Text>
                </View>
              )}
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>दिनांक</Text>
                <Text style={s.pill}>{dayjs(cert.issueDate).format('DD/MM/YYYY')}</Text>
              </View>
            </View>
          </View>

          {/* Fields */}
          {cert.certificateType === 'leaving'   && <TCFields cert={cert} student={student} />}
          {cert.certificateType === 'bonafide'  && <BonafideFields cert={cert} student={student} />}
          {cert.certificateType === 'character' && <CharacterFields cert={cert} student={student} />}
          {!['leaving', 'bonafide', 'character'].includes(cert.certificateType) && (
            <GenericFields cert={cert} student={student} />
          )}

          {/* Declaration + tamper + footer: wrap={false} = never split across pages */}
          <View wrap={false}>
            <Declaration cert={cert} student={student} unit={unit} />

            <View style={s.tamperWrap}>
              <View style={s.tamperDot} />
              <Text style={s.tamperText}>
                या दाखल्यात / प्रमाणपत्रात कोणत्याही प्रकारची खाडाखोड अथवा फेरफार केल्यास ते रद्द समजण्यात येईल.
              </Text>
            </View>

            <BrandFooter
            variant="report"
            signatures={[
              { label: 'शाळेचा शिक्का', isSeal: true },
              { label: 'वर्गशिक्षक', sub: 'सही' },
              { label: 'मुख्याध्यापक', sub: 'सही व शिक्का' },
            ]}
            note="हा दाखला विद्यार्थी सेवा प्रणालीद्वारे संगणकीय पद्धतीने तयार करण्यात आला आहे."
          />
          </View>

          <AuditFooter userName={userName} />
          <PageNumber />
        </View>

        {/* DUPLICATE badge — top-right corner */}
        {isDuplicate && (
          <View style={s.duplicateWrap}>
            <Text style={s.duplicateText}>✦ DUPLICATE</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}

export async function downloadCertificate(props: CertificateProps): Promise<void> {
  registerFonts();
  const [logoDataUrl, qrDataUrl] = await Promise.all([
    loadLogoAsDataUrl(props.sanstha?.logoUrl),
    generateQrDataUrl(certVerifyUrl(props.cert.certificateNumber)).catch(() => undefined),
  ]);
  const blob = await pdf(<CertificatePDF {...props} logoDataUrl={logoDataUrl} qrDataUrl={qrDataUrl} />).toBlob();
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
