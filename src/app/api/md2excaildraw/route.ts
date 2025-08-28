import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { env } from "~/env";
import { markdownRequestSchema } from "~/utils/schema";

const requestSchema = markdownRequestSchema;

interface MarkdownData {
  markdown: string;
  options?: {
    fontFamily?: 1 | 2 | 3;
    fontSize?: number;
    color?: string;
    lineHeight?: number;
  };
  createdAt: string;
}

async function storeInKV(key: string, value: MarkdownData): Promise<void> {
  const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.CLOUDFLARE_KV_NAMESPACE_ID}/values/${key}`;

  const response = await fetch(kvUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    throw new Error(`Failed to store in KV: ${response.statusText}`);
  }
}

async function getFromKV(key: string): Promise<MarkdownData | null> {
  const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.CLOUDFLARE_KV_NAMESPACE_ID}/values/${key}`;

  const response = await fetch(kvUrl, {
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve from KV: ${response.statusText}`);
  }

  return (await response.json()) as MarkdownData;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const { markdown, options } = requestSchema.parse(body);

    // Generate unique ID and store the Markdown data
    const id = randomUUID();
    await storeInKV(id, {
      markdown,
      options,
      createdAt: new Date().toISOString(),
    });

    // Get the host from the request to build the URL
    const host = request.headers.get("host") ?? "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") ?? "http";
    const clientUrl = `${protocol}://${host}/markdown/${id}`;

    return NextResponse.json({
      id,
      clientUrl,
      valid: true,
    });
  } catch (error) {
    console.error("Error validating Markdown input:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("Failed to store in KV")
    ) {
      return NextResponse.json(
        { error: "Failed to store data" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Failed to validate Markdown input" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 },
      );
    }

    const data = await getFromKV(id);
    if (!data) {
      return NextResponse.json(
        { error: "Markdown data not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error retrieving Markdown data:", error);

    if (
      error instanceof Error &&
      error.message.includes("Failed to retrieve from KV")
    ) {
      return NextResponse.json(
        { error: "Failed to retrieve data" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve Markdown data" },
      { status: 500 },
    );
  }
}
