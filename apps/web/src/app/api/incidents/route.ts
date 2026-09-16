import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, IncidentStatus } from '@ashenhost/database';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const incidents = await prisma.incident.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      monitor: true,
      updates: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return NextResponse.json({ incidents });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role === 'viewer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const { title, monitorId, status = 'investigating', message } = await req.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const incident = await prisma.incident.create({
    data: {
      organizationId,
      monitorId: monitorId || null,
      title,
      status: status as IncidentStatus,
      isManual: true,
      startedAt: new Date(),
      updates: {
        create: {
          message: message || 'Incident reported.',
          status: status as IncidentStatus,
        },
      },
    },
    include: {
      updates: true,
      monitor: true,
    },
  });

  return NextResponse.json({ incident }, { status: 201 });
}
