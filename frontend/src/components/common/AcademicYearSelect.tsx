/**
 * AcademicYearSelect — reusable dropdown for academic year selection.
 *
 * Behaviour:
 *  1. Fetches DB academic years for the sanstha.
 *  2. If none, auto-generates ± 2 years around today for display.
 *  3. Syncs selection with global useAppStore so it persists across pages.
 *  4. Auto-selects the current year (isCurrent=true) on first load.
 *  5. No free-text input allowed.
 */
import { useEffect } from 'react';
import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { academicYearApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';

interface Props {
  /** Override value (controlled from parent). If omitted, uses global store. */
  value?: string | null;
  onChange?: (id: string, record: any) => void;
  style?: React.CSSProperties;
  placeholder?: string;
  allowClear?: boolean;
  /** Size of the select */
  size?: 'small' | 'middle' | 'large';
}

/** Compute a ±2-year window of academic-year labels around today */
function generateYearOptions(): { labelMr: string; labelEn: string; id: string }[] {
  const today = new Date();
  // Academic year starts in June: if month < 6 (Jan-May), current AY = prev/this
  const calYear = today.getFullYear();
  const startYear = today.getMonth() < 5 ? calYear - 1 : calYear;

  const options = [];
  for (let offset = -2; offset <= 2; offset++) {
    const y = startYear + offset;
    const shortNext = String(y + 1).slice(2);
    options.push({
      id: `__gen__${y}`,
      labelEn: `${y}-${shortNext}`,
      labelMr: `${y}-${shortNext}`,
      isCurrent: offset === 0,
      startDate: `${y}-06-01`,
      endDate: `${y + 1}-03-31`,
    });
  }
  return options;
}

export default function AcademicYearSelect({
  value,
  onChange,
  style,
  placeholder = 'शैक्षणिक वर्ष निवडा',
  allowClear = false,
  size = 'middle',
}: Props) {
  const { user: me } = useAuthStore();
  const { selectedAcademicYearId, setSelectedAcademicYearId } = useAppStore();

  const { data: dbYears = [] } = useQuery<any[]>({
    queryKey: ['academic-years', me?.sansthaId],
    queryFn: () => academicYearApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 5 * 60_000,
  });

  // Determine the list to display: prefer DB records; fall back to generated
  const years: any[] = dbYears.length > 0 ? dbYears : generateYearOptions();

  // On first load: auto-select the current year
  useEffect(() => {
    if (value !== undefined) return; // controlled externally
    if (selectedAcademicYearId) return; // already set
    const current = years.find((y) => y.isCurrent);
    if (current) setSelectedAcademicYearId(current.id);
  }, [years]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolved = value !== undefined ? value : selectedAcademicYearId;

  const options = years.map((y: any) => ({
    value: y.id,
    label: y.isCurrent
      ? `${y.labelEn} (चालू)`
      : y.labelEn,
    record: y,
  }));

  const handleChange = (id: string) => {
    if (value === undefined) setSelectedAcademicYearId(id); // sync store
    const record = years.find((y: any) => y.id === id);
    onChange?.(id, record);
  };

  return (
    <Select
      size={size}
      style={{ minWidth: 160, ...style }}
      placeholder={placeholder}
      value={resolved ?? undefined}
      onChange={handleChange}
      allowClear={allowClear}
      options={options}
      showSearch
      optionFilterProp="label"
    />
  );
}
