import nodemailer from 'nodemailer';
import { formatSriLankaDate } from '../utils/dateUtils.js';

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  } else {
    // Generate test account automatically for local development / testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Ethereal test SMTP account configured:', testAccount.user);
    } catch (e) {
      console.warn('⚠️ Could not generate ethereal test account, using JSON transport fallback.');
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

/**
 * Format the standard VehicleGuard LK Email Notification
 */
export function buildReminderEmailContent({
  ownerName,
  vehicleNumber,
  vehicleType,
  documentType,
  expiryDate,
  daysRemaining,
}) {
  const formattedExpiry = formatSriLankaDate(expiryDate);
  const remainingText = daysRemaining < 0
    ? `Expired ${Math.abs(daysRemaining)} days ago`
    : daysRemaining === 0
      ? 'Expires Today'
      : `${daysRemaining} days`;

  const urgencyColor = daysRemaining <= 0 ? '#EF4444' : daysRemaining <= 7 ? '#F59E0B' : '#3B82F6';

  const subject = daysRemaining <= 0
    ? `URGENT: Vehicle Document Expired – ${vehicleNumber} | VehicleGuard LK`
    : `Vehicle Document Expiry Reminder – ${vehicleNumber} (${remainingText}) | VehicleGuard LK`;

  const text = `
Subject: Vehicle Document Expiry Reminder – VehicleGuard LK

Dear ${ownerName},

Your vehicle document is approaching its expiry date.

Vehicle Number: ${vehicleNumber}
Vehicle Type: ${vehicleType}
Document: ${documentType}
Expiry Date: ${formattedExpiry}
Remaining Days: ${remainingText}

Please complete the necessary renewal process before the expiry date.

Official Sri Lanka e-Revenue License Service: https://eservices.motortraffic.gov.lk/
Log in to VehicleGuard LK to manage your vehicle documents: ${process.env.APP_URL || 'http://localhost:5173'}

Thank you,
VehicleGuard LK
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { background: #0B192C; padding: 24px 30px; text-align: center; color: #ffffff; border-bottom: 4px solid ${urgencyColor}; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .logo-lk { color: #38BDF8; }
    .content { padding: 30px; }
    .greeting { font-size: 17px; font-weight: 600; margin-bottom: 16px; }
    .alert-banner { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 6px; font-size: 14px; margin-bottom: 24px; color: #92400E; }
    .alert-banner.expired { background: #FEE2E2; border-color: #EF4444; color: #991B1B; }
    .info-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748B; font-weight: 500; }
    .value { font-weight: 700; color: #0F172A; }
    .urgency-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 13px; color: #ffffff; background: ${urgencyColor}; }
    .action-btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background: #1E3E62; color: #ffffff !important; text-decoration: none; font-weight: 600; padding: 14px 20px; border-radius: 8px; font-size: 15px; margin-top: 10px; }
    .gov-link { display: block; text-align: center; margin-top: 14px; font-size: 13px; color: #2563EB; text-decoration: underline; }
    .footer { background: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">VehicleGuard <span class="logo-lk">LK</span></div>
      <div style="font-size: 13px; color: #94A3B8; margin-top: 4px;">Smart Vehicle Document Expiry Reminder System</div>
    </div>
    <div class="content">
      <div class="greeting">Dear ${ownerName},</div>
      <div class="alert-banner ${daysRemaining <= 0 ? 'expired' : ''}">
        ${daysRemaining <= 0 ? '⚠️ Action Required: Your document has expired.' : '🔔 Notification: Your vehicle document is approaching its expiry date.'}
      </div>

      <div class="info-card">
        <div class="info-row">
          <span class="label">Vehicle Number</span>
          <span class="value">${vehicleNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Vehicle Type</span>
          <span class="value">${vehicleType}</span>
        </div>
        <div class="info-row">
          <span class="label">Document</span>
          <span class="value">${documentType}</span>
        </div>
        <div class="info-row">
          <span class="label">Expiry Date</span>
          <span class="value">${formattedExpiry}</span>
        </div>
        <div class="info-row">
          <span class="label">Remaining Days</span>
          <span class="value"><span class="urgency-badge">${remainingText}</span></span>
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Please complete the necessary renewal process before the expiry date to avoid legal penalties and ensure uninterrupted vehicle use on Sri Lankan roads.
      </p>

      <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="action-btn">Log in to VehicleGuard LK</a>
      <a href="https://eservices.motortraffic.gov.lk/" target="_blank" class="gov-link">Sri Lanka Official e-Revenue License Portal (gov.lk) →</a>
    </div>
    <div class="footer">
      Thank you for keeping Sri Lankan roads compliant.<br>
      &copy; ${new Date().getFullYear()} VehicleGuard LK. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
}

/**
 * Send an email using configured transporter
 */
export async function sendEmail({ to, subject, text, html }) {
  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: process.env.SMTP_FROM || '"VehicleGuard LK" <noreply@vehicleguard.lk>',
    to,
    subject,
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`🔗 Email preview URL (Ethereal): ${previewUrl}`);
  }

  return { messageId: info.messageId, previewUrl };
}
