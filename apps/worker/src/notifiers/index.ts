import nodemailer from 'nodemailer';
import { prisma } from '@ashenhost/database';
import { NotificationPayload } from '@ashenhost/shared-types';

/**
 * Send an email notification via SMTP
 */
async function sendEmailNotification(to: string, payload: NotificationPayload) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'AshenHost Alerts <alerts@ashenhost.local>';

  if (!host || !user) {
    console.log(`[Notification:Email] (Mock Mode - No SMTP configured) To: ${to} | Subject: [${payload.event}] ${payload.monitorName || payload.incidentTitle} | Message: ${payload.message}`);
    return { success: true, mocked: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = `[${payload.event.toUpperCase()}] ${payload.monitorName || payload.incidentTitle || 'Alert'}`;
  const html = `
    <div style="background-color: #030303; color: #EAEAEA; font-family: monospace; padding: 24px; border: 1px solid #222222; border-radius: 4px;">
      <h2 style="color: ${payload.status === 'down' ? '#FF3B3B' : '#39FF88'}; margin-top: 0;">
        [${payload.event.toUpperCase()}] ${payload.monitorName || payload.incidentTitle || 'Alert Notification'}
      </h2>
      <p style="color: #AAAAAA; font-size: 14px;"><strong>Status:</strong> ${payload.status.toUpperCase()}</p>
      <p style="color: #EAEAEA; font-size: 15px; margin: 16px 0;">${payload.message}</p>
      <div style="font-size: 12px; color: #666666; border-top: 1px solid #222222; padding-top: 12px; margin-top: 24px;">
        Timestamp: ${payload.timestamp} &bull; AshenHost Monitoring Engine
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  return { success: true };
}

/**
 * Send Slack Webhook notification
 */
async function sendSlackNotification(webhookUrl: string, payload: NotificationPayload) {
  const isDown = payload.status === 'down';
  const color = isDown ? '#FF3B3B' : '#39FF88';

  const body = {
    attachments: [
      {
        color,
        title: `[${payload.event.toUpperCase()}] ${payload.monitorName || payload.incidentTitle || 'Alert'}`,
        text: payload.message,
        fields: [
          { title: 'Status', value: payload.status.toUpperCase(), short: true },
          { title: 'Time', value: payload.timestamp, short: true },
        ],
        footer: 'AshenHost Status Alerting',
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook returned status ${res.status}: ${await res.text()}`);
  }

  return { success: true };
}

/**
 * Send Generic Webhook notification
 */
async function sendWebhookNotification(webhookUrl: string, payload: NotificationPayload) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AshenHost-Webhook-Engine/1.0',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Webhook returned status ${res.status}: ${await res.text()}`);
  }

  return { success: true };
}

/**
 * Dispatch notification across all active channels of an organization
 */
export async function dispatchNotification(payload: NotificationPayload) {
  try {
    const channels = await prisma.notificationChannel.findMany({
      where: {
        organizationId: payload.organizationId,
        isActive: true,
      },
    });

    for (const channel of channels) {
      let success = false;
      let errorStr: string | null = null;
      const config = channel.config as any;

      try {
        if (channel.type === 'email' && config?.email) {
          await sendEmailNotification(config.email, payload);
          success = true;
        } else if (channel.type === 'slack' && config?.slackWebhookUrl) {
          await sendSlackNotification(config.slackWebhookUrl, payload);
          success = true;
        } else if (channel.type === 'webhook' && config?.webhookUrl) {
          await sendWebhookNotification(config.webhookUrl, payload);
          success = true;
        }
      } catch (err: any) {
        errorStr = err.message || 'Notification sending failed';
        console.error(`[Notification Error] Channel ${channel.id} (${channel.type}):`, err);
      }

      // Record log in database
      await prisma.notificationLog.create({
        data: {
          channelId: channel.id,
          event: payload.event,
          payload: payload as any,
          success,
          error: errorStr,
        },
      });
    }
  } catch (err) {
    console.error('[Notification Dispatch Error]:', err);
  }
}
