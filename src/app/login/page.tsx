import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserEmail } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Icon } from "@/components/Icon";

export const metadata = {
  title: "Sign in · Socialella",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const existing = await getCurrentUserEmail();
  if (existing) {
    redirect(sp.next && sp.next.startsWith("/") ? sp.next : "/dashboard");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <main className="flex flex-col px-6 py-10 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[var(--gray-900)]"
        >
          <span className="text-lg font-semibold tracking-tight">socialella</span>
          <Icon
            name="Heart"
            weight="fill"
            className="h-3.5 w-3.5 text-[var(--pink-500)]"
            aria-hidden
          />
        </Link>

        <div className="mt-12 flex flex-1 flex-col justify-center sm:mt-20">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--gray-900)] sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-[var(--gray-600)]">
              Sign in to keep promoting your apps without burning out.
            </p>

            <div className="mt-8">
              <LoginForm next={sp.next} initialError={sp.error} />
            </div>

            <p className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--gray-200)] bg-[var(--gray-50)] p-3 text-[11px] text-[var(--gray-600)]">
              Demo credentials: <span className="font-mono text-[var(--gray-900)]">admin@admin.com</span>{" "}
              / <span className="font-mono text-[var(--gray-900)]">password123</span>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-[var(--gray-500)]">
          New here?{" "}
          <Link href="/" className="font-semibold text-[var(--violet-600)] hover:underline">
            See what Socialella does
          </Link>
        </p>
      </main>

      <aside
        aria-hidden
        className="relative hidden overflow-hidden lg:block"
        style={{
          background:
            "linear-gradient(135deg, var(--pink-50) 0%, var(--violet-100) 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 320px at 20% 30%, rgba(255,255,255,0.7) 0%, transparent 60%), radial-gradient(700px 360px at 90% 80%, rgba(255,255,255,0.45) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--violet-700)]">
            <Icon name="Sparkle" weight="fill" className="h-3.5 w-3.5" />
            Built for indie founders (especially women)
          </div>

          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--violet-700)]">
              Hand-off mode
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[var(--gray-900)]">
              Compose once. <br />
              Ship across every platform.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--gray-700)]">
              Socialella tailors your post per channel, runs a confidence pass,
              and copies + opens each composer for you. You stay in control.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[var(--gray-700)]">
              {[
                "Confidence pass before you ship",
                "Energy-aware schedule suggestions",
                "Founder checklist & evergreen recycle",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Icon
                    name="CheckCircle"
                    weight="fill"
                    className="h-4 w-4 text-[var(--violet-600)]"
                  />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-[var(--violet-700)]">
            © {new Date().getFullYear()} Socialella
          </p>
        </div>
      </aside>
    </div>
  );
}
