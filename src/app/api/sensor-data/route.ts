import { NextRequest, NextResponse } from "next/server";

// --- Types ---
interface SensorReading {
    timestamp: string;
    gas1: number;
    gas2: number;
    gas3: number;
    temperature: number;
    pm: number;
    is_fire: boolean;
    confidence: number;
    triggered_by: string;
}

interface SensorPayload {
    readings: SensorReading[];
    count: number;
    warming_up: boolean;
}

// --- In-memory store ---
export let latestData: SensorPayload | null = null;
export let sseClients: ReadableStreamDefaultController[] = [];

// --- POST: Receive data from Pi / tester ---
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate payload shape
        if (
            !Array.isArray(body.readings) ||
            typeof body.count !== "number" ||
            typeof body.warming_up !== "boolean"
        ) {
            return NextResponse.json(
                { success: false, error: "Invalid payload shape" },
                { status: 400 }
            );
        }

        // Store latest data
        latestData = {
            readings: body.readings,
            count: body.count,
            warming_up: body.warming_up,
        };

        // Broadcast to all connected SSE clients
        const message = `data: ${JSON.stringify(latestData)}\n\n`;
        sseClients.forEach((client) => {
            try {
                client.enqueue(new TextEncoder().encode(message));
            } catch {
                // client disconnected, ignore
            }
        });

        return NextResponse.json({ success: true, count: body.count });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }
}

// --- GET: Snapshot of latest data (for initial page load) ---
export async function GET() {
    return NextResponse.json({ data: latestData });
}