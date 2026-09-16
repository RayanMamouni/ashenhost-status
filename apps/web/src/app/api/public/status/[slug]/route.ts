import { NextResponse } from 'next/server';
import { prisma } from '@ashenhost/database';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const statusPage = await prisma.statusPage.findUnique({
    where: { slug: params.slug },
    include: {
      organization: {
        select: { name: true, slug: true, logoUrl: true, bannerUrl: true, primaryColor: true },
      },
    },
  });

  if (!statusPage || !statusPage.isPublic) {
    return NextResponse.json({ error: 'Status page not found or private' }, { status: 404 });
  }

  // Merge org branding as fallback if status page doesn't have its own
  const mergedPage = {
    ...statusPage,
    logoUrl: statusPage.logoUrl || statusPage.organization?.logoUrl || null,
    bannerUrl: statusPage.bannerUrl || statusPage.organization?.bannerUrl || null,
    themeColor: statusPage.themeColor || statusPage.organization?.primaryColor || '#9D4EDD',
  };

  const monitors = await prisma.monitor.findMany({
    where: {
      id: { in: statusPage.monitorIds },
    },
    include: {
      checks: {
        take: 90,
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  const incidents = await prisma.incident.findMany({
    where: {
      organizationId: statusPage.organizationId,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      monitor: true,
      updates: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return NextResponse.json({
    statusPage: mergedPage,
    monitors,
    incidents,
  });
}
