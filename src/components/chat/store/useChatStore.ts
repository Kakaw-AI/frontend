import { create } from "zustand";

export interface ChatStoreState {
  // Connection picker
  isConnectionPickerOpen: boolean;
  pickerStartsInAddLlmMode: boolean;

  // Auth
  isSigningOut: boolean;

  // Composer
  composerInput: string;
  composerError: string | null;
  isSending: boolean;
}

export interface ChatStoreActions {
  openPicker: () => void;
  openAddLlmPicker: () => void;
  closePicker: () => void;

  beginSignOut: () => void;
  endSignOut: () => void;

  setComposerInput: (input: string) => void;
  setComposerError: (error: string | null) => void;
  setIsSending: (sending: boolean) => void;
}

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set) => ({
  // Connection picker defaults
  isConnectionPickerOpen: false,
  pickerStartsInAddLlmMode: false,

  // Auth defaults
  isSigningOut: false,

  // Composer defaults
  composerInput: "",
  composerError: null,
  isSending: false,

  // Actions
  openPicker: () =>
    set({
      isConnectionPickerOpen: true,
      pickerStartsInAddLlmMode: false,
      composerError: null,
    }),
  openAddLlmPicker: () =>
    set({
      isConnectionPickerOpen: true,
      pickerStartsInAddLlmMode: true,
      composerError: null,
    }),
  closePicker: () =>
    set({
      isConnectionPickerOpen: false,
      pickerStartsInAddLlmMode: false,
    }),

  beginSignOut: () => set({ isSigningOut: true }),
  endSignOut: () => set({ isSigningOut: false }),

  setComposerInput: (input) => set({ composerInput: input }),
  setComposerError: (error) => set({ composerError: error }),
  setIsSending: (sending) => set({ isSending: sending }),
}));
