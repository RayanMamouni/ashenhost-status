import http from 'http';
import https from 'https';
import dns from 'dns/promises';
import net from 'net';
import tls from 'tls';
import { CheckResult } from '@ashenhost/shared-types';

export interface CheckOptions {
  monitorId: string;
  url: string;
  type: string;
  timeoutSeconds: number;
  expectedStatusCodes?: number[];
  port?: number | null;
  dnsRecordType?: string | null;
  region?: string;
}

/**
 * Execute HTTP / HTTPS healthcheck
 */
export async function checkHttp(options: CheckOptions): Promise<CheckResult> {
  const { monitorId, url, timeoutSeconds = 10, expectedStatusCodes = [200, 201, 204, 301, 302], region = 'eu-central' } = options;
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    let finished = false;
    const client = url.startsWith('https') ? https : http;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        req.destroy();
        resolve({
          monitorId,
          timestamp: new Date(),
          responseTimeMs: timeoutSeconds * 1000,
          statusCode: null,
          success: false,
          errorMessage: `Connection timed out after ${timeoutSeconds}s`,
          region,
        });
      }
    }, timeoutSeconds * 1000);

    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'AshenHost-Uptime-Bot/1.0 (+https://ashenhost.com/bot)',
        },
        rejectUnauthorized: false, // Don't fail immediately on self-signed unless strict
      },
      (res) => {
        const responseTimeMs = Date.now() - startTime;
        clearTimeout(timeout);
        if (!finished) {
          finished = true;
          const statusCode = res.statusCode ?? 0;
          const success = expectedStatusCodes.includes(statusCode);
          resolve({
            monitorId,
            timestamp: new Date(),
            responseTimeMs,
            statusCode,
            success,
            errorMessage: success ? null : `Unexpected status code: ${statusCode} (Expected: ${expectedStatusCodes.join(', ')})`,
            region,
          });
        }
        res.resume(); // Discard response data stream to free memory
      }
    );

    req.on('error', (err) => {
      clearTimeout(timeout);
      if (!finished) {
        finished = true;
        resolve({
          monitorId,
          timestamp: new Date(),
          responseTimeMs: Date.now() - startTime,
          statusCode: null,
          success: false,
          errorMessage: err.message || 'HTTP Connection failed',
          region,
        });
      }
    });
  });
}

/**
 * Execute TCP Port check
 */
export async function checkTcp(options: CheckOptions): Promise<CheckResult> {
  const { monitorId, url, port = 80, timeoutSeconds = 5, region = 'eu-central' } = options;
  const targetPort = port || 80;
  const startTime = Date.now();

  // Strip protocol if present in host
  const host = url.replace(/^[a-zA-Z]+:\/\//, '').split(':')[0].split('/')[0];

  return new Promise((resolve) => {
    let finished = false;
    const socket = new net.Socket();

    socket.setTimeout(timeoutSeconds * 1000);

    socket.connect(targetPort, host, () => {
      if (!finished) {
        finished = true;
        const responseTimeMs = Date.now() - startTime;
        socket.destroy();
        resolve({
          monitorId,
          timestamp: new Date(),
          responseTimeMs,
          statusCode: 0,
          success: true,
          errorMessage: null,
          region,
        });
      }
    });

    socket.on('timeout', () => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve({
          monitorId,
          timestamp: new Date(),
          responseTimeMs: timeoutSeconds * 1000,
          statusCode: null,
          success: false,
          errorMessage: `TCP Connection to ${host}:${targetPort} timed out after ${timeoutSeconds}s`,
          region,
        });
      }
    });

    socket.on('error', (err) => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve({
          monitorId,
          timestamp: new Date(),
          responseTimeMs: Date.now() - startTime,
          statusCode: null,
          success: false,
          errorMessage: `TCP error: ${err.message}`,
          region,
        });
      }
    });
  });
}

/**
 * Execute SSL Certificate validity and expiration check
 */
