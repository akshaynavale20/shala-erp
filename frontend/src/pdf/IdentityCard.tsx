/**
 * IdentityCard.tsx — Portrait School ID Card PDF
 *
 * Layout  : A4 portrait → 3 cols × 3 rows = 9 cards per page
 * Card    : 62 mm × 93 mm
 * Margins : 6 mm all sides, H-gap 5 mm, V-gap 4 mm
 * Check H : 6 + 62 + 5 + 62 + 5 + 62 + 6 = 208 mm ✓  (A4 = 210)
 * Check V : 6 + 93 + 4 + 93 + 4 + 93 + 4 = 297 mm ✓  (A4 = 297)
 *
 * Language: 'mr' (Marathi default) or 'en' (English)
 *   — switches field labels AND name / school / sanstha text
 */

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { FONT } from './theme';
import { registerFonts } from './fonts';
import { loadLogoAsDataUrl } from './logoLoader';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

// ── Palette ───────────────────────────────────────────────────────────────────
const BLUE      = '#1A3A5C';
const BLUE_MID  = '#2E5B8A';
const GOLD      = '#D4A017';
const RED_DK    = '#B71C1C';
const CREAM     = '#FAFBFD';
const MUTED_TXT = '#9E9E9E';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface IDCardPerson {
  type: 'student' | 'staff';
  nameMr: string;
  nameEn?: string;
  grNumber?: string;
  gradeLabelMr?: string;   // e.g. "इयत्ता पहिली"
  gradeLabelEn?: string;   // e.g. "Class 1st"
  divisionName?: string;   // e.g. "अ" / "A" / "B"
  bloodGroup?: string;
  fatherNameMr?: string;
  fatherNameEn?: string;
  motherNameMr?: string;
  motherNameEn?: string;
  dob?: string;
  addressMr?: string;
  addressEn?: string;
  phone?: string;
  designationMr?: string;
  designationEn?: string;
  employeeType?: string;
  photoUrl?: string;
  photoDataUrl?: string;
}

export interface IdentityCardProps {
  persons: IDCardPerson[];
  sanstha?: any;
  unit?: any;
  logoDataUrl?: string;
  academicYear?: string;
  language?: 'mr' | 'en';
}

const EMP_LABEL_MR: Record<string, string> = {
  permanent: 'कायम', temporary: 'तात्पुरता', contract: 'कंत्राटी',
  aided: 'अनुदानित', unaided: 'विनाअनुदानित',
};
const EMP_LABEL_EN: Record<string, string> = {
  permanent: 'Permanent', temporary: 'Temporary', contract: 'Contract',
  aided: 'Aided', unaided: 'Unaided',
};

