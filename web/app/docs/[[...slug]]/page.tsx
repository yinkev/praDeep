import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";

export const revalidate = 3600;

type PageParams = {
  slug?: string[];
};

function stripFrontmatter(markdown: string): { frontmatter: string; body: string } {
  if (!markdown.startsWith("---\n")) {
    return { frontmatter: "", body: markdown };
  }

  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { frontmatter: "", body: markdown };
  }

  const frontmatter = markdown.slice(4, endIndex);
  const body = markdown.slice(endIndex + "\n---\n".length);
  return { frontmatter, body };
}

function titleFromFrontmatter(frontmatter: string): string | null {
  const match = frontmatter.match(/^\s*title:\s*(.+)\s*$/m);
  if (!match) return null;
  return match[1].replace(/^['"]|['"]$/g, "").trim() || null;
}

function titleFromFirstHeading(body: string): string | null {
  const match = body.match(/^\s*#\s+(.+)\s*$/m);
  if (!match) return null;
  return match[1].trim() || null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function resolveDocFile(slug: string[] | undefined): Promise<string | null> {
  const docsRoot = path.resolve(process.cwd(), "..", "docs");
  const slugPath = (slug ?? []).filter(Boolean);

  const candidatePaths: string[] = [];
  if (slugPath.length === 0) {
    candidatePaths.push(path.join(docsRoot, "index.md"));
  } else {
    const joined = slugPath.join("/");
    candidatePaths.push(path.join(docsRoot, `${joined}.md`));
    candidatePaths.push(path.join(docsRoot, joined, "index.md"));
  }

  for (const candidate of candidatePaths) {
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(docsRoot + path.sep)) {
      continue;
    }
    if (await fileExists(resolved)) {
      return resolved;
    }
  }

  return null;
}

export async function generateMetadata({ params }: { params: PageParams }) {
  const filePath = await resolveDocFile(params.slug);
  if (!filePath) {
    return { title: "Docs" };
  }

  const raw = await fs.readFile(filePath, "utf8");
  const { frontmatter, body } = stripFrontmatter(raw);

  const title =
    titleFromFrontmatter(frontmatter) ??
    titleFromFirstHeading(body) ??
    (params.slug?.[params.slug.length - 1] ? params.slug[params.slug.length - 1] : "Docs");

  return { title: `Docs · ${title}` };
}

export default async function DocsPage({ params }: { params: PageParams }) {
  const filePath = await resolveDocFile(params.slug);
  if (!filePath) {
    notFound();
  }

  const raw = await fs.readFile(filePath, "utf8");
  const { body } = stripFrontmatter(raw);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}

