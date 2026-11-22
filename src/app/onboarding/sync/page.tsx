import { DatabaseSyncPage } from "@/components/onboarding/DatabaseSyncPage";

type SyncPageProps = {
  searchParams: Promise<{
    sourceId?: string | string[];
  }>;
};

export default async function OnboardingSyncPage({ searchParams }: SyncPageProps) {
  const params = await searchParams;
  const sourceId = Array.isArray(params.sourceId) ? params.sourceId[0] : params.sourceId;

  return <DatabaseSyncPage sourceId={sourceId ?? null} />;
}
