import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@ashenhost/database';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const statusPage = await prisma.statusPage.findFirst({
    where: { organizationId },
    include: { organization: true },
  });

  return NextResponse.json({ statusPage });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const body = await req.json();

  const {
    name,
    slug,
    description,
    heroTitle,
    announcement,
    logoUrl,
    bannerUrl,
    themeColor,
    footerText,
    customDomain,
    monitorIds,
    isPublic,
  } = body;

  let statusPage = await prisma.statusPage.findFirst({
    where: { organizationId },
  });

  if (statusPage) {
    statusPage = await prisma.statusPage.update({
      where: { id: statusPage.id },
      data: {
        name,
        slug,
        description,
        heroTitle,
        announcement,
        logoUrl,
        bannerUrl,
        themeColor,
        footerText,
        customDomain,
        monitorIds,
        isPublic,
      },
    });
  } else {
    statusPage = await prisma.statusPage.create({
      data: {
        organizationId,
        name: name || 'Public Status',
        slug: slug || 'status',
        description,
        heroTitle,
        announcement,
        logoUrl,
        bannerUrl,
        themeColor,
        footerText,
        customDomain,
        monitorIds: monitorIds || [],
        isPublic: isPublic ?? true,
      },
    });
  }

  // Audit log
  await createAuditLog({
    organizationId,
    actorEmail: session.user.email || 'unknown',
    actorName: session.user.name,
    action: 'UPDATE_STATUS_PAGE_CUSTOMIZATION',
    resourceType: 'STATUS_PAGE',
    resourceId: statusPage.id,
    details: {
      name: statusPage.name,
      slug: statusPage.slug,
      themeColor: statusPage.themeColor,
      hasLogo: !!statusPage.logoUrl,
      hasBanner: !!statusPage.bannerUrl,
    },
  });

  return NextResponse.json({ statusPage });
}
