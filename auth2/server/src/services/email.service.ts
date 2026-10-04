import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { welcomeEmailTemplate } from '../templates/welcomeEmail';
import { otpEmailTemplate } from '../templates/otpEmail';

let transporter: any = null;

if (env.gmail.user && env.gmail.appPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.gmail.user,
      pass: env.gmail.appPassword,
    },
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  if (!transporter || !env.gmail.user) {
    console.log(`[Email] Gmail not configured. Skipping welcome email to ${to}`);
    return;
  }
  const { subject, html } = welcomeEmailTemplate(name);
  await transporter.sendMail({ from: `"The Champions Club" <${env.gmail.user}>`, to, subject, html });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  if (!transporter || !env.gmail.user) {
    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET OTP FOR ${to}]: ${otp}`);
    console.log(`(Configure GMAIL_USER and GMAIL_APP_PASSWORD in .env for live email delivery)`);
    console.log(`======================================================\n`);
    return;
  }
  const { subject, html } = otpEmailTemplate(otp);
  await transporter.sendMail({ from: `"The Champions Club" <${env.gmail.user}>`, to, subject, html });
}