// ── Localised labels ─────────────────────────────────────────────────────────
function getLabels(lang: 'mr' | 'en') {
  if (lang === 'en') return {
    grNo: 'GR No.',
    father: 'Father',
    mother: 'Mother',
    dob: 'Date of Birth',
    mobile: 'Mobile',
    address: 'Address',
    type: 'Employee Type',
    blood: 'Blood Grp',
    classBadge: 'Class',
    divBadge: 'Division',
    principal: 'Principal',
    seal: 'Seal',
    studentId: 'STUDENT ID',
    staffId: 'STAFF ID',
    na: 'N / A',
    schoolLabel: 'School',
    academicYearLabel: 'Academic Year',
    schoolCode: 'School Code',
    designation: 'Designation',
    empType: 'Emp. Type',
  };
  return {
    grNo: 'GR क्र.',
    father: 'वडील',
    mother: 'आई',
    dob: 'जन्मतारीख',
    mobile: 'मोबाईल',
    address: 'पत्ता',
    type: 'कर्मचारी प्रकार',
    blood: 'रक्तगट',
    classBadge: 'इयत्ता',
    divBadge: 'तुकडी',
    principal: 'मुख्याध्यापक',
    seal: 'शिक्का',
    studentId: 'विद्यार्थी ID',
    staffId: 'कर्मचारी ID',
    na: 'उपलब्ध नाही',
    schoolLabel: 'शाळा',
    academicYearLabel: 'शैक्षणिक वर्ष',
    schoolCode: 'शाळा कोड',
    designation: 'पदनाम',
    empType: 'कर्मचारी प्रकार',
  };
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: '#E8EFF7',
    fontFamily: FONT,
    paddingTop: '6mm',
    paddingLeft: '6mm',
    paddingRight: '6mm',
    paddingBottom: '4mm',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },

  // Card shell — 62×93mm
  card: {
    width: '62mm',
    height: '93mm',
    marginRight: '5mm',
    marginBottom: '4mm',
    backgroundColor: CREAM,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#C5CAE9',
  },
  cardNoMarginR: { marginRight: 0 },

  // ── Blue header 22mm ───────────────────────────────────────────────────────
  header: {
    height: '22mm',
    backgroundColor: BLUE,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDiag: {
    position: 'absolute',
    top: 0, right: '-4mm',
    width: '32mm', height: '100%',
    backgroundColor: BLUE_MID,
    transform: 'skewX(-8deg)' as any,
  },
  headerContent: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: '2mm',
    paddingLeft: '2mm',
    paddingRight: '18mm',   // leave room for photo (15+2+1 mm)
    flex: 1,
  },
  logoCircle: {
    width: '8mm', height: '8mm',
    borderRadius: 99,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    marginRight: '1.5mm',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: GOLD,
  },
  logoImg:     { width: '7mm', height: '7mm', objectFit: 'contain' },
  logoInitial: { fontSize: 9, fontWeight: 700, color: BLUE, fontFamily: FONT },

  schoolBlock:  { flex: 1, minWidth: 0 },
  unitName: {
    fontSize: 5.5, fontWeight: 700, color: '#ffffff',
    fontFamily: FONT, lineHeight: 1.3,
  },
  sansthaName: {
    fontSize: 4.5, color: 'rgba(255,255,255,0.8)',
    fontFamily: FONT, lineHeight: 1.3,
  },
  udiseText: {
    fontSize: 4, color: 'rgba(255,255,255,0.6)',
    fontFamily: FONT, marginTop: '0.5mm',
  },
  cardTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    color: BLUE,
    fontSize: 4.5, fontWeight: 700, fontFamily: FONT,
    paddingHorizontal: '1.5mm', paddingVertical: '0.5mm',
    borderRadius: 1,
    marginTop: '1mm',
  },

  // Photo — absolute top-right of card
  photoWrap: {
    position: 'absolute',
    right: '2mm', top: '1.5mm',
    width: '15mm', height: '20mm',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  photoImg: { width: '15mm', height: '20mm', objectFit: 'cover' },
  photoPlaceholder: {
    width: '15mm', height: '20mm',
    backgroundColor: '#BBDEFB',
    alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholderText: { fontSize: 4, color: BLUE, fontFamily: FONT, textAlign: 'center' },

  // Academic year strip inside header bottom
  yearStrip: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: '2mm', paddingVertical: '0.8mm',
    flexDirection: 'row', alignItems: 'center',
  },
  yearStripText: { fontSize: 4, color: 'rgba(255,255,255,0.9)', fontFamily: FONT },

  // ── Badge row ──────────────────────────────────────────────────────────────
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '2.5mm',
    paddingTop: '1.5mm',
    paddingBottom: '1mm',
  },
  badge: {
    borderRadius: 2,
    paddingHorizontal: '2mm', paddingVertical: '1mm',
    alignItems: 'center',
    minWidth: '14mm',
  },
  badgeBlue: { backgroundColor: BLUE },
  badgeRed:  { backgroundColor: RED_DK },
  badgeGold: { backgroundColor: '#795548' },
  badgeLabel: { fontSize: 4, color: 'rgba(255,255,255,0.8)', fontFamily: FONT },
  badgeValue: { fontSize: 7, fontWeight: 700, color: '#ffffff', fontFamily: FONT },
  badgeValueSm: { fontSize: 5.5, fontWeight: 700, color: '#ffffff', fontFamily: FONT },

  // ── Name section ──────────────────────────────────────────────────────────
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: '2mm',
    paddingTop: '1mm',
    paddingBottom: '1mm',
    borderTopWidth: 0.5, borderTopColor: '#CFD8DC',
    borderBottomWidth: 0.5, borderBottomColor: '#CFD8DC',
    marginHorizontal: '2mm',
  },
  nameText: {
    fontSize: 7, fontWeight: 700, color: BLUE,
    fontFamily: FONT, textAlign: 'center', lineHeight: 1.2,
  },
  nameEnText: {
    fontSize: 5, color: '#607D8B', fontFamily: FONT, textAlign: 'center',
  },

  // ── Info rows ──────────────────────────────────────────────────────────────
  infoSection: {
    paddingHorizontal: '2.5mm',
    paddingTop: '1.5mm',
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: '1.2mm',
  },
  fieldLabel: {
    fontSize: 4.8, color: BLUE,
    fontFamily: FONT,
    width: '14mm', flexShrink: 0,
    fontWeight: 700,
  },
  fieldColon: { fontSize: 4.8, color: '#999', fontFamily: FONT, marginRight: '0.8mm' },
  fieldValue: {
    fontSize: 5, color: '#1a1a1a',
    fontFamily: FONT, flex: 1, lineHeight: 1.35,
  },
  fieldNA: {
    fontSize: 4.5, color: MUTED_TXT,
    fontFamily: FONT, flex: 1,
    fontStyle: 'italic',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerSig: {
    paddingHorizontal: '2.5mm',
    paddingTop: '1mm',
    paddingBottom: '0.5mm',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: '#CFD8DC',
  },
  sigBlock: { alignItems: 'center' },
  sigLine:  { width: '14mm', height: 0.5, backgroundColor: '#555', marginBottom: '0.8mm' },
  sigLabel: { fontSize: 4.5, color: '#555', fontFamily: FONT },
  sealBox: {
    width: '12mm', height: '8mm',
    borderWidth: 0.5, borderColor: '#aaa',
    borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
    borderStyle: 'dashed',
  },
  sealText: { fontSize: 3.8, color: '#aaa', fontFamily: FONT, textAlign: 'center' },

  // Yellow-blue accent strip at bottom
  bottomStrip: { height: '2.5mm', backgroundColor: GOLD, flexDirection: 'row' },
  bottomStripBlue: { width: '22mm', height: '2.5mm', backgroundColor: BLUE },
});

