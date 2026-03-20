import { create } from 'zustand';

// --- VIEW ROUTER STATE ---

export type ViewName =
  | 'connect'
  | 'home'
  | 'dashboard'
  | 'settings'
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
  reset: (name: ViewName) => void;
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

interface AppStore {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  darkMode: false,
  setDarkMode: (v) => set({ darkMode: v }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
