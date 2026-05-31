/**
 * Provides the effective unitId and whether the user can switch units.
 *
 * - Sanstha-level users (director or sanstha-wide role): unitId = selectedUnitId from store,
 *   canSwitch = true (they use the header dropdown).
 * - Unit-scoped users (Lipik, teacher, etc.): unitId = their only assigned unit,
 *   canSwitch = false (no dropdown shown).
 *
 * Usage:
 *   const { unitId, canSwitch } = useUnitAccess();
 */
import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';

export function useUnitAccess() {
  const { user, isSansthaLevel } = useAuthStore();
  const { selectedUnitId } = useAppStore();

  const sansthaLevel = isSansthaLevel();

  if (sansthaLevel) {
    return {
      unitId: selectedUnitId,
      canSwitch: true,
      isLocked: false,
    };
  }

  // Unit-scoped: use their first (and only) assigned unit
  const lockedUnitId = user?.unitIds?.[0] ?? null;
  return {
    unitId: lockedUnitId,
    canSwitch: false,
    isLocked: true,
  };
}