// ── Single Card Component ──────────────────────────────────────────────────────
function IDCard({
  person, logoDataUrl, sansthaName, sansthaNameEn,
  unitName, unitNameEn, udise, ptrNumber,
  academicYear, isLastCol, lang,
}: {
  person: IDCardPerson;
  logoDataUrl?: string;
  sansthaName: string;
  sansthaNameEn?: string;
  unitName?: string;
  unitNameEn?: string;
  udise?: string;
  ptrNumber?: string;
  academicYear?: string;
  isLastCol: boolean;
  lang: 'mr' | 'en';
}) {
  const L = getLabels(lang);
  const isStudent = person.type === 'student';

  const displayName = (lang === 'en' && person.nameEn) ? person.nameEn : person.nameMr;
  const displayUnit = (lang === 'en' && unitNameEn) ? unitNameEn : (unitName || sansthaName);
  const displaySanstha = (lang === 'en' && sansthaNameEn) ? sansthaNameEn : sansthaName;

  const photoSrc = person.photoDataUrl
    ?? (person.photoUrl
      ? (person.photoUrl.startsWith('http') ? person.photoUrl : `${API_BASE}${person.photoUrl}`)
      : undefined);

  // Field value helper — shows NA muted text if empty
  const val = (v: string | undefined, naLabel: string) => v
    ? <Text style={s.fieldValue}>{v}</Text>
    : <Text style={s.fieldNA}>{naLabel}</Text>;

  // Class and division — separate badges
  const classVal = (lang === 'en' && person.gradeLabelEn) ? person.gradeLabelEn : person.gradeLabelMr;
  const divVal   = person.divisionName || '';

  // Staff display values
  const desigVal = (lang === 'en' && person.designationEn) ? person.designationEn : person.designationMr;
  const empTypeVal = person.employeeType
    ? (lang === 'en' ? EMP_LABEL_EN[person.employeeType] : EMP_LABEL_MR[person.employeeType]) || person.employeeType
    : undefined;
  const fatherVal = (lang === 'en' && person.fatherNameEn) ? person.fatherNameEn : person.fatherNameMr;
  const motherVal = (lang === 'en' && person.motherNameEn) ? person.motherNameEn : person.motherNameMr;
  const addrVal   = (lang === 'en' && person.addressEn)    ? person.addressEn    : person.addressMr;

  return (
    <View style={[s.card, isLastCol ? s.cardNoMarginR : {}]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerDiag} />

        <View style={s.headerContent}>
          {/* Logo */}
          <View style={s.logoCircle}>
            {logoDataUrl
              ? <Image style={s.logoImg} src={logoDataUrl} />
              : <Text style={s.logoInitial}>{displayUnit?.charAt(0) || 'श'}</Text>
            }
          </View>

          {/* School info */}
          <View style={s.schoolBlock}>
            <Text style={s.unitName}>{displayUnit}</Text>
            {displaySanstha !== displayUnit && (
              <Text style={s.sansthaName}>{displaySanstha}</Text>
            )}
            {(udise || ptrNumber) && (
              <Text style={s.udiseText}>
                {udise ? `UDISE: ${udise}` : ''}
                {udise && ptrNumber ? '  |  ' : ''}
                {ptrNumber ? `PTR: ${ptrNumber}` : ''}
              </Text>
            )}
            <Text style={s.cardTypeBadge}>{isStudent ? L.studentId : L.staffId}</Text>
          </View>
        </View>

        {/* Year strip */}
        {academicYear && (
          <View style={s.yearStrip}>
            <Text style={s.yearStripText}>{L.academicYearLabel}: {academicYear}</Text>
          </View>
        )}
      </View>

      {/* Photo — absolute over header */}
      <View style={s.photoWrap}>
        {photoSrc ? (
          <Image style={s.photoImg} src={photoSrc} />
        ) : (
          <View style={s.photoPlaceholder}>
            <Text style={s.photoPlaceholderText}>{'Photo\nN/A'}</Text>
          </View>
        )}
      </View>

      {/* ── Badges ─────────────────────────────────────────────────────────── */}
      <View style={s.badgeRow}>
        {isStudent ? (
          <>
            {(classVal || divVal) ? (
              <View style={[s.badge, s.badgeBlue]}>
                <Text style={s.badgeLabel}>{L.classBadge}</Text>
                <Text style={s.badgeValueSm}>{classVal || '—'}</Text>
              </View>
            ) : <View style={{ width: '14mm' }} />}

            {divVal ? (
              <View style={[s.badge, s.badgeGold]}>
                <Text style={s.badgeLabel}>{L.divBadge}</Text>
                <Text style={s.badgeValue}>{divVal}</Text>
              </View>
            ) : <View style={{ width: '14mm' }} />}
          </>
        ) : (
          <>
            {desigVal ? (
              <View style={[s.badge, s.badgeBlue, { maxWidth: '30mm' }]}>
                <Text style={s.badgeLabel}>{L.designation}</Text>
                <Text style={[s.badgeValueSm, { textAlign: 'center' }]}>{desigVal}</Text>
              </View>
            ) : <View style={{ width: '14mm' }} />}
          </>
        )}

        {person.bloodGroup ? (
          <View style={[s.badge, s.badgeRed]}>
            <Text style={s.badgeLabel}>{L.blood}</Text>
            <Text style={s.badgeValue}>{person.bloodGroup}</Text>
          </View>
        ) : <View style={{ width: '14mm' }} />}
      </View>

      {/* ── Name ───────────────────────────────────────────────────────────── */}
      <View style={s.nameSection}>
        <Text style={s.nameText}>{displayName}</Text>
        {person.nameEn && lang === 'mr' && (
          <Text style={s.nameEnText}>{person.nameEn}</Text>
        )}
        {person.nameMr && lang === 'en' && person.nameEn && (
          <Text style={s.nameEnText}>{person.nameMr}</Text>
        )}
      </View>

      {/* ── Info rows ──────────────────────────────────────────────────────── */}
      <View style={s.infoSection}>
        {isStudent ? (
          <>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>{L.grNo}</Text>
              <Text style={s.fieldColon}>:</Text>
              {val(person.grNumber, L.na)}
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>{L.father}</Text>
              <Text style={s.fieldColon}>:</Text>
              {val(fatherVal, L.na)}
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>{L.mother}</Text>
              <Text style={s.fieldColon}>:</Text>
              {val(motherVal, L.na)}
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>{L.dob}</Text>
              <Text style={s.fieldColon}>:</Text>
              {val(person.dob, L.na)}
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>{L.mobile}</Text>
              <Text style={s.fieldColon}>:</Text>
              {val(person.phone, L.na)}
            </View>
            {addrVal ? (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>{L.address}</Text>
                <Text style={s.fieldColon}>:</Text>
                <Text style={[s.fieldValue, { fontSize: 4.5 }]}>{addrVal}</Text>
              </View>
            ) : (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>{L.address}</Text>
                <Text style={s.fieldColon}>:</Text>
                <Text style={s.fieldNA}>{L.na}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {empTypeVal && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>{L.empType}</Text>
                <Text style={s.fieldColon}>:</Text>
                <Text style={s.fieldValue}>{empTypeVal}</Text>
              </View>
            )}
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>{L.dob}</Text>
              <Text style={s.fieldColon}>:</Text>
              {val(person.dob, L.na)}
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>{L.mobile}</Text>
              <Text style={s.fieldColon}>:</Text>
              {val(person.phone, L.na)}
            </View>
            {addrVal ? (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>{L.address}</Text>
                <Text style={s.fieldColon}>:</Text>
                <Text style={[s.fieldValue, { fontSize: 4.5 }]}>{addrVal}</Text>
              </View>
            ) : (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>{L.address}</Text>
                <Text style={s.fieldColon}>:</Text>
                <Text style={s.fieldNA}>{L.na}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* ── Signature + Seal footer ─────────────────────────────────────────── */}
      <View style={s.footerSig}>
        <View style={s.sigBlock}>
          <View style={s.sigLine} />
          <Text style={s.sigLabel}>{L.principal}</Text>
        </View>
        <View style={s.sealBox}>
          <Text style={s.sealText}>{L.seal}</Text>
        </View>
      </View>

      {/* Yellow-blue accent strip */}
      <View style={s.bottomStrip}>
        <View style={s.bottomStripBlue} />
      </View>

    </View>
  );
}

// ── PDF Document ───────────────────────────────────────────────────────────────
export function IdentityCardPDF({
  persons, sanstha, unit, logoDataUrl, academicYear, language = 'mr',
}: IdentityCardProps) {
  registerFonts();

  const sansthaName    = sanstha?.nameMr || 'संस्था';
  const sansthaNameEn  = sanstha?.nameEn;
  const unitName       = (unit?.nameMr && unit.nameMr !== sanstha?.nameMr) ? unit.nameMr : undefined;
  const unitNameEn     = (unit?.nameEn && unit.nameEn !== sanstha?.nameEn) ? unit.nameEn : undefined;
  const udise          = unit?.udiseCode || sanstha?.udiseCode || '';
  const ptrNumber      = sanstha?.ptrNumber || '';

  return (
    <Document title="ओळखपत्र" author={sansthaName}>
      <Page size="A4" orientation="portrait" style={s.page}>
        {persons.map((p, i) => (
          <IDCard
            key={i}
            person={p}
            logoDataUrl={logoDataUrl}
            sansthaName={sansthaName}
            sansthaNameEn={sansthaNameEn}
            unitName={unitName}
            unitNameEn={unitNameEn}
            udise={udise}
            ptrNumber={ptrNumber}
            academicYear={academicYear}
            isLastCol={i % 3 === 2}
            lang={language}
          />
        ))}
      </Page>
    </Document>
  );
}

// ── Download helper ───────────────────────────────────────────────────────────
export async function downloadIdentityCards(props: IdentityCardProps): Promise<void> {
  registerFonts();

  const logoDataUrl = await loadLogoAsDataUrl(props.sanstha?.logoUrl);

  const personsWithPhotos: IDCardPerson[] = await Promise.all(
    props.persons.map(async (p) => {
      if (!p.photoUrl) return p;
      const photoDataUrl = await loadLogoAsDataUrl(p.photoUrl).catch(() => undefined);
      return { ...p, photoDataUrl };
    })
  );

  const blob = await pdf(
    <IdentityCardPDF {...props} persons={personsWithPhotos} logoDataUrl={logoDataUrl} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
