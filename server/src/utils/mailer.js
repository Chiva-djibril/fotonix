import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.FROM_EMAIL || (process.env.ADMIN_EMAIL || "no-reply@fotonixstudio.rw");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: port || 587,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in the environment.");
  }

  const info = await t.sendMail({ from, to, subject, text, html });
  return info;
}
