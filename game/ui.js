/**
 * Transient UI state: which sheet is open, which station's upgrade card is
 * shown (tapping a room/bar/reception in 3D opens it) and the ad overlay.
 */
import { create } from 'zustand';

const useUi = create((set) => ({
  sheet:     null,          // null | 'rooms' | 'ops' | 'staff' | 'quests' | 'hotels' | 'guests' | 'shop' | 'settings' | 'upgrade'
  focusRoom: null,
  /** Station for the upgrade card: { kind: 'room' | 'bar' | 'reception', index? } */
  target:    null,
  /** Rewarded-ad placeholder: { placement, resolve } while "playing". */
  ad:        null,
  openSheet: (tab, focusRoom = null) => set({ sheet: tab, focusRoom }),
  openUpgrade: (kind, index = null) => set({ sheet: 'upgrade', target: { kind, index } }),
  closeSheet: () => set({ sheet: null, focusRoom: null, target: null }),
}));

export default useUi;
