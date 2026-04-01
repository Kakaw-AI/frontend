"use client";

export type DatabaseProvider =
  | "postgresql"
  | "sqlite"
  | "mysql"
  | "bigquery"
  | "snowflake"
  | "mongodb";

type DatabaseLogoProps = {
  provider: DatabaseProvider;
  className?: string;
};

function BaseLogo({
  className,
  background,
  children,
}: {
  className: string;
  background: string;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={background} />
      {children}
    </svg>
  );
}

function PostgreSqlLogo({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 25.6 25.6" className={className} aria-hidden="true">
      <path
        d="M23.535 15.6c-2.89.596-3.1-.383-3.1-.383 3.053-4.53 4.33-10.28 3.228-11.687-3.004-3.84-8.205-2.023-8.292-1.976l-.028.005a10.31 10.31 0 0 0-1.929-.201c-1.308-.02-2.3.343-3.054.914 0 0-9.278-3.822-8.846 4.807.092 1.836 2.63 13.9 5.66 10.25C8.29 15.987 9.36 14.86 9.36 14.86c.53.353 1.167.533 1.834.468l.052-.044a2.02 2.02 0 0 0 .021.518c-.78.872-.55 1.025-2.11 1.346-1.578.325-.65.904-.046 1.056.734.184 2.432.444 3.58-1.162l-.046.183c.306.245.52 1.593.484 2.815s-.06 2.06.18 2.716.48 2.13 2.53 1.7c1.713-.367 2.6-1.32 2.725-2.906.088-1.128.286-.962.3-1.97l.16-.478c.183-1.53.03-2.023 1.085-1.793l.257.023c.777.035 1.794-.125 2.39-.402 1.285-.596 2.047-1.592.78-1.33z"
        fill="#336791"
      />
      <path
        d="M12.814 16.467c-.08 2.846.02 5.712.298 6.4s.875 2.05 2.926 1.612c1.713-.367 2.337-1.078 2.607-2.647l.633-5.017M10.356 2.2S1.072-1.596 1.504 7.033c.092 1.836 2.63 13.9 5.66 10.25C8.27 15.95 9.27 14.907 9.27 14.907m6.1-13.4c-.32.1 5.164-2.005 8.282 1.978 1.1 1.407-.175 7.157-3.228 11.687"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth=".716"
      />
      <path
        d="M20.425 15.17s.2.98 3.1.382c1.267-.262.504.734-.78 1.33-1.054.49-3.418.615-3.457-.06-.1-1.745 1.244-1.215 1.147-1.652-.088-.394-.69-.78-1.086-1.744-.347-.84-4.76-7.29 1.224-6.333.22-.045-1.56-5.7-7.16-5.782S7.99 8.196 7.99 8.196"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="bevel"
        strokeWidth=".716"
      />
      <path
        d="M11.247 15.768c-.78.872-.55 1.025-2.11 1.346-1.578.325-.65.904-.046 1.056.734.184 2.432.444 3.58-1.163.35-.49-.002-1.27-.482-1.468-.232-.096-.542-.216-.94.23z"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth=".716"
      />
      <path
        d="M11.196 15.753c-.08-.513.168-1.122.433-1.836.398-1.07 1.316-2.14.582-5.537-.547-2.53-4.22-.527-4.22-.184s.166 1.74-.06 3.365c-.297 2.122 1.35 3.916 3.246 3.733"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth=".716"
      />
      <path
        d="M10.322 8.145c-.017.117.215.43.516.472s.558-.202.575-.32-.215-.246-.516-.288-.56.02-.575.136z"
        fill="#FFFFFF"
      />
      <path
        d="M19.486 7.906c.016.117-.215.43-.516.472s-.56-.202-.575-.32.215-.246.516-.288.56.02.575.136z"
        fill="#FFFFFF"
      />
      <path
        d="M20.562 7.095c.05.92-.198 1.545-.23 2.524-.046 1.422.678 3.05-.413 4.68"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth=".716"
      />
    </svg>
  );
}

