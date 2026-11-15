import { create } from "zustand";

export type PendingConversation = {
  databaseSourceId: string;
  llmConnectionId: string;
};

interface ChatStoreState {
  // Mobile conversation drawer
  isSidebarOpen: boolean;

  // Connection picker
  isConnectionPickerOpen: boolean;
  pickerStartsInAddLlmMode: boolean;

  // Auth
  isSigningOut: boolean;

  // Composer
  composerInput: string;
  composerError: string | null;
  isSending: boolean;
  /** Off sends "no thinking" to local models. */
  thinkingEnabled: boolean;

  // User's runtime pick on the new-chat screen (/chat); null = use the default
  pendingConversation: PendingConversation | null;
}

interface ChatStoreActions {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  openAddLlmPicker: () => void;
  closePicker: () => void;

  beginSignOut: () => void;
  endSignOut: () => void;

  setComposerInput: (input: string) => void;
  setComposerError: (error: string | null) => void;
  setIsSending: (sending: boolean) => void;
  toggleThinking: () => void;

  setPendingConversation: (p: PendingConversation | null) => void;
  clearPendingConversation: () => void;
}

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set) => ({
  // Mobile drawer default
  isSidebarOpen: false,

  // Connection picker defaults
  isConnectionPickerOpen: false,
  pickerStartsInAddLlmMode: false,

  // Auth defaults
  isSigningOut: false,

  // Composer defaults
  composerInput: "",
  composerError: null,
  isSending: false,
  thinkingEnabled: true,

  // Ephemeral defaults
  pendingConversation: null,

  // Actions
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

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
  toggleThinking: () => set((s) => ({ thinkingEnabled: !s.thinkingEnabled })),

  setPendingConversation: (p) => set({ pendingConversation: p }),
  clearPendingConversation: () => set({ pendingConversation: null }),
}));
