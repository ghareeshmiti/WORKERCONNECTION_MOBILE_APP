import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkerProfile } from '../types';

interface AppState {
    // Worker Profile
    workerProfile: WorkerProfile | null;
    setWorkerProfile: (profile: WorkerProfile | null) => void;

    // PIN Storage (encrypted separately)
    hasPinSet: boolean;
    setHasPinSet: (value: boolean) => void;

    // Offline Queue
    offlineQueue: any[];
    addToOfflineQueue: (item: any) => void;
    clearOfflineQueue: () => void;

    // Last Sync Time
    lastSyncTime: number | null;
    setLastSyncTime: (time: number) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Worker Profile
            workerProfile: null,
            setWorkerProfile: (profile) => set({ workerProfile: profile }),

            // PIN
            hasPinSet: false,
            setHasPinSet: (value) => set({ hasPinSet: value }),

            // Offline Queue
            offlineQueue: [],
            addToOfflineQueue: (item) =>
                set((state) => ({ offlineQueue: [...state.offlineQueue, item] })),
            clearOfflineQueue: () => set({ offlineQueue: [] }),

            // Sync
            lastSyncTime: null,
            setLastSyncTime: (time) => set({ lastSyncTime: time }),
        }),
        {
            name: 'fido-miti-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
