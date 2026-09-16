import { prisma, MonitorStatus, IncidentStatus } from '@ashenhost/database';
import { executeCheck } from './checkers/index.js';
import { dispatchNotification } from './notifiers/index.js';

const CHECK_INTERVAL_POLL_MS = 5000; // Poll every 5s for monitors due to check
const CONSECUTIVE_FAILURES_FOR_DOWN = 2; // Mark DOWN and create incident after 2 fails
const CONSECUTIVE_PASSES_FOR_UP = 2; // Mark UP after 2 passes

/**
 * Handle execution for a single monitor
 */
async function processMonitor(monitor: any) {
  try {
    const result = await executeCheck({
      monitorId: monitor.id,
      url: monitor.url,
      type: monitor.type,
      timeoutSeconds: monitor.timeoutSeconds,
      expectedStatusCodes: monitor.expectedStatusCodes,
      port: monitor.port,
      dnsRecordType: monitor.dnsRecordType,
      region: monitor.regions?.[0] || 'eu-central',
    });

    // Save Check Record to PostgreSQL
    await prisma.check.create({
      data: {
        monitorId: monitor.id,
        timestamp: result.timestamp,
        responseTimeMs: result.responseTimeMs,
        statusCode: result.statusCode,
        success: result.success,
        errorMessage: result.errorMessage,
        region: result.region,
      },
    });

    let newStatus: MonitorStatus = monitor.status;
    let consecutiveFails = monitor.consecutiveFails;
    let consecutivePasses = monitor.consecutivePasses;

    if (result.success) {
      consecutivePasses += 1;
      consecutiveFails = 0;

      if (monitor.status === 'down' && consecutivePasses >= CONSECUTIVE_PASSES_FOR_UP) {
        newStatus = MonitorStatus.up;
        console.log(`[STATUS RECOVERY] Monitor "${monitor.name}" is now UP.`);

        // Auto-resolve any active incident linked to this monitor
        const activeIncident = await prisma.incident.findFirst({
          where: {
            monitorId: monitor.id,
            status: { not: IncidentStatus.resolved },
          },
        });

        if (activeIncident) {
          await prisma.incident.update({
            where: { id: activeIncident.id },
            data: {
              status: IncidentStatus.resolved,
              resolvedAt: new Date(),
            },
          });

          await prisma.incidentUpdate.create({
            data: {
              incidentId: activeIncident.id,
              status: IncidentStatus.resolved,
              message: `Service automatically recovered. All health checks are passing (${result.responseTimeMs}ms response time).`,
            },
          });
        }

        // Send Recovery Notification
        await dispatchNotification({
          organizationId: monitor.organizationId,
          monitorId: monitor.id,
          monitorName: monitor.name,
          event: 'monitor_up',
          status: 'up',
          message: `Service ${monitor.name} is back online (HTTP ${result.statusCode || 200} in ${result.responseTimeMs}ms).`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      consecutiveFails += 1;
      consecutivePasses = 0;

      if (monitor.status !== 'down' && consecutiveFails >= CONSECUTIVE_FAILURES_FOR_DOWN) {
        newStatus = MonitorStatus.down;
        console.log(`[STATUS ALERT] Monitor "${monitor.name}" is DOWN: ${result.errorMessage}`);

        // Check if an open incident already exists
        const existingIncident = await prisma.incident.findFirst({
          where: {
            monitorId: monitor.id,
            status: { not: IncidentStatus.resolved },
          },
        });

        let incidentId = existingIncident?.id;

        if (!existingIncident) {
          // Auto-create incident
          const newIncident = await prisma.incident.create({
            data: {
              organizationId: monitor.organizationId,
              monitorId: monitor.id,
              title: `Service Outage: ${monitor.name}`,
              status: IncidentStatus.investigating,
              isManual: false,
              startedAt: new Date(),
            },
          });

          incidentId = newIncident.id;

          await prisma.incidentUpdate.create({
            data: {
              incidentId: newIncident.id,
              status: IncidentStatus.investigating,
              message: `Automated alert: Service failed ${CONSECUTIVE_FAILURES_FOR_DOWN} consecutive health checks. Error: ${result.errorMessage}`,
            },
          });
        }

        // Send Down Notification
        await dispatchNotification({
          organizationId: monitor.organizationId,
          monitorId: monitor.id,
          monitorName: monitor.name,
          incidentId,
          event: 'monitor_down',
          status: 'down',
          message: `Service ${monitor.name} is DOWN! Error: ${result.errorMessage}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update Monitor state in DB
    await prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        status: newStatus,
        lastCheckedAt: new Date(),
        consecutiveFails,
        consecutivePasses,
      },
    });
  } catch (err) {
    console.error(`Error processing monitor ${monitor.id} (${monitor.name}):`, err);
  }
}

/**
 * Worker Main Loop
 */
async function startWorker() {
  console.log('⚡ AshenHost Monitoring Worker initialized and running...');

  while (true) {
    try {
      const now = new Date();

      // Find all active monitors where lastCheckedAt is null OR interval has passed
      const monitors = await prisma.monitor.findMany({
        where: {
          status: { not: 'paused' },
        },
      });

      const dueMonitors = monitors.filter((m) => {
        if (!m.lastCheckedAt) return true;
        const diffSeconds = (now.getTime() - new Date(m.lastCheckedAt).getTime()) / 1000;
        return diffSeconds >= m.intervalSeconds;
      });

      if (dueMonitors.length > 0) {
        console.log(`[Worker] Executing checks for ${dueMonitors.length} due monitor(s)...`);
        await Promise.all(dueMonitors.map((m) => processMonitor(m)));
      }
    } catch (err) {
      console.error('[Worker Loop Error]:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_POLL_MS));
  }
}

startWorker().catch((err) => {
  console.error('Fatal Worker Error:', err);
  process.exit(1);
});
