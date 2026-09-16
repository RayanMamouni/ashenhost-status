import { PrismaClient, Role, MonitorType, MonitorStatus, IncidentStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AshenHost Status database...');

  const now = Date.now();

  // Clean existing data
  await prisma.notificationLog.deleteMany();
  await prisma.notificationChannel.deleteMany();
  await prisma.incidentUpdate.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.check.deleteMany();
  await prisma.statusPage.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create demo admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@ashenhost.com',
      name: 'System Admin',
      passwordHash: hashedPassword,
    },
  });

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'AshenHost Core Infrastructure',
      slug: 'ashenhost',
      plan: 'pro',
    },
  });

  // Create Membership (Admin)
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: Role.admin,
    },
  });

  // Create Monitors
  const apiMonitor = await prisma.monitor.create({
    data: {
      organizationId: org.id,
      name: 'Primary API Gateway',
      url: 'https://api.github.com/zen',
      type: MonitorType.http,
      intervalSeconds: 60,
      timeoutSeconds: 10,
      status: MonitorStatus.up,
      expectedStatusCodes: [200],
    },
  });

  const webMonitor = await prisma.monitor.create({
    data: {
      organizationId: org.id,
      name: 'Main Landing Page',
      url: 'https://google.com',
      type: MonitorType.http,
      intervalSeconds: 60,
      timeoutSeconds: 10,
      status: MonitorStatus.up,
      expectedStatusCodes: [200, 301, 302],
    },
  });

  const dbMonitor = await prisma.monitor.create({
    data: {
      organizationId: org.id,
      name: 'Europe DNS Resolver',
      url: '1.1.1.1',
      type: MonitorType.dns,
      dnsRecordType: 'A',
      intervalSeconds: 60,
      timeoutSeconds: 5,
      status: MonitorStatus.up,
    },
  });

  // Real monitors are created. The background worker will perform real checks!
  // Seed Status Page
  const statusPage = await prisma.statusPage.create({
    data: {
      organizationId: org.id,
      name: 'AshenHost Network Status',
      slug: 'ashenhost',
      description: 'Real-time and historical uptime status for AshenHost infrastructure and services.',
      heroTitle: 'Official Infrastructure Status',
      announcement: 'All core edge clusters and DNS services are actively monitored.',
      themeColor: '#9D4EDD',
      footerText: 'Powered by AshenHost Enterprise Engine',
      monitorIds: [apiMonitor.id, webMonitor.id, dbMonitor.id],
      isPublic: true,
    },
  });

  // Seed Active or Resolved Incident
  const incident = await prisma.incident.create({
    data: {
      organizationId: org.id,
      monitorId: apiMonitor.id,
      title: 'Elevated latency on Europe edge gateway',
      status: IncidentStatus.resolved,
      isManual: false,
      startedAt: new Date(now - 3 * 3600 * 1000),
      resolvedAt: new Date(now - 1 * 3600 * 1000),
    },
  });

  await prisma.incidentUpdate.createMany({
    data: [
      {
        incidentId: incident.id,
        message: 'We noticed a spike in response times on the edge proxy nodes.',
        status: IncidentStatus.investigating,
        createdAt: new Date(now - 3 * 3600 * 1000),
      },
      {
        incidentId: incident.id,
        message: 'Upstream transit routing issue identified in Frankfurt datacenter.',
        status: IncidentStatus.identified,
        createdAt: new Date(now - 2 * 3600 * 1000),
      },
      {
        incidentId: incident.id,
        message: 'Traffic rerouted through secondary backbone. Latency metrics back to normal.',
        status: IncidentStatus.resolved,
        createdAt: new Date(now - 1 * 3600 * 1000),
      },
    ],
  });

  // Seed Notification Channel
  await prisma.notificationChannel.create({
    data: {
      organizationId: org.id,
      name: 'DevOps Email Alerts',
      type: NotificationType.email,
      config: { email: 'alerts@ashenhost.com' },
      isActive: true,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('👤 Login email: admin@ashenhost.com');
  console.log('🔑 Password:    password123');
  console.log(`🌐 Status Page: http://localhost:3000/status/${statusPage.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