export async function checkSsl(options: CheckOptions): Promise<CheckResult> {
  const { monitorId, url, timeoutSeconds = 10, region = 'eu-central' } = options;
  const host = url.replace(/^[a-zA-Z]+:\/\//, '').split(':')[0].split('/')[0];
  const startTime = Date.now();

  return new Promise((resolve) => {
    let finished = false;
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
        timeout: timeoutSeconds * 1000,
      },
      () => {
        if (!finished) {
          finished = true;
          const cert = socket.getPeerCertificate();
          const responseTimeMs = Date.now() - startTime;
          socket.destroy();

          if (!cert || !cert.valid_to) {
            resolve({
              monitorId,
              timestamp: new Date(),
              responseTimeMs,
              statusCode: null,
              success: false,
              errorMessage: 'Unable to retrieve SSL certificate details',
              region,
            });
            return;
          }

          const expiryDate = new Date(cert.valid_to);
          const daysRemaining = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          if (daysRemaining <= 0) {
            resolve({
              monitorId,
              timestamp: new Date(),
              responseTimeMs,
              statusCode: null,
              success: false,
              errorMessage: `SSL Certificate expired on ${expiryDate.toISOString()}`,
              region,
            });
          } else if (daysRemaining <= 7) {
            resolve({
              monitorId,
              timestamp: new Date(),
              responseTimeMs,
              statusCode: null,
              success: true, // degraded handled at runner level
              errorMessage: `SSL Certificate will expire in ${daysRemaining} days (${expiryDate.toISOString()})`,
              region,
            });
          } else {
            resolve({
              monitorId,
              timestamp: new Date(),
              responseTimeMs,
              statusCode: 200,
              success: true,
              errorMessage: null,
              region,
            });
          }
        }
      }
    );

    socket.on('error', (err) => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve({
          monitorId,
          timestamp: new Date(),
          responseTimeMs: Date.now() - startTime,
          statusCode: null,
          success: false,
          errorMessage: `TLS Handshake error: ${err.message}`,
          region,
        });
      }
    });

    socket.on('timeout', () => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve({
          monitorId,
          timestamp: new Date(),
          responseTimeMs: timeoutSeconds * 1000,
          statusCode: null,
          success: false,
          errorMessage: `TLS Connection to ${host}:443 timed out`,
          region,
        });
      }
    });
  });
}

/**
 * Execute DNS resolution check
 */
export async function checkDns(options: CheckOptions): Promise<CheckResult> {
  const { monitorId, url, dnsRecordType = 'A', region = 'eu-central' } = options;
  const host = url.replace(/^[a-zA-Z]+:\/\//, '').split('/')[0];
  const startTime = Date.now();

  try {
    let result: unknown;
    switch (dnsRecordType?.toUpperCase()) {
      case 'AAAA':
        result = await dns.resolve6(host);
        break;
      case 'CNAME':
        result = await dns.resolveCname(host);
        break;
      case 'MX':
        result = await dns.resolveMx(host);
        break;
      case 'TXT':
        result = await dns.resolveTxt(host);
        break;
      case 'A':
      default:
        result = await dns.resolve4(host);
        break;
    }

    const responseTimeMs = Date.now() - startTime;
    return {
      monitorId,
      timestamp: new Date(),
      responseTimeMs,
      statusCode: 200,
      success: true,
      errorMessage: null,
      region,
    };
  } catch (err: any) {
    return {
      monitorId,
      timestamp: new Date(),
      responseTimeMs: Date.now() - startTime,
      statusCode: null,
      success: false,
      errorMessage: `DNS query (${dnsRecordType}) failed: ${err.message}`,
      region,
    };
  }
}

/**
 * Dispatcher to route check based on Monitor Type
 */
export async function executeCheck(options: CheckOptions): Promise<CheckResult> {
  switch (options.type) {
    case 'tcp_port':
      return checkTcp(options);
    case 'ssl_cert':
      return checkSsl(options);
    case 'dns':
      return checkDns(options);
    case 'ping':
      return checkTcp({ ...options, port: options.port || 80 });
    case 'http':
    default:
      return checkHttp(options);
  }
}
