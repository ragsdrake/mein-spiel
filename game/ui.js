/** Transient UI state: which build sheet tab is open (tapping a padlock in 3D opens it too). */
import { create } from 'zustand';

const useUi = create((set) => ({
  sheet:     null,          // null | 'rooms' | 'bar' | 'staff' | 'guests'
  focusRoom: null,
  openSheet: (tab, focusRoom = null) => set({ sheet: tab, focusRoom }),
  closeSheet: () => set({ sheet: null, focusRoom: null }),
}));

export default useUi;
