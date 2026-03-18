// ============================================================
// Email Service (Nodemailer)
// Supports both SMTP (dev) and SendGrid (production).
// Set EMAIL_PROVIDER=sendgrid in .env to switch providers.
// ============================================================
const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_PROVIDER === 'sendgrid') {
    // SendGrid SMTP relay
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    // Dev: use Ethereal or local SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

/**
 * Send a transactional email.
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 */
async function sendEmail({ to, subject, html, text }) {
  // Skip silently if SMTP not configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'placeholder') {
    console.log(`[Email] SMTP not configured — skipping email to ${to}: ${subject}`);
    return;
  }

  const t = getTransporter();

  const info = await t.sendMail({
    from: `"Kaya Marketplace" <${process.env.EMAIL_FROM || 'noreply@kaya.app'}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''), // plain-text fallback
  });

  console.log(`[Email] Sent to ${to}: ${info.messageId}`);
  return info;
}

module.exports = { sendEmail };
