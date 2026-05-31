/**
 * Global app state — unit + academic year selection + language persisted in localStorage.
 * All pages read from this store so the selection survives navigation.
 */
import { create } from 'zustand';
import i18n from '../i18n';

interface AppState {
  selectedUnitId: string | null;
  selectedAcademicYearId: string | null;
  language: 'mr' | 'en';
  setSelectedUnitId: (id: string | null) => void;
  setSelectedAcademicYearId: (id: string | null) => void;
  setLanguage: (lang: 'mr' | 'en') => void;
}

const STORE_KEY = 'sms_app_state';

function load(): Partial<AppState> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

const saved = load();

export const useAppStore = create<AppState>((set) => ({
  selectedUnitId: saved.selectedUnitId ?? null,
  selectedAcademicYearId: saved.selectedAcademicYearId ?? null,
  language: (saved as any).language ?? 'mr',

  setSelectedUnitId: (id) => {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      ...load(), selectedUnitId: id,
    }));
    set({ selectedUnitId: id });
  },

  setSelectedAcademicYearId: (id) => {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      ...load(), selectedAcademicYearId: id,
    }));
    set({ selectedAcademicYearId: id });
  },

  setLanguage: (lang) => {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      ...load(), language: lang,
    }));
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
