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

interface ViewState {
  name: ViewName;
  params?: any;
}

interface RouterStore {
  history: ViewState[];
  currentView: ViewState;
  push: (name: ViewName, params?: any) => void;
  pop: () => void;
  reset: (name: ViewName) => void; // Clear history and go to view
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

interface AuthStore {
  isAuthenticated: boolean;
  address: string | null;
  setAuth: (address: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  address: null,
  setAuth: (address) => set({ isAuthenticated: !!address, address }),
  logout: () => set({ isAuthenticated: false, address: null })
}));
