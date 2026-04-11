import { NextRequest } from "next/server";
import { sseClients, latestData } from "../sensor-data/route";

export async function GET(req: NextRequest) {
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(c) {
      controller = c;

      // Add this client to the list
      sseClients.push(controller);

      // Immediately send latest data if available (handles page refresh)
      if (latestData) {
        const message = `data: ${JSON.stringify(latestData)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      }
    },
    cancel() {
      // Remove client when they disconnect
      const index = sseClients.indexOf(controller);
      if (index !== -1) sseClients.splice(index, 1);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}