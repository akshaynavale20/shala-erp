/**
 * LanguageSwitcher — toggle between मराठी and English
 * Saves preference to localStorage via useAppStore
 */
import { Button, Tooltip } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/app.store';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useAppStore();
  const isMr = language === 'mr';

  return (
    <Tooltip title={isMr ? 'Switch to English' : 'मराठीत बदला'}>
      <Button
        type="text"
        size="small"
        icon={<TranslationOutlined />}
        onClick={() => setLanguage(isMr ? 'en' : 'mr')}
        style={{
          color: '#1A3A5C',
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: 0.3,
          minWidth: 48,
          border: '1px solid #d0d9e8',
        }}
      >
        {isMr ? 'EN' : 'मर'}
      </Button>
    </Tooltip>
  );
}
