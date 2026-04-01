"use client";

import {
  onboardingStoreActions,
  resolveSupportedDatabase,
  useOnboardingStore,
} from "@/lib/stores/onboarding-store";

export function useConnectionDetailsState(initialProvider: string) {
  const connString = useOnboardingStore((state) => state.connString);
  const sqliteFile = useOnboardingStore((state) => state.sqliteFile);
  const provider = resolveSupportedDatabase(initialProvider);

  return {
    provider,
    connString,
    sqliteFile,
    setConnString: onboardingStoreActions.setConnString,
    setSqliteFile: onboardingStoreActions.setSqliteFile,
  };
}
