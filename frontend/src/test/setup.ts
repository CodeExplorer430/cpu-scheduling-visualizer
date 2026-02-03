import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock persistence layer to avoid IndexedDB issues in JSDOM
vi.mock('../lib/persistence', () => ({
  persistence: {
    saveScenario: vi.fn().mockResolvedValue({}),
    getScenarios: vi.fn().mockResolvedValue([]),
    deleteScenario: vi.fn().mockResolvedValue(undefined),
    getScenario: vi.fn().mockResolvedValue(undefined),
  },
}));
