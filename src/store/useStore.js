import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // ── AUTH STATE ──────────────────────────────
      officer:    null,
      token:      null,
      isLoggedIn: false,
      isLoading:  true, // for initial auth check

      setOfficer: (officer) => set({ officer }),

      login: (officer, token) => {
        localStorage.setItem('blrs_token', token);
        localStorage.setItem('blrs_officer', JSON.stringify(officer));
        set({ officer, token, isLoggedIn: true });
      },

      logout: () => {
        localStorage.removeItem('blrs_token');
        localStorage.removeItem('blrs_officer');
        set({ officer: null, token: null, isLoggedIn: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        const token = localStorage.getItem('blrs_token');
        const officerStr = localStorage.getItem('blrs_officer');
        if (token && officerStr) {
          try {
            const officer = JSON.parse(officerStr);
            set({ officer, token, isLoggedIn: true });
          } catch (e) {
            localStorage.removeItem('blrs_token');
            localStorage.removeItem('blrs_officer');
          }
        }
        set({ isLoading: false });
      },

      // ── LAND STATE ──────────────────────────────
      lands:        [],
      currentLand:  null,
      landLoading:  false,
      landError:    null,
      landTotal:    0,
      landPage:     1,

      setLands:       (lands)       => set({ lands }),
      setCurrentLand: (land)        => set({ currentLand: land }),
      setLandLoading: (loading)     => set({ landLoading: loading }),
      setLandError:   (error)       => set({ landError: error }),
      setLandTotal:   (total)       => set({ landTotal: total }),

      updateLandInList: (updatedLand) => set((state) => ({
        lands: state.lands.map(land =>
          land.parcelId === updatedLand.parcelId ? updatedLand : land
        )
      })),

      addLand: (newLand) => set((state) => ({
        lands: [newLand, ...state.lands],
        landTotal: state.landTotal + 1
      })),

      // ── DISPUTE STATE ────────────────────────────
      disputes:       [],
      currentDispute: null,
      disputeLoading: false,

      setDisputes:       (disputes) => set({ disputes }),
      setCurrentDispute: (dispute)  => set({ currentDispute: dispute }),
      setDisputeLoading: (loading)  => set({ disputeLoading: loading }),

      // ── DASHBOARD STATS ─────────────────────────
      stats: null,
      setStats: (stats) => set({ stats }),

      // ── UI STATE ────────────────────────────────
      darkMode:    false,
      sidebarOpen: true,

      initTheme: () => {
        const state = get();
        if (state.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleDarkMode: () => set((state) => {
        const newMode = !state.darkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { darkMode: newMode };
      }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
    }),
    {
      name: 'blrs-store',
      partialize: (state) => ({
        officer:    state.officer,
        token:      state.token,
        isLoggedIn: state.isLoggedIn,
        darkMode:   state.darkMode
      })
    }
  )
);

export default useStore;
