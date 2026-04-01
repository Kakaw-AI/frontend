"use client";

import { createStore, useStore } from "@/lib/state/create-store";

const SUPPORTED_DATABASES = ["postgresql", "sqlite"] as const;

export type SupportedDatabase = (typeof SUPPORTED_DATABASES)[number];

type OnboardingState = {
  connString: string;
  sqliteFile: File | null;
};

const onboardingStore = createStore<OnboardingState>({
  connString: "",
  sqliteFile: null,
});

export function resolveSupportedDatabase(value: string): SupportedDatabase {
  return SUPPORTED_DATABASES.includes(value as SupportedDatabase)
    ? (value as SupportedDatabase)
    : "postgresql";
}

export function useOnboardingStore<TSelected>(
  selector: (state: OnboardingState) => TSelected,
) {
  return useStore(onboardingStore, selector);
}

export const onboardingStoreActions = {
  setConnString(connString: string) {
    onboardingStore.setState((state) => ({
      ...state,
      connString,
    }));
  },
  setSqliteFile(sqliteFile: File | null) {
    onboardingStore.setState((state) => ({
      ...state,
      sqliteFile,
    }));
  },
};
