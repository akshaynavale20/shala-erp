/**
 * PageNumber — Fixed footer showing "पान X / Y"
 */
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { RPT, FONT } from '../theme';

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 8, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  text: { fontSize: 8, color: RPT.muted, fontFamily: FONT },
});

export default function PageNumber() {
  return (
    <View style={s.wrap} fixed>
      <Text
        style={s.text}
        render={({ pageNumber, totalPages }) => `पान ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}
