import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

export function getMailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (config.smtp.user && config.smtp.pass) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } else {
      // Development fallback: mock ethereal or console transporter
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
        buffer: true,
      });
    }
  }
  return transporter;
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: config.smtp.from,
    to,
    subject: 'Brightloop — Password Reset Request',
    text: `You have requested to reset your Brightloop account password.\n\nPlease click the link below or paste it into your browser to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #0e1013; margin-top: 0;">Brightloop Password Reset</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          You recently requested to reset your password for your Brightloop account. Click the button below to proceed:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #0e1013; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: 600; font-size: 14px; display: inline-block;">
            Reset Your Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; border-top: 1px solid #cbd5e1; padding-top: 16px;">
          This link will expire in 60 minutes. If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const transport = getMailTransporter();
    const info = await transport.sendMail(mailOptions);
    console.log(`[Email Dispatched] Password reset sent to ${to}. Info:`, info.messageId || 'Streamed');
  } catch (err) {
    console.error(`[Email Failed] Could not dispatch to ${to}:`, err);
  }
}

