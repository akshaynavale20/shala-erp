import { ReadOutlined } from '@ant-design/icons';
import { ComingSoonPage } from '../../components/common/ComingSoon';

export default function LibraryPage() {
  return (
    <ComingSoonPage
      title="ग्रंथालय"
      icon={<ReadOutlined />}
      features={[
        'पुस्तक नोंदणी व कॅटलॉग',
        'देणे-घेणे व्यवस्थापन',
        'थकित पुस्तके व दंड',
        'विद्यार्थी व कर्मचारी सदस्यता',
        'ग्रंथालय अहवाल',
      ]}
    />
  );
}
