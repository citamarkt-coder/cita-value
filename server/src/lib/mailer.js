
import nodemailer from 'nodemailer';

export function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST) {
    console.warn('SMTP not configured; emails will be logged only.');
    return null;
  }

  const port = Number(SMTP_PORT || 587);
  const secure = port === 465; // true für SSL-Port 465

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure, // 465 = true (SSL), 587 = false (STARTTLS)
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false } // falls Zertifikat nicht 100 % gültig ist
  });

  return transport;
}

export async function sendMail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const transport = createTransport();
  if (!transport) {
    console.log('[DEV-EMAIL]', { to, subject, html });
    return;
  }

  await transport.sendMail({ from, to, subject, html });
}
