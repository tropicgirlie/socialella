"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toast } from "sonner";
import type { posts } from "@/db/schema";
import { reschedulePost } from "@/actions/posts";
import { mergeKeepLocalTime } from "@/lib/date-utils";
import { PLATFORM_LABELS, PLATFORMS, type PlatformId } from "@/lib/constants";
import { getComposerDeepLink } from "@/lib/platform-links";
import { HandoffPanel } from "@/components/handoff/handoff-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PostRow = typeof posts.$inferSelect;

export function QueueView(props: {
  scheduled: PostRow[];
  ready: PostRow[];
  posted: PostRow[];
  appNames: Record<string, string>;
}) {
  const router = useRouter();
  const scheduled = props.scheduled;
  const ready = props.ready;
  const posted = props.posted;
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [pending, startTransition] = useTransition();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const scheduledById = useMemo(() => {
    const m = new Map<string, PostRow>();
    for (const p of scheduled) m.set(p.id, p);
    return m;
  }, [scheduled]);

  function postsForDay(day: Date) {
    return scheduled.filter(
      (p) => p.scheduledFor && isSameDay(new Date(p.scheduledFor), day),
    );
  }

  function onDragEnd(result: DropResult) {
    const { destination, draggableId, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    const post = scheduledById.get(draggableId);
    if (!post?.scheduledFor) return;
    const targetDay = weekDays.find(
      (_, i) => `day-${i}` === destination.droppableId,
    );
    if (!targetDay) return;
    const nextWhen = mergeKeepLocalTime(post.scheduledFor, targetDay);
    startTransition(async () => {
      const res = await reschedulePost(post.id, nextWhen.toISOString());
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      toast.success("Rescheduled.");
      router.refresh();
    });
  }

  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthGrid = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  return (
    <Tabs defaultValue="list">
      <TabsList className="mb-4 flex h-auto w-full flex-wrap gap-1">
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="week">Week board</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-8">
        <PostSection
          title="Ready to post"
          description="One tap per platform — caption goes to your clipboard, the composer opens, you review and post."
          posts={ready}
          appNames={props.appNames}
          mode="ready"
        />
        <PostSection
          title="Scheduled"
          description="Drag posts on the Week board to reshuffle days."
          posts={scheduled}
          appNames={props.appNames}
          mode="scheduled"
        />
        <PostSection
          title="Posted"
          description="Archive from the library if you want these out of sight."
          posts={posted}
          appNames={props.appNames}
          mode="posted"
        />
      </TabsContent>

      <TabsContent value="week">
        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex min-w-[720px] gap-2">
                {weekDays.map((day, index) => (
                  <Droppable droppableId={`day-${index}`} key={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex min-h-[280px] flex-1 flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/40 p-2",
                          snapshot.isDraggingOver && "ring-2 ring-[var(--brand-500)]",
                        )}
                      >
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                          {format(day, "EEE d MMM")}
                        </p>
                        {postsForDay(day).map((post, idx) => (
                          <Draggable
                            draggableId={post.id}
                            index={idx}
                            key={post.id}
                          >
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className="mb-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 text-sm shadow-[var(--shadow-sm)]"
                              >
                                <p className="line-clamp-3 font-medium">
                                  {post.baseContent || "(empty)"}
                                </p>
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                  {props.appNames[post.appId] ?? "App"}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {PLATFORMS.slice(0, 3).map((p) => (
                                    <Button key={p} size="sm" variant="outline" asChild>
                                      <a
                                        href={getComposerDeepLink(
                                          p,
                                          post.baseContent,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {PLATFORM_LABELS[p]}
                                      </a>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Drag cards between days to reschedule while keeping the same time
              of day.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="month">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>{format(monthCursor, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setMonthCursor((d) =>
                    new Date(d.getFullYear(), d.getMonth() - 1, 1),
                  )
                }
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setMonthCursor((d) =>
                    new Date(d.getFullYear(), d.getMonth() + 1, 1),
                  )
                }
              >
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.map((day) => {
                const inMonth = isSameMonth(day, monthCursor);
                const count = scheduled.filter(
                  (p) =>
                    p.scheduledFor && isSameDay(new Date(p.scheduledFor), day),
                ).length;
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[88px] rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 text-left text-xs",
                      inMonth
                        ? "bg-[var(--color-bg-elevated)]"
                        : "bg-[var(--color-bg-muted)]/40 text-[var(--color-text-muted)]",
                    )}
                  >
                    <div className="font-semibold">{format(day, "d")}</div>
                    {count > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        {count} scheduled
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {pending && (
        <p className="text-sm text-[var(--color-text-muted)]">Updating…</p>
      )}
    </Tabs>
  );
}

function PostSection(props: {
  title: string;
  description: string;
  posts: PostRow[];
  appNames: Record<string, string>;
  mode: "ready" | "scheduled" | "posted";
}) {
  const router = useRouter();
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-2xl tracking-tight">{props.title}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {props.description}
        </p>
      </div>
      {props.posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--color-text-muted)]">
            Nothing here yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {props.posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">
                  {props.appNames[post.appId] ?? "App"}
                </CardTitle>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {post.scheduledFor
                    ? format(new Date(post.scheduledFor), "PPpp")
                    : props.mode === "posted" && post.postedAt
                      ? `Posted ${format(new Date(post.postedAt), "PPpp")}`
                      : "No schedule"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="line-clamp-4 whitespace-pre-wrap">
                  {post.baseContent || "(empty)"}
                </p>

                {props.mode === "ready" && <HandoffPanel postId={post.id} />}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/compose?id=${post.id}`}>Edit</Link>
                  </Button>
                  {props.mode === "scheduled" && (
                    <form
                      className="flex flex-wrap items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const dt = String(fd.get("dt"));
                        if (!dt) return;
                        const iso = new Date(dt).toISOString();
                        void reschedulePost(post.id, iso).then((res) => {
                          if ("error" in res && res.error) {
                            toast.error(String(res.error));
                          } else {
                            toast.success("Updated.");
                            router.refresh();
                          }
                        });
                      }}
                    >
                      <Input
                        type="datetime-local"
                        name="dt"
                        defaultValue={
                          post.scheduledFor
                            ? format(
                                new Date(post.scheduledFor),
                                "yyyy-MM-dd'T'HH:mm",
                              )
                            : ""
                        }
                        className="w-auto"
                      />
                      <Button size="sm" type="submit" variant="outline">
                        Reschedule
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
