import { create } from 'zustand';
import { Tournament, Notification } from '../types';

interface AppStore {
  tournaments: Tournament[];
  notifications: Notification[];
  selectedTournament: Tournament | null;
  setTournaments: (tournaments: Tournament[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setSelectedTournament: (tournament: Tournament | null) => void;
  addNotification: (notification: Notification) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  tournaments: [],
  notifications: [],
  selectedTournament: null,
  setTournaments: (tournaments) => set({ tournaments }),
  setNotifications: (notifications) => set({ notifications }),
  setSelectedTournament: (selectedTournament) => set({ selectedTournament }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
}));
