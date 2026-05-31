/**
 * Reusable student search + select dropdown.
 * Usage: <StudentSearchSelect unitId={x} value={id} onChange={setId} />
 * Can optionally filter by divisionId.
 */
import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  value?: string;
  onChange?: (id: string, student?: any) => void;
  unitId?: string;
  divisionId?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  allowClear?: boolean;
}

export default function StudentSearchSelect({
  value, onChange, unitId, divisionId, placeholder = 'विद्यार्थी शोधा', style, disabled, allowClear,
}: Props) {
  const { user: me } = useAuthStore();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students-select', me?.sansthaId, unitId, divisionId],
    queryFn: () => studentApi.findBySanstha(me!.sansthaId, {
      unitId,
      ...(divisionId ? { divisionId } : {}),
    } as any),
    enabled: !!me?.sansthaId,
  });

  const options = (students as any[]).map((s) => ({
    value: s.id,
    label: `${s.nameMr}${s.fatherNameMr ? ' / ' + s.fatherNameMr : ''}${s.rollNumber ? ' | रोल: ' + s.rollNumber : ''}`,
    student: s,
  }));

  return (
    <Select
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      loading={isLoading}
      value={value || undefined}
      placeholder={placeholder}
      style={{ width: '100%', ...style }}
      optionFilterProp="label"
      onChange={(val) => {
        const found = (students as any[]).find((s: any) => s.id === val);
        onChange?.(val, found);
      }}
      options={options}
      notFoundContent={isLoading ? 'लोड होत आहे...' : 'विद्यार्थी सापडला नाही'}
    />
  );
}
