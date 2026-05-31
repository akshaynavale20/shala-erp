import { create } from 'zustand';

export interface AuthUser {
  id: string;
  nameMr: string;
  email: string;
  sansthaId: string;
  isSansthaDirector: boolean;
  mustChangePassword: boolean;
  forcePasswordChange: boolean;
  permissions: string[];
  /** Unit IDs this user is scoped to. Empty = sanstha-wide access. */
  unitIds: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  /** True if user has given permission key */
  hasPermission: (perm: string) => boolean;
  /** True if user can access all units (director or sanstha-wide role) */
  isSansthaLevel: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('sms_user') || 'null'); }
    catch { return null; }
  })(),
  token: localStorage.getItem('sms_token'),

  setAuth: (user, token) => {
    localStorage.setItem('sms_token', token);
    localStorage.setItem('sms_user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!get().token && !!get().user,

  hasPermission: (perm: string) => {
    const u = get().user;
    if (!u) return false;
    if (u.isSansthaDirector) return true; // director has everything
    return u.permissions?.includes(perm) ?? false;
  },

  isSansthaLevel: () => {
    const u = get().user;
    if (!u) return false;
    // Director is always sanstha-level.
    // Also sanstha-level if user has NO unitIds (means assigned at sanstha-wide scope).
    return u.isSansthaDirector || (u.unitIds?.length === 0);
  },
}));
