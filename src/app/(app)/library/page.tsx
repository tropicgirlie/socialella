import Link from "next/link";
import {
  listDraftsAndArchived,
  listEvergreenPool,
} from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const drafts = await listDraftsAndArchived();
  const evergreen = await listEvergreenPool();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Library</h1>
        <p className="text-[var(--color-text-muted)]">
          Drafts, evergreen wins you already shipped, and archived posts.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Drafts & archived</h2>
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              Nothing here — start in Compose.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {drafts.map((p) => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="text-base line-clamp-2">
                    {p.baseContent || "(empty)"}
                  </CardTitle>
                  <Badge variant="secondary">{p.status}</Badge>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/compose?id=${p.id}`}>Edit</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Evergreen pool</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Posted evergreen content eligible for resurfacing (cooldown controlled
          in Settings).
        </p>
        {evergreen.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              Mark posts as evergreen when composing and ship them once — they’ll
              appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {evergreen.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base line-clamp-3">
                    {p.baseContent}
                  </CardTitle>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Last resurfaced:{" "}
                    {p.lastResurfacedAt
                      ? new Date(p.lastResurfacedAt).toLocaleDateString()
                      : "never"}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
