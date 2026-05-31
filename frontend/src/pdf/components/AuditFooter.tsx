/**
 * AuditFooter — Audit trail row at bottom of every document
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { RPT, FONT } from '../theme';
import dayjs from 'dayjs';

interface Props {
  userName?: string;
  serial?: string;
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 5,
    borderTopWidth: 0.5, borderTopColor: RPT.rule,
    fontSize: 7.5, color: RPT.muted, fontFamily: FONT,
  },
});

function reportSerial() {
  return 'RPT-' + Date.now().toString(36).toUpperCase().slice(-6);
}

export default function AuditFooter({ userName, serial }: Props) {
  const now = dayjs().format('DD/MM/YYYY HH:mm:ss');
  const id  = serial || reportSerial();
  return (
    <View style={s.row} fixed>
      <Text>मुद्रित: {now}</Text>
      <Text>वापरकर्ता: {userName || 'प्रणाली'}</Text>
      <Text>अहवाल क्र.: {id}</Text>
    </View>
  );
}
