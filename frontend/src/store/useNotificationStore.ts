import { create } from 'zustand';

interface NotificationState {
  hasNewFeed: boolean;
  setHasNewFeed: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  hasNewFeed: true, // 기본적으로 새 피드가 있다고 가정 (빨간 점 표시)
  setHasNewFeed: (value) => set({ hasNewFeed: value }),
}));
