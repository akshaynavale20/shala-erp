import { ScheduleOutlined } from '@ant-design/icons';
import { ComingSoonPage } from '../../components/common/ComingSoon';

export default function TimetablePage() {
  return (
    <ComingSoonPage
      title="वेळापत्रक"
      icon={<ScheduleOutlined />}
      features={[
        'इयत्तावार व तुकडीवार वेळापत्रक',
        'तासिका व शिक्षक जोडणी',
        'विषयनिहाय कालावधी नियोजन',
        'PDF / Print मुद्रण',
        'वेळापत्रक संघर्ष तपासणी',
      ]}
    />
  );
}
