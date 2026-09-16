export type MonitorType = 'http' | 'ping' | 'tcp_port' | 'ssl_cert' | 'dns';

export type MonitorStatus = 'up' | 'down' | 'degraded' | 'paused';

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export type NotificationChannelType = 'email' | 'slack' | 'webhook';

export type UserRole = 'admin' | 'member' | 'viewer';

export interface CheckResult {
  monitorId: string;
  timestamp: Date;
  responseTimeMs: number;
  statusCode?: number | null;
  success: boolean;
  errorMessage?: string | null;
  region: string;
}

export interface NotificationPayload {
  organizationId: string;
  monitorId?: string;
  monitorName?: string;
  incidentId?: string;
  incidentTitle?: string;
  event: 'monitor_down' | 'monitor_up' | 'incident_created' | 'incident_updated' | 'incident_resolved';
  status: string;
  message: string;
  timestamp: string;
}
