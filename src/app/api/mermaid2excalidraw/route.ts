import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  mermaid: z.string().min(1, "Mermaid input is required"),
  fontSize: z.number().optional().default(16),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mermaid, fontSize } = requestSchema.parse(body);

    // Just validate the mermaid input and return it
    // The actual conversion will happen client-side due to browser dependencies
    return NextResponse.json({
      mermaid,
      fontSize,
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