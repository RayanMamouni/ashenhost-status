import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@ashenhost/database';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;

  const deleted = await prisma.notificationChannel.deleteMany({
    where: { id: params.id, organizationId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
