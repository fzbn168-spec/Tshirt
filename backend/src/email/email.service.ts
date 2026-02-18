import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('EmailService: No SMTP config found, using mock logger');
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"No Reply" <noreply@example.com>',
          to,
          subject,
          html,
        });
        return info;
      } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw, just log, so we don't break the main flow
        return null;
      }
    } else {
      console.log('---------------------------------------------------');
      console.log(`[MOCK EMAIL] To: ${to}`);
      console.log(`[MOCK EMAIL] Subject: ${subject}`);
      console.log(`[MOCK EMAIL] Body Preview: ${html.substring(0, 100)}...`);
      console.log('---------------------------------------------------');
      return { messageId: 'mock-id' };
    }
  }
}
