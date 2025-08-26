import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.elements || !Array.isArray(body.elements)) {
      return NextResponse.json(
        { error: "Invalid JSON: elements array is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: body,
      message: "JSON received successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON format" },
      { status: 400 }
    );
  }
}