import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { env } from "~/env";

const requestSchema = z.object({
  mermaid: z.string().min(1, "Mermaid input is required"),
  fontSize: z.number().optional().default(16),
});

interface MermaidData {
  mermaid: string;
  fontSize: number;
  createdAt: string;
}

async function storeInKV(key: string, value: MermaidData): Promise<void> {
  const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.CLOUDFLARE_KV_NAMESPACE_ID}/values/${key}`;
  
  const response = await fetch(kvUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    throw new Error(`Failed to store in KV: ${response.statusText}`);
  }
}

async function getFromKV(key: string): Promise<MermaidData | null> {
  const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${env.CLOUDFLARE_KV_NAMESPACE_ID}/values/${key}`;
  
  const response = await fetch(kvUrl, {
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to retrieve from KV: ${response.statusText}`);
  }

  return await response.json() as MermaidData;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const { mermaid, fontSize } = requestSchema.parse(body);

    // Generate unique ID and store the Mermaid data
    const id = randomUUID();
    await storeInKV(id, {
      mermaid,
      fontSize,
      createdAt: new Date().toISOString()
    });

    // Get the host from the request to build the URL
    const host = request.headers.get('host') ?? 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') ?? 'http';
    const clientUrl = `${protocol}://${host}/mermaid?id=${id}`;

    return NextResponse.json({
      id,
      clientUrl,
      valid: true
    });
  } catch (error) {
    console.error("Error validating Mermaid input:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Failed to store in KV')) {
      return NextResponse.json(
        { error: "Failed to store data" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to validate Mermaid input" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 }
      );
    }

    const data = await getFromKV(id);
    if (!data) {
      return NextResponse.json(
        { error: "Mermaid data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error retrieving Mermaid data:", error);
    
    if (error instanceof Error && error.message.includes('Failed to retrieve from KV')) {
      return NextResponse.json(
        { error: "Failed to retrieve data" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve Mermaid data" },
      { status: 500 }
    );
  }
}