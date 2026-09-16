import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@ashenhost/database';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const { searchParams } = new URL(req.url);
  const actionFilter = searchParams.get('action');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const whereClause: any = { organizationId };
  if (actionFilter && actionFilter !== 'ALL') {
    whereClause.action = actionFilter;
  }

  const [logs, organization, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        statusPages: true,
        notificationChannels: true,
        monitors: true,
      },
    }),
    prisma.auditLog.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    logs,
    organization,
    totalCount,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const body = await req.json();

  const { name, slug, logoUrl, bannerUrl, primaryColor, customCss } = body;

  // Validate slug uniqueness if changed
  if (slug) {
    const existing = await prisma.organization.findFirst({
      where: {
        slug,
        id: { not: organizationId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Organization slug already in use' }, { status: 400 });
    }
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
      primaryColor: primaryColor || undefined,
      customCss: customCss !== undefined ? customCss : undefined,
    },
  });

  // Record audit log
  await createAuditLog({
    organizationId,
    actorEmail: session.user.email || 'unknown',
    actorName: session.user.name,
    action: 'UPDATE_ORGANIZATION_CONFIG',
    resourceType: 'ORGANIZATION',
    resourceId: organizationId,
    details: {
      updatedFields: Object.keys(body),
    },
  });

  return NextResponse.json({ success: true, organization: updatedOrg });
}
