import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, NotificationType } from '@ashenhost/database';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const channels = await prisma.notificationChannel.findMany({
    where: { organizationId },
    include: {
      logs: {
        take: 20,
        orderBy: { sentAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ channels });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: only admins can configure notification channels' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const { name, type, config } = await req.json();

  if (!name || !type || !config) {
    return NextResponse.json({ error: 'Name, type, and config are required' }, { status: 400 });
  }

  const channel = await prisma.notificationChannel.create({
    data: {
      organizationId,
      name,
      type: type as NotificationType,
      config,
      isActive: true,
    },
  });

  return NextResponse.json({ channel }, { status: 201 });
}
