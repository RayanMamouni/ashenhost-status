import { prisma } from '@ashenhost/database';

interface LogAuditParams {
  organizationId: string;
  actorEmail: string;
  actorName?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

export async function createAuditLog(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorEmail: params.actorEmail,
        actorName: params.actorName,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: params.details || {},
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
