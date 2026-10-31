import nodemailer, { Transporter } from 'nodemailer';

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.isConfigured = true;
      console.log(`[EmailService] Configured with SMTP host: ${host}:${port}`);
    } else {
      // In development / demo when SMTP is not set, use JSON stream transport for safe preview
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.isConfigured = false;
      console.log('[EmailService] SMTP credentials not provided in environment; operating in safe preview mode.');
    }
  }

  async sendInvoiceEmail(invoice: any, pdfBuffer: Buffer): Promise<{ success: boolean; messageId?: string; mode: 'smtp' | 'simulated'; to: string }> {
    if (!this.transporter) {
      this.initTransporter();
    }

    const recipient = invoice.customerEmail || invoice.customer?.email;
    if (!recipient) {
      throw new Error(`Customer email address is required to dispatch invoice ${invoice.invoiceNumber}`);
    }

    const fromAddress = process.env.SMTP_FROM || '"Brightloop Billing" <billing@brightloop.io>';
    const subject = `Invoice ${invoice.invoiceNumber} from Brightloop Systems`;

    const formattedAmount = Number(invoice.totalAmount).toFixed(2);
    const formattedBalance = Number(invoice.amountDue).toFixed(2);
    const dueDate = new Date(invoice.dueDate).toISOString().split('T')[0];

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0e1013; padding: 20px;">
        <div style="margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
          <h2 style="margin: 0; color: #0e1013;">Brightloop Systems</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Subscription & Cloud Billing</p>
        </div>

        <p>Dear <strong>${invoice.customerName || 'Valued Customer'}</strong>,</p>

        <p>Please find attached your invoice <strong>#${invoice.invoiceNumber}</strong>.</p>

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Invoice Number:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Due Date:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #e11d48;">${dueDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Total Amount:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">$${formattedAmount}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 8px 0 0 0; font-weight: bold; color: #0e1013;">Amount Due:</td>
              <td style="padding: 8px 0 0 0; font-weight: bold; text-align: right; font-size: 16px; color: #e11d48;">$${formattedBalance}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #475569;">
          A PDF copy of this invoice has been attached for your records and accounting department.
        </p>

        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Brightloop Software Systems Inc. • 100 Montgomery St, Suite 1200, San Francisco, CA 94104
        </p>
      </div>
    `;

    try {
      const info = await this.transporter!.sendMail({
        from: fromAddress,
        to: recipient,
        subject,
        html,
        attachments: [
          {
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      console.log(`[EmailService] Invoice ${invoice.invoiceNumber} dispatched to ${recipient}. MessageId: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        mode: this.isConfigured ? 'smtp' : 'simulated',
        to: recipient,
      };
    } catch (error: any) {
      console.error(`[EmailService] Failed to send invoice ${invoice.invoiceNumber} to ${recipient}:`, error.message);
      throw new Error(`Failed to dispatch email via SMTP: ${error.message}`);
    }
  }
}

export const emailService = new EmailService();

