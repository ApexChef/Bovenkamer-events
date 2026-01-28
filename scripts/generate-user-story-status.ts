#!/usr/bin/env npx tsx

/**
 * User Story Status Generator
 *
 * Parses YAML frontmatter from all user story README.md files
 * and generates a markdown status table.
 *
 * Usage:
 *   npx tsx scripts/generate-user-story-status.ts
 *   npx tsx scripts/generate-user-story-status.ts --update  # Updates docs/user-stories/README.md
 */

import * as fs from "fs";
import * as path from "path";

interface UserStoryMeta {
  id: string;
  title: string;
  status: string;
  priority: string | number;
  complexity: string;
  type: string;
  pr: number | number[] | null;
  created: string;
  updated: string;
  folder: string;
}

const STATUS_ICONS: Record<string, string> = {
  done: "✅ DONE",
  "in-progress": "🔧 IN PROGRESS",
  testing: "🧪 TESTING",
  "code-complete": "🧪 TESTING",
  planning: "🔲 PLANNING",
  draft: "📝 DRAFT",
  cancelled: "❌ CANCELLED",
};

const REPO_URL = "https://github.com/ApexChef/Bovenkamer-events";

function parseYamlFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: Record<string, unknown> = {};

  for (const line of yaml.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    // Parse arrays like [12, 15]
    if (typeof value === "string" && value.startsWith("[")) {
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string if parse fails
      }
    }
    // Parse null
    else if (value === "null") {
      value = null;
    }
    // Parse numbers
    else if (typeof value === "string" && /^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }

    result[key] = value;
  }

  return result;
}

function getUserStories(baseDir: string): UserStoryMeta[] {
  const userStoriesDir = path.join(baseDir, "docs", "user-stories");
  const stories: UserStoryMeta[] = [];

  const folders = fs
    .readdirSync(userStoriesDir)
    .filter((f) => f.startsWith("US-") && fs.statSync(path.join(userStoriesDir, f)).isDirectory());

  for (const folder of folders) {
    const readmePath = path.join(userStoriesDir, folder, "README.md");
    if (!fs.existsSync(readmePath)) continue;

    const content = fs.readFileSync(readmePath, "utf-8");
    const meta = parseYamlFrontmatter(content);

    if (!meta) {
      console.warn(`Warning: No frontmatter found in ${folder}/README.md`);
      continue;
    }

    stories.push({
      id: (meta.id as string) || folder.split("-")[0] + "-" + folder.split("-")[1],
      title: (meta.title as string) || folder,
      status: (meta.status as string) || "draft",
      priority: (meta.priority as string | number) || "-",
      complexity: (meta.complexity as string) || "-",
      type: (meta.type as string) || "Feature",
      pr: (meta.pr as number | number[] | null) || null,
      created: (meta.created as string) || "",
      updated: (meta.updated as string) || "",
      folder,
    });
  }

  // Sort by ID number
  return stories.sort((a, b) => {
    const numA = parseInt(a.id.replace("US-", ""), 10);
    const numB = parseInt(b.id.replace("US-", ""), 10);
    return numA - numB;
  });
}

function formatPR(pr: number | number[] | null): string {
  if (pr === null) return "-";
  if (Array.isArray(pr)) {
    return pr.map((p) => `[#${p}](${REPO_URL}/pull/${p})`).join(", ");
  }
  return `[#${pr}](${REPO_URL}/pull/${pr})`;
}

function generateMarkdownTable(stories: UserStoryMeta[]): string {
  const lines: string[] = [];

  lines.push("| ID | Naam | Prioriteit | Status | PR | Type |");
  lines.push("|----|------|------------|--------|-----|------|");

  for (const story of stories) {
    const statusIcon = STATUS_ICONS[story.status] || story.status.toUpperCase();
    const link = `[${story.id}](./${story.folder}/)`;

    lines.push(
      `| ${link} | ${story.title} | ${story.priority} | ${statusIcon} | ${formatPR(story.pr)} | ${story.type} |`
    );
  }

  return lines.join("\n");
}

function generateSummary(stories: UserStoryMeta[]): string {
  const done = stories.filter((s) => s.status === "done");
  const inProgress = stories.filter((s) => s.status === "in-progress");
  const testing = stories.filter((s) => ["testing", "code-complete"].includes(s.status));
  const planning = stories.filter((s) => ["planning", "draft"].includes(s.status));

  const lines: string[] = [];

  lines.push("## Voortgang Samenvatting\n");

  if (done.length > 0) {
    lines.push("### Voltooid (" + done.length + ")");
    for (const s of done) {
      lines.push(`- **${s.id}**: ${s.title}`);
    }
    lines.push("");
  }

  if (inProgress.length > 0) {
    lines.push("### In Progress (" + inProgress.length + ")");
    for (const s of inProgress) {
      lines.push(`- **${s.id}**: ${s.title}`);
    }
    lines.push("");
  }

  if (testing.length > 0) {
    lines.push("### Testing (" + testing.length + ")");
    for (const s of testing) {
      lines.push(`- **${s.id}**: ${s.title}`);
    }
    lines.push("");
  }

  if (planning.length > 0) {
    lines.push("### Planning/Draft (" + planning.length + ")");
    for (const s of planning) {
      lines.push(`- **${s.id}**: ${s.title}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const baseDir = path.resolve(__dirname, "..");
  const updateMode = process.argv.includes("--update");

  console.log("Scanning user stories...\n");

  const stories = getUserStories(baseDir);

  console.log(`Found ${stories.length} user stories with frontmatter.\n`);

  const table = generateMarkdownTable(stories);
  const summary = generateSummary(stories);

  console.log("## Overzicht\n");
  console.log(table);
  console.log("\n");
  console.log(summary);

  if (updateMode) {
    console.log("\n--update flag detected, but auto-update is disabled.");
    console.log("Copy the above table to docs/user-stories/README.md manually.");
  }
}

main();
