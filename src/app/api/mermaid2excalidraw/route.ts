import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

const requestSchema = z.object({
  mermaid: z.string().min(1, "Mermaid input is required"),
  fontSize: z.number().optional().default(16),
});

// In-memory storage for demo purposes
// In production, use a database like Redis, PostgreSQL, etc.
const mermaidStorage = new Map<string, { mermaid: string; fontSize: number; createdAt: Date }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mermaid, fontSize } = requestSchema.parse(body);

    // Generate unique ID and store the Mermaid data
    const id = randomUUID();
    mermaidStorage.set(id, {
      mermaid,
      fontSize,
      createdAt: new Date()
    });

    // Get the host from the request to build the URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
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

    const data = mermaidStorage.get(id);
    if (!data) {
      return NextResponse.json(
        { error: "Mermaid data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error retrieving Mermaid data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve Mermaid data" },
      { status: 500 }
    );
  }
}