import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@ashenhost/database';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const monitor = await prisma.monitor.findFirst({
    where: { id: params.id, organizationId },
    include: {
      checks: {
        take: 100,
        orderBy: { timestamp: 'desc' },
      },
      incidents: {
        orderBy: { createdAt: 'desc' },
        include: { updates: true },
      },
    },
  });

  if (!monitor) {
    return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
  }

  return NextResponse.json({ monitor });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role === 'viewer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const body = await req.json();

  const updated = await prisma.monitor.updateMany({
    where: { id: params.id, organizationId },
    data: body,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role === 'viewer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;

  const deleted = await prisma.monitor.deleteMany({
    where: { id: params.id, organizationId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
  }

  const { createAuditLog } = await import('@/lib/audit');
  await createAuditLog({
    organizationId,
    actorEmail: session.user.email || 'unknown',
    actorName: session.user.name,
    action: 'DELETE_MONITOR',
    resourceType: 'MONITOR',
    resourceId: params.id,
  });

  return NextResponse.json({ success: true });
}
