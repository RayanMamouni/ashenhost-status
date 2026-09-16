import { NextRequest } from 'next/server';
import { prisma } from '@ashenhost/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgSlug = searchParams.get('org');

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const interval = setInterval(async () => {
        try {
          const query = orgSlug ? { organization: { slug: orgSlug } } : {};
          const monitors = await prisma.monitor.findMany({
            where: query,
            select: {
              id: true,
              name: true,
              status: true,
              lastCheckedAt: true,
              checks: {
                take: 1,
                orderBy: { timestamp: 'desc' },
                select: { responseTimeMs: true, statusCode: true, success: true },
              },
            },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'monitors_update', monitors, timestamp: new Date() })}\n\n`)
          );
        } catch (e) {
          // Keep stream alive on error
        }
      }, 5000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
