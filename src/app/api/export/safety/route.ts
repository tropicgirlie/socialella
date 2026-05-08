import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/auth";
import { listSafetyClips } from "@/lib/data";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clips = await listSafetyClips();
  const zip = new JSZip();

  let md = `# Socialella safety export\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;

  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    md += `## Record ${i + 1}\n`;
    md += `- id: ${c.id}\n`;
    md += `- platform: ${c.platform}\n`;
    md += `- capturedAt: ${c.capturedAt?.toISOString?.() ?? String(c.capturedAt)}\n`;
    md += `- reporterUrl: ${c.reporterUrl ?? ""}\n`;
    md += `- note:\n\n${c.note ?? ""}\n\n`;

    if (c.screenshotBlobUrl) {
      try {
        const res = await fetch(c.screenshotBlobUrl);
        const buf = Buffer.from(await res.arrayBuffer());
        zip.file(`screenshots/${c.id}.png`, buf);
      } catch {
        md += `_Screenshot fetch failed for ${c.id}_\n\n`;
      }
    }
  }

  zip.file("report.md", md);
  const out = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(out), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="socialella-safety.zip"',
    },
  });
}
