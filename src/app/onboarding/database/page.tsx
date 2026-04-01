import { ChooseDatabasePage } from "@/components/onboarding/ChooseDatabasePage";

type DatabasePageProps = {
  searchParams: Promise<{
    provider?: string | string[];
  }>;
};

export default async function DatabasePage({ searchParams }: DatabasePageProps) {
  const params = await searchParams;
  const provider = Array.isArray(params.provider)
    ? params.provider[0]
    : params.provider;

  return <ChooseDatabasePage initialProvider={provider ?? "postgresql"} />;
}