function SqliteLogo({ className }: { className: string }) {
  return (
    <BaseLogo className={className} background="#0F80CC">
      <path
        d="M9 7.5h8.7l5.3 5.3v11.7H9z"
        fill="#FFFFFF"
      />
      <path d="M17.7 7.5v5.3H23" fill="#D9EEFF" />
      <path
        d="M11.8 18.2h8.2M11.8 20.8h6.6"
        stroke="#0F80CC"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <rect x="11.8" y="13.1" width="5.2" height="2.4" rx="1.2" fill="#0F80CC" />
    </BaseLogo>
  );
}

function MySqlLogo({ className }: { className: string }) {
  return (
    <BaseLogo className={className} background="#005C84">
      <ellipse cx="12.5" cy="11.2" rx="4.7" ry="2.2" fill="#CBEAF8" />
      <path d="M7.8 11.2v5.5c0 1.2 2.1 2.2 4.7 2.2s4.7-1 4.7-2.2v-5.5" fill="#CBEAF8" />
      <ellipse cx="12.5" cy="16.7" rx="4.7" ry="2.2" fill="#9BD7F0" />
      <path
        d="M17.2 20.2c2.4-3.9 5.1-5.9 8-6.1-1 1-1.6 1.8-1.7 2.5 1.1-.1 2.2.3 3.3 1.1-1.2-.1-2.3.2-3.2.8 1 .7 1.6 1.8 1.8 3.3-.8-1-1.7-1.7-2.8-2.1-.8 1.1-1.9 1.9-3.4 2.5"
        fill="none"
        stroke="#F29111"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </BaseLogo>
  );
}

function BigQueryLogo({ className }: { className: string }) {
  return (
    <BaseLogo className={className} background="#4285F4">
      <path
        d="M10 10.5h8.4c1 0 1.8.8 1.8 1.8v7.3c0 1-.8 1.8-1.8 1.8H10c-1 0-1.8-.8-1.8-1.8v-7.3c0-1 .8-1.8 1.8-1.8Z"
        fill="#FFFFFF"
      />
      <circle cx="21.4" cy="20.1" r="3.2" fill="none" stroke="#34A853" strokeWidth="1.8" />
      <path
        d="M23.7 22.4 25.9 24.6M12 14.1h4.6M12 17h6.2"
        fill="none"
        stroke="#4285F4"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </BaseLogo>
  );
}

function SnowflakeLogo({ className }: { className: string }) {
  return (
    <BaseLogo className={className} background="#29B5E8">
      <path
        d="M16 8.3v15.4M10.2 11.6l11.6 8.8M21.8 11.6l-11.6 8.8M11.6 10.2l8.8 11.6M20.4 10.2l-8.8 11.6"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="16" cy="16" r="2" fill="#FFFFFF" />
    </BaseLogo>
  );
}

function MongoDbLogo({ className }: { className: string }) {
  return (
    <BaseLogo className={className} background="#0F2A1D">
      <path
        d="M16 7.6c2.5 3 3.8 5.9 3.8 8.7 0 4.1-2.3 7.1-3.8 8.1-1.5-1-3.8-4-3.8-8.1 0-2.8 1.3-5.7 3.8-8.7Z"
        fill="#13AA52"
      />
      <path
        d="M16 9.8c.7 2 1 4.3 1 6.8 0 2.7-.3 4.9-1 6.7-.7-1.8-1-4-1-6.7 0-2.5.3-4.8 1-6.8Z"
        fill="#D5E6DE"
      />
    </BaseLogo>
  );
}

export function DatabaseLogo({
  provider,
  className = "h-7 w-7",
}: DatabaseLogoProps) {
  switch (provider) {
    case "postgresql":
      return <PostgreSqlLogo className={className} />;
    case "sqlite":
      return <SqliteLogo className={className} />;
    case "mysql":
      return <MySqlLogo className={className} />;
    case "bigquery":
      return <BigQueryLogo className={className} />;
    case "snowflake":
      return <SnowflakeLogo className={className} />;
    case "mongodb":
      return <MongoDbLogo className={className} />;
  }
}
