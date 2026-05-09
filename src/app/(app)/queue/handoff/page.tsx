import Link from "next/link";
import { getDb } from "@/db";
import { apps, postMedia, postVariants } from "@/db/schema";
import { listHandoffCandidates } from "@/lib/data";
import { getBlueskyConnection } from "@/actions/connections";
import { HandoffWalkthrough } from "@/components/handoff/handoff-walkthrough";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function HandoffPage() {
  const db = getDb();

  // Pull everything in one batch — small datasets, single-user app.
  const [readyPosts, allApps, allVariants, allMedia, bluesky] =
    await Promise.all([
      listHandoffCandidates(12),
      db.select().from(apps),
      db.select().from(postVariants),
      db.select().from(postMedia),
      getBlueskyConnection(),
    ]);

  const appById = new Map(allApps.map((a) => [a.id, a]));
  const variantsByPost = new Map<string, typeof allVariants>();
  for (const v of allVariants) {
    const list = variantsByPost.get(v.postId) ?? [];
    list.push(v);
    variantsByPost.set(v.postId, list);
  }
  const mediaByPost = new Map<
    string,
    { url: string; alt: string }[]
  >();
  for (const m of allMedia) {
    const list = mediaByPost.get(m.postId) ?? [];
    list.push({ url: m.blobUrl, alt: m.altText });
    mediaByPost.set(m.postId, list);
  }

  const items = readyPosts.map((post) => {
    const a = appById.get(post.appId);
    return {
      post,
      variants: variantsByPost.get(post.id) ?? [],
      appName: a?.name ?? "App",
      appColor: a?.color ?? "var(--gray-400)",
      appUrl: a?.url ?? null,
      media: mediaByPost.get(post.id) ?? [],
    };
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-1.5 text-[26px] font-bold tracking-tight text-[var(--gray-900)]">
            <Icon
              name="Sparkle"
              weight="fill"
              className="h-5 w-5 text-[var(--violet-500)]"
            />
            Hand-off mode
          </h1>
          <p className="mt-1 text-sm text-[var(--gray-600)]">
            One post at a time. Copy, open the platform, post, mark posted.
          </p>
        </div>
        <Link
          href="/queue"
          className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
        >
          Back to queue
        </Link>
      </header>

      <HandoffWalkthrough items={items} blueskyConnected={Boolean(bluesky)} />
    </div>
  );
}
