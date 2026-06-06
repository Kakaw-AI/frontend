"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import {
  resolveSupportedDatabase,
  type SupportedDatabase,
} from "@/lib/stores/onboarding-store";

type DatabaseId =
  | SupportedDatabase
  | "mysql"
  | "bigquery"
  | "snowflake"
  | "mongodb";

type DbOption = {
  id: DatabaseId;
  label: string;
  description: string;
  supported: boolean;
  comingSoon?: boolean;
};

const DB_OPTIONS: DbOption[] = [
  {
    id: "postgresql",
    label: "PostgreSQL",
    description: "Production-ready relational engine",
    supported: true,
  },
  {
    id: "sqlite",
    label: "SQLite",
    description: "Lightweight local database for fast starts",
    supported: true,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description: "Document database support is on the roadmap",
    supported: false,
    comingSoon: true,
  },
  {
    id: "mysql",
    label: "MySQL",
    description: "Classic web-scale SQL support is coming soon",
    supported: false,
    comingSoon: true,
  },
  {
    id: "bigquery",
    label: "BigQuery",
    description: "Warehouse connectors are coming soon",
    supported: false,
    comingSoon: true,
  },
  {
    id: "snowflake",
    label: "Snowflake",
    description: "Cloud warehouse support is coming soon",
    supported: false,
    comingSoon: true,
  },
];

export function ChooseDatabasePage({
  initialProvider,
}: {
  initialProvider: string;
}) {
  const router = useRouter();
  const routeProvider = resolveSupportedDatabase(initialProvider);
  const activeSelection = routeProvider;

  return (
    <>
      <div className="max-w-5xl w-full mx-auto px-5 sm:px-8 md:px-12 py-10 md:py-16 flex-1">
        <div className="mb-12 space-y-2">
          <span className="font-body text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Step 01
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline italic text-on-surface leading-tight">
            What database do you use?
          </h1>
          <p className="text-on-surface-variant max-w-xl font-body mt-4 leading-relaxed opacity-80">
            PostgreSQL and SQLite are ready today. The rest of our connector
            lineup is already in motion and marked below as coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DB_OPTIONS.map((db) => (
            <label
              key={db.id}
              className={`group relative ${db.supported ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <input
                type="radio"
                name="db_choice"
                value={db.id}
                checked={activeSelection === db.id}
                onChange={() => {
                  if (db.supported) {
                    router.replace(
                      `/onboarding/database?provider=${encodeURIComponent(
                        resolveSupportedDatabase(db.id),
                      )}`,
                    );
                  }
                }}
                disabled={!db.supported}
                className="peer sr-only"
              />
              <div
                className={`h-full p-8 border transition-all duration-300 ease-in-out ${
                  db.supported
                    ? "bg-surface-container-lowest border-transparent peer-checked:bg-secondary-container/30 peer-checked:border-primary hover:bg-surface-container-low group-active:scale-[0.98]"
                    : "bg-surface-container-lowest/60 border-outline-variant/15 opacity-55 grayscale"
                }`}
              >
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
                        db.supported
                          ? "bg-surface-container text-primary group-hover:bg-primary-container group-hover:text-on-primary-container"
                          : "bg-surface-container text-on-surface/60"
                      }`}
                    >
                      <DatabaseLogo provider={db.id} className="h-7 w-7" />
                    </div>
                    {db.comingSoon ? (
                      <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface/60">
                        Coming Soon
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                        Supported
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-lg text-on-surface">
                      {db.label}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 opacity-70">
                      {db.description}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>


      </div>

      <footer className="sticky bottom-0 bg-surface/80 backdrop-blur-md px-5 sm:px-8 md:px-12 py-4 md:py-6 flex flex-wrap gap-3 justify-between items-center w-full max-w-5xl mx-auto border-t border-outline-variant/15">
        <Link
          href="/"
          className="px-8 py-3 text-primary font-body font-medium hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs font-body text-on-surface-variant opacity-50 uppercase tracking-widest">
            Page 1 of 2
          </span>
          <Link
            href={`/onboarding/connection?provider=${encodeURIComponent(activeSelection)}`}
            className="px-10 py-3 bg-linear-to-br from-primary to-primary-container text-on-primary font-body font-semibold rounded-md shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            Continue
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </>
  );
}
