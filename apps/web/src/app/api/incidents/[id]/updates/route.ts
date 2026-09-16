import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, IncidentStatus } from '@ashenhost/database';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role === 'viewer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as any).organizationId;
  const { message, status } = await req.json();

  if (!message || !status) {
    return NextResponse.json({ error: 'Message and status are required' }, { status: 400 });
  }

  const incident = await prisma.incident.findFirst({
    where: { id: params.id, organizationId },
  });

  if (!incident) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  // Update incident status and record update
  const resolvedAt = status === 'resolved' ? new Date() : incident.resolvedAt;

  await prisma.incident.update({
    where: { id: incident.id },
    data: {
      status: status as IncidentStatus,
      resolvedAt,
    },
  });

  const update = await prisma.incidentUpdate.create({
    data: {
      incidentId: incident.id,
      status: status as IncidentStatus,
      message,
    },
  });

  return NextResponse.json({ update });
}
