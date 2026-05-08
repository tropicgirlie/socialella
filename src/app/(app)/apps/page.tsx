import { revalidatePath } from "next/cache";
import {
  createApp,
  createCampaign,
  deleteApp,
  deleteCampaign,
  updateApp,
} from "@/actions/apps";
import { listApps, listCampaignsForApp } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const ICONS = [
  "RocketLaunch",
  "Heart",
  "Star",
  "Code",
  "DeviceMobile",
  "PaintBrush",
  "Sparkle",
  "Leaf",
] as const;

export default async function AppsPage() {
  const apps = await listApps();
  const appsWithCampaigns = await Promise.all(
    apps.map(async (app) => ({
      app,
      campaigns: await listCampaignsForApp(app.id),
    })),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Apps & campaigns
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Each post promotes one app — track coverage from the dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add app</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            action={async (fd) => {
              "use server";
              await createApp(fd);
              revalidatePath("/apps");
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="My product" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Brand color</Label>
              <Input
                id="color"
                name="color"
                type="color"
                defaultValue="#0891b2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <select
                id="icon"
                name="icon"
                className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
                defaultValue="RocketLaunch"
              >
                {ICONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" placeholder="https://" />
            </div>
            <Button type="submit">Create app</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {appsWithCampaigns.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No apps yet — add one above.
          </p>
        ) : (
          appsWithCampaigns.map(({ app, campaigns }) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle>{app.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  className="grid gap-4 md:grid-cols-2"
                  action={async (fd) => {
                    "use server";
                    await updateApp(app.id, fd);
                    revalidatePath("/apps");
                  }}
                >
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`name-${app.id}`}>Name</Label>
                    <Input
                      id={`name-${app.id}`}
                      name="name"
                      defaultValue={app.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`color-${app.id}`}>Brand color</Label>
                    <Input
                      id={`color-${app.id}`}
                      name="color"
                      type="color"
                      defaultValue={app.color}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`icon-${app.id}`}>Icon</Label>
                    <select
                      id={`icon-${app.id}`}
                      name="icon"
                      className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
                      defaultValue={app.icon}
                    >
                      {ICONS.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`url-${app.id}`}>URL</Label>
                    <Input
                      id={`url-${app.id}`}
                      name="url"
                      defaultValue={app.url ?? ""}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <Button type="submit">Save app</Button>
                  </div>
                </form>

                <form
                  action={async () => {
                    "use server";
                    await deleteApp(app.id);
                    revalidatePath("/apps");
                  }}
                >
                  <Button type="submit" variant="destructive">
                    Delete app
                  </Button>
                </form>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold">Campaigns</h3>
                  <form
                    className="grid gap-3 md:grid-cols-3"
                    action={async (fd) => {
                      "use server";
                      await createCampaign(app.id, fd);
                      revalidatePath("/apps");
                    }}
                  >
                    <Input name="name" placeholder="Campaign name" required />
                    <Input name="goal" placeholder="Goal (optional)" />
                    <Input
                      name="plannedPostCount"
                      type="number"
                      min={0}
                      placeholder="Planned posts"
                    />
                    <Button type="submit" className="md:col-span-3 w-fit">
                      Add campaign
                    </Button>
                  </form>

                  <ul className="space-y-2 text-sm">
                    {campaigns.map((c) => (
                      <li key={c.id}>
                        <form
                          className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2"
                          action={async () => {
                            "use server";
                            await deleteCampaign(c.id);
                            revalidatePath("/apps");
                          }}
                        >
                          <span>{c.name}</span>
                          <Button size="sm" variant="outline" type="submit">
                            Remove
                          </Button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
