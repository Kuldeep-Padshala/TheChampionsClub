import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { welcomeEmailTemplate } from '../templates/welcomeEmail';
import { otpEmailTemplate } from '../templates/otpEmail';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.gmail.user,
    pass: env.gmail.appPassword,
  },
});

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const { subject, html } = welcomeEmailTemplate(name);
  await transporter.sendMail({ from: `"TheChampionsClub" <${env.gmail.user}>`, to, subject, html });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const { subject, html } = otpEmailTemplate(otp);
  await transporter.sendMail({ from: `"TheChampionsClub" <${env.gmail.user}>`, to, subject, html });
}
