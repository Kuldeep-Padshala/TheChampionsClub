"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendOtpEmail = sendOtpEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const welcomeEmail_1 = require("../templates/welcomeEmail");
const otpEmail_1 = require("../templates/otpEmail");
let transporter = null;
if (env_1.env.gmail.user && env_1.env.gmail.appPassword) {
    transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: env_1.env.gmail.user,
            pass: env_1.env.gmail.appPassword,
        },
    });
}
async function sendWelcomeEmail(to, name) {
    if (!transporter || !env_1.env.gmail.user) {
        console.log(`[Email] Gmail not configured. Skipping welcome email to ${to}`);
        return;
    }
    const { subject, html } = (0, welcomeEmail_1.welcomeEmailTemplate)(name);
    await transporter.sendMail({ from: `"The Champions Club" <${env_1.env.gmail.user}>`, to, subject, html });
}
async function sendOtpEmail(to, otp) {
    if (!transporter || !env_1.env.gmail.user) {
        console.log(`\n======================================================`);
        console.log(`[PASSWORD RESET OTP FOR ${to}]: ${otp}`);
        console.log(`(Configure GMAIL_USER and GMAIL_APP_PASSWORD in .env for live email delivery)`);
        console.log(`======================================================\n`);
        return;
    }
    const { subject, html } = (0, otpEmail_1.otpEmailTemplate)(otp);
    await transporter.sendMail({ from: `"The Champions Club" <${env_1.env.gmail.user}>`, to, subject, html });
}
