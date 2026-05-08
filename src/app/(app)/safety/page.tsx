import Link from "next/link";
import { listSafetyClips } from "@/lib/data";
import { createSafetyClip, deleteSafetyClip } from "@/actions/safety";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SafetyPage() {
  const clips = await listSafetyClips();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Safety kit</h1>
          <p className="text-[var(--color-text-muted)]">
            Strip metadata on uploads (Compose), log incidents, export evidence.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/api/export/safety">Download evidence zip</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log an incident</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            action={async (fd) => {
              "use server";
              await createSafetyClip(fd);
              revalidatePath("/safety");
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input id="platform" name="platform" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporterUrl">URL / permalink</Label>
                <Input id="reporterUrl" name="reporterUrl" placeholder="https://" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea id="note" name="note" rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="screenshot">Screenshot (optional)</Label>
              <Input id="screenshot" name="screenshot" type="file" accept="image/*" />
            </div>
            <Button type="submit">Save clip</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Evidence log</h2>
        {clips.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              No clips yet — add one if you need a paper trail.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {clips.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.platform}</CardTitle>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(c.capturedAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {c.reporterUrl && (
                    <a
                      className="text-[var(--color-accent)] underline-offset-4 hover:underline"
                      href={c.reporterUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open link
                    </a>
                  )}
                  {c.note && <p className="whitespace-pre-wrap">{c.note}</p>}
                  {c.screenshotBlobUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.screenshotBlobUrl}
                      alt="Evidence screenshot"
                      className="rounded-[var(--radius-md)] border border-[var(--color-border)]"
                    />
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await deleteSafetyClip(c.id);
                      revalidatePath("/safety");
                    }}
                  >
                    <Button size="sm" variant="outline" type="submit">
                      Delete clip
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
