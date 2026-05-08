import { AppShell } from "@/components/app-shell";

const REQUIRED_SERVER_ENV = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "APP_PASSWORD_HASH",
] as const;

function MissingEnvNotice({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-6 text-center text-[var(--color-text)]">
      <h1 className="text-xl font-semibold">Configuration missing</h1>
      <p className="max-w-md text-sm text-[var(--color-text-muted)]">
        This environment is missing:{" "}
        <span className="font-mono text-[var(--color-text)]">
          {missing.join(", ")}
        </span>
        . In the Vercel dashboard, open{" "}
        <strong>Project → Settings → Environment Variables</strong> and add the
        same values for <strong>Preview</strong> and <strong>Development</strong>,
        not only Production, then redeploy.
      </p>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const missing = REQUIRED_SERVER_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return <MissingEnvNotice missing={[...missing]} />;
  }
  return <AppShell>{children}</AppShell>;
}
