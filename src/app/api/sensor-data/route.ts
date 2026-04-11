import { NextRequest, NextResponse } from "next/server";

// In-memory store — holds the latest sensor payload
let latestData: any = null;
let sseClients: ReadableStreamDefaultController[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    latestData = body;

    // Broadcast to all connected SSE clients
    const message = `data: ${JSON.stringify(latestData)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.enqueue(new TextEncoder().encode(message));
      } catch {
        // client disconnected, ignore
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}

export async function GET() {
  // Return latest data snapshot (useful for initial page load)
  return NextResponse.json({ data: latestData });
}

export { latestData, sseClients };