/**
 * useCurrentYear — auto-seeds the global academic year from the API's isCurrent flag.
 *
 * On first call (e.g. in AppLayout):
 *   - Fetches academic years for the sanstha
 *   - Finds the one with isCurrent=true (or falls back to first)
 *   - Writes it to app.store if not already set
 *
 * Every page that has a year selector should call this hook to get the
 * pre-populated default instead of starting with undefined.
 *
 * Usage:
 *   const { years, yearId, setYearId, currentYear } = useCurrentYear();
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';
import { academicYearApi } from '../api/client';

export interface AcademicYear {
  id: string;
  labelMr: string;
  labelEn: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
}

export function useCurrentYear() {
  const { user: me } = useAuthStore();
  const { selectedAcademicYearId, setSelectedAcademicYearId } = useAppStore();

  const { data: years = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years', me?.sansthaId],
    queryFn: () => academicYearApi.findBySanstha(me!.sansthaId),
    enabled: !!me?.sansthaId,
    staleTime: 10 * 60 * 1000,
  });

  // The year marked isCurrent in the system, or fallback to first
  const currentYear = years.find(y => y.isCurrent) ?? years[0] ?? null;

  // Auto-seed app.store on first load (only when nothing is stored yet)
  useEffect(() => {
    if (years.length > 0 && !selectedAcademicYearId && currentYear?.id) {
      setSelectedAcademicYearId(currentYear.id);
    }
  }, [years.length, selectedAcademicYearId, currentYear?.id, setSelectedAcademicYearId]);

  // Effective year: use stored value, else current from API
  const yearId: string | undefined =
    selectedAcademicYearId ?? currentYear?.id ?? undefined;

  return {
    years,
    currentYear,
    yearId,
    setYearId: setSelectedAcademicYearId,
  };
}
