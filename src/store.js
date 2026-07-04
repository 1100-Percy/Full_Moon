import { create } from 'zustand';

const initialPairId = localStorage.getItem('moon:pairId') || '';
const initialRole = new URLSearchParams(window.location.search).get('as') || localStorage.getItem('moon:role') || 'A';

export const useMoonStore = create((set) => ({
  pairId: initialPairId,
  role: initialRole === 'B' ? 'B' : 'A',
  setPairId: (pairId) => {
    localStorage.setItem('moon:pairId', pairId);
    set({ pairId });
  },
  setRole: (role) => {
    const nextRole = role === 'B' ? 'B' : 'A';
    localStorage.setItem('moon:role', nextRole);
    set({ role: nextRole });
  },
}));
