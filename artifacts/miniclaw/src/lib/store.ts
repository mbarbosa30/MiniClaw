import { create } from 'zustand';

// --- VIEW ROUTER STATE ---

export type ViewName =
  | 'connect'
  | 'home'
  | 'dashboard'
  | 'settings'
  | 'growth'
  | 'create'
  | 'agent-detail'
  | 'agent-options'
  | 'agent-settings'
  | 'memories'
  | 'knowledge'
  | 'skills'
  | 'soul'
  | 'tasks'
  | 'telegram';

export interface ViewParams {
  id?: string;
  [key: string]: string | undefined;
}

interface ViewState {
  name: ViewName;
  params?: ViewParams;
}

interface RouterStore {
  history: ViewState[];
  currentView: ViewState;
  push: (name: ViewName, params?: ViewParams) => void;
  pop: () => void;
  popWithSignal: (signalKey: string) => void;
  reset: (name: ViewName) => void;
  replace: (name: ViewName, params?: ViewParams) => void;
}

export const useRouter = create<RouterStore>((set) => ({
  history: [],
  currentView: { name: 'connect' },

  push: (name, params) => set((state) => ({
    history: [...state.history, state.currentView],
    currentView: { name, params }
  })),

  pop: () => set((state) => {
    if (state.history.length === 0) return state;
    const newHistory = [...state.history];
    const prevView = newHistory.pop()!;
    return { history: newHistory, currentView: prevView };
  }),

  popWithSignal: (signalKey) => set((state) => {
    if (state.history.length === 0) return state;
    const newHistory = [...state.history];
    const prevView = newHistory.pop()!;
    const patched: ViewState = { ...prevView, params: { ...prevView.params, [signalKey]: String(Date.now()) } };
    return { history: newHistory, currentView: patched };
  }),

  replace: (name, params) => set(() => ({
    currentView: { name, params }
  })),

  reset: (name) => set({ history: [], currentView: { name } })
}));

// --- AUTH STATE ---

interface AuthStore {
  isAuthenticated: boolean;
  address: string | null;
  authError: string | null;
  setAuthenticated: (address: string) => void;
  setAddress: (address: string) => void;
  setAuthError: (msg: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  address: null,
  authError: null,
  setAuthenticated: (address) => set({ isAuthenticated: true, address, authError: null }),
  setAddress: (address) => set({ address }),
  setAuthError: (msg) => set({ authError: msg }),
  logout: () => set({ isAuthenticated: false, address: null }),
}));

// --- APP PREFERENCES ---

function readLocalBool(key: string): boolean {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

function writeLocalBool(key: string, v: boolean): void {
  try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* noop */ }
}

interface AppStore {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
  hasSeenOnboard: boolean;
  setHasSeenOnboard: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  darkMode: false,
  setDarkMode: (v) => set({ darkMode: v }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  hasSeenOnboard: readLocalBool('miniclaw-seen-onboard'),
  setHasSeenOnboard: (v) => {
    writeLocalBool('miniclaw-seen-onboard', v);
    set({ hasSeenOnboard: v });
  },
}));
