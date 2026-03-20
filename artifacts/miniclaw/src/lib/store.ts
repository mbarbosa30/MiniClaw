import { create } from 'zustand';

// --- VIEW ROUTER STATE ---
// Keeps all navigation strictly within the React tree, no URL changes.

export type ViewName = 
  | 'connect' 
  | 'home' 
  | 'create' 
  | 'agent-detail'
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
    return {
      history: newHistory,
      currentView: prevView
    };
  }),

  reset: (name) => set({
    history: [],
    currentView: { name }
  })
}));

// --- AUTH STATE ---

export type SessionStatus = 'idle' | 'signing' | 'verifying' | 'error';

interface AuthStore {
  isAuthenticated: boolean;
  address: string | null;
  sessionStatus: SessionStatus;
  setAuth: (address: string | null) => void;
  setSessionStatus: (status: SessionStatus) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  address: null,
  sessionStatus: 'idle',
  setAuth: (address) => set({ isAuthenticated: !!address, address, sessionStatus: 'idle' }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  logout: () => set({ isAuthenticated: false, address: null, sessionStatus: 'idle' }),
}));
