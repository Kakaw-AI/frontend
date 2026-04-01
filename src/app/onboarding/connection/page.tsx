import { ConnectionDetailsPage } from "@/components/onboarding/ConnectionDetailsPage";

type ConnectionPageProps = {
  searchParams: Promise<{
    provider?: string | string[];
  }>;
};

export default async function ConnectionPage({
  searchParams,
}: ConnectionPageProps) {
  const params = await searchParams;
  const provider = Array.isArray(params.provider)
    ? params.provider[0]
    : params.provider;

  return <ConnectionDetailsPage initialProvider={provider ?? "postgresql"} />;
}
