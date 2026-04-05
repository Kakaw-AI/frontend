import { create } from "zustand";

export interface ChatStoreState {
  // Connection picker
  isConnectionPickerOpen: boolean;
  pickerStartsInAddLlmMode: boolean;
  
  // Auth & Linking
  isSigningOut: boolean;
  isLinkingGithub: boolean;
  githubLinkError: Error | null;

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

  beginLinkGithub: () => void;
  endLinkGithub: () => void;
  setGithubLinkError: (error: Error | null) => void;

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
  isLinkingGithub: false,
  githubLinkError: null,

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
      githubLinkError: null,
    }),
  openAddLlmPicker: () =>
    set({
      isConnectionPickerOpen: true,
      pickerStartsInAddLlmMode: true,
      composerError: null,
      githubLinkError: null,
    }),
  closePicker: () =>
    set({
      isConnectionPickerOpen: false,
      pickerStartsInAddLlmMode: false,
    }),

  beginSignOut: () => set({ isSigningOut: true }),
  endSignOut: () => set({ isSigningOut: false }),

  beginLinkGithub: () => set({ isLinkingGithub: true, githubLinkError: null }),
  endLinkGithub: () => set({ isLinkingGithub: false }),
  setGithubLinkError: (error) => set({ githubLinkError: error }),

  setComposerInput: (input) => set({ composerInput: input }),
  setComposerError: (error) => set({ composerError: error }),
  setIsSending: (sending) => set({ isSending: sending }),
}));
