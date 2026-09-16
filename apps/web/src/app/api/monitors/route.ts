import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, MonitorType } from '@ashenhost/database';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const monitors = await prisma.monitor.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      checks: {
        take: 50,
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  return NextResponse.json({ monitors });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role === 'viewer') {
    return NextResponse.json({ error: 'Forbidden: viewers cannot create monitors' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const body = await req.json();

  const {
    name,
    url,
    type = 'http',
    intervalSeconds = 60,
    timeoutSeconds = 10,
    port,
    dnsRecordType,
    expectedStatusCodes = [200, 201, 204, 301, 302],
    regions = ['eu-central'],
  } = body;

  if (!name || !url) {
    return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
  }

  const monitor = await prisma.monitor.create({
    data: {
      organizationId,
      name,
      url,
      type: type as MonitorType,
      intervalSeconds: Number(intervalSeconds),
      timeoutSeconds: Number(timeoutSeconds),
      port: port ? Number(port) : null,
      dnsRecordType: dnsRecordType || 'A',
      expectedStatusCodes,
      regions,
    },
  });

  const { createAuditLog } = await import('@/lib/audit');
  await createAuditLog({
    organizationId,
    actorEmail: session.user.email || 'unknown',
    actorName: session.user.name,
    action: 'CREATE_MONITOR',
    resourceType: 'MONITOR',
    resourceId: monitor.id,
    details: { name: monitor.name, url: monitor.url, type: monitor.type },
  });

  return NextResponse.json({ monitor }, { status: 201 });
}
