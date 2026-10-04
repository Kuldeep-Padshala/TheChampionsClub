const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { welcomeEmailTemplate } = require('../templates/welcomeEmail');
const { otpEmailTemplate } = require('../templates/otpEmail');

let transporter = null;

if (env.gmail.user && env.gmail.appPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.gmail.user,
      pass: env.gmail.appPassword,
    },
  });
}

async function sendWelcomeEmail(to, name) {
  if (!transporter || !env.gmail.user) {
    console.log(`[Email] Gmail not configured. Skipping welcome email to ${to}`);
    return;
  }
  const { subject, html } = welcomeEmailTemplate(name);
  await transporter.sendMail({ from: `"The Champions Club" <${env.gmail.user}>`, to, subject, html });
}

async function sendOtpEmail(to, otp) {
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

module.exports = { sendWelcomeEmail, sendOtpEmail };
