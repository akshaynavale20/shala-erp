/**
 * Reusable class + division cascading selects.
 * Usage: <ClassDivisionSelect unitId={x} academicYearId={y} onDivisionChange={setDiv} />
 */
import { Select, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { gradeApi } from '../../api/client';

interface Props {
  unitId?: string;
  academicYearId?: string;
  gradeValue?: string;
  divisionValue?: string;
  onGradeChange?: (id: string) => void;
  onDivisionChange?: (id: string, division?: any) => void;
  layout?: 'horizontal' | 'vertical';
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function ClassDivisionSelect({
  unitId, academicYearId, gradeValue, divisionValue,
  onGradeChange, onDivisionChange,
  layout = 'horizontal', style, disabled,
}: Props) {
  const { data: grades = [] } = useQuery({
    queryKey: ['grades-select', unitId, academicYearId],
    queryFn: () => gradeApi.findByUnit(unitId!, academicYearId),
    enabled: !!unitId,
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions-select', unitId, academicYearId, gradeValue],
    queryFn: () => gradeApi.findDivisions(unitId!, academicYearId, gradeValue),
    enabled: !!unitId && !!gradeValue,
  });

  const gradeOpts = (grades as any[]).map((g) => ({
    value: g.id,
    label: g.gradeLabelMr || `इयत्ता ${g.gradeNumber}`,
  }));

  const divOpts = (divisions as any[]).map((d) => ({
    value: d.id,
    label: d.nameMr,
    division: d,
  }));

  const inner = (
    <>
      <Select
        placeholder="इयत्ता निवडा"
        style={{ minWidth: 140 }}
        disabled={disabled || !unitId}
        allowClear
        value={gradeValue || undefined}
        options={gradeOpts}
        onChange={(v) => {
          onGradeChange?.(v);
          onDivisionChange?.('');
        }}
        notFoundContent={!unitId ? 'शाळा निवडा' : 'इयत्ता नाही'}
      />
      <Select
        placeholder="तुकडी निवडा"
        style={{ minWidth: 120 }}
        disabled={disabled || !gradeValue}
        allowClear
        value={divisionValue || undefined}
        options={divOpts}
        onChange={(v) => {
          const found = (divisions as any[]).find((d: any) => d.id === v);
          onDivisionChange?.(v, found);
        }}
        notFoundContent={!gradeValue ? 'इयत्ता निवडा' : 'तुकडी नाही'}
      />
    </>
  );

  if (layout === 'vertical') {
    return <Space direction="vertical" style={{ width: '100%', ...style }}>{inner}</Space>;
  }

  return <Space style={style}>{inner}</Space>;
}
