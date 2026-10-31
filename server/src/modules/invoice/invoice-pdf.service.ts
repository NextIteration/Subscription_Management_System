import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class InvoicePdfService {
  private buildPdf(invoice: any, doc: PDFKit.PDFDocument) {
    // Header
    doc.fillColor('#0e1013')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('BRIGHTLOOP', 50, 50);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#526071')
       .text('Brightloop Software Systems Inc.', 50, 78)
       .text('100 Montgomery St, Suite 1200', 50, 92)
       .text('San Francisco, CA 94104', 50, 106)
       .text('billing@brightloop.io', 50, 120);

    // Invoice Title on the right
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#0e1013')
       .text('INVOICE', 350, 50, { align: 'right' });

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#0e1013')
       .text(invoice.invoiceNumber, 350, 78, { align: 'right' });

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#526071')
       .text(`Status: ${invoice.status.toUpperCase()}`, 350, 94, { align: 'right' })
       .text(`Issue Date: ${new Date(invoice.issueDate).toISOString().split('T')[0]}`, 350, 108, { align: 'right' })
       .text(`Due Date: ${new Date(invoice.dueDate).toISOString().split('T')[0]}`, 350, 122, { align: 'right' });

    doc.moveTo(50, 150).lineTo(545, 150).strokeColor('#e2e8f0').stroke();

    // Bill To
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#94a3b8')
       .text('BILLED TO', 50, 165);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#0e1013')
       .text(invoice.customerName || invoice.customer?.name || 'Customer', 50, 180);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#526071')
       .text(invoice.customerEmail || invoice.customer?.email || '', 50, 195)
       .text(`Payment Terms: ${invoice.paymentTerms}`, 50, 210);

    if (invoice.subscription?.subscriptionNumber) {
      doc.text(`Subscription: ${invoice.subscription.subscriptionNumber}`, 50, 225);
    }

    // Line items table
    const tableTop = 250;
    doc.rect(50, tableTop, 495, 24).fill('#f1f5f9');

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#475569')
       .text('DESCRIPTION', 60, tableTop + 7)
       .text('QTY', 320, tableTop + 7, { width: 40, align: 'center' })
       .text('UNIT PRICE', 370, tableTop + 7, { width: 75, align: 'right' })
       .text('TOTAL', 455, tableTop + 7, { width: 80, align: 'right' });

    let currentY = tableTop + 30;

    invoice.lines?.forEach((line: any) => {
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#0e1013')
         .text(line.productName, 60, currentY, { width: 250 })
         .text(String(line.quantity), 320, currentY, { width: 40, align: 'center' })
         .text(`$${Number(line.unitPrice).toFixed(2)}`, 370, currentY, { width: 75, align: 'right' })
         .text(`$${Number(line.lineTotal).toFixed(2)}`, 455, currentY, { width: 80, align: 'right' });

      currentY += 24;
      doc.moveTo(50, currentY - 6).lineTo(545, currentY - 6).strokeColor('#f1f5f9').stroke();
    });

    // Summary box on the right
    currentY += 10;
    const summaryX = 350;

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#526071')
       .text('Subtotal:', summaryX, currentY)
       .text(`$${Number(invoice.subtotal).toFixed(2)}`, 455, currentY, { width: 80, align: 'right' });

    currentY += 18;
    doc.text('Tax:', summaryX, currentY)
       .text(`$${Number(invoice.taxAmount).toFixed(2)}`, 455, currentY, { width: 80, align: 'right' });

    if (invoice.discountAmount > 0) {
      currentY += 18;
      doc.fillColor('#059669')
         .text('Discount Applied:', summaryX, currentY)
         .text(`-$${Number(invoice.discountAmount).toFixed(2)}`, 455, currentY, { width: 80, align: 'right' });
    }

    currentY += 22;
    doc.moveTo(summaryX, currentY - 5).lineTo(545, currentY - 5).strokeColor('#cbd5e1').stroke();

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#0e1013')
       .text('Total Amount:', summaryX, currentY)
       .text(`$${Number(invoice.totalAmount).toFixed(2)}`, 455, currentY, { width: 80, align: 'right' });

    currentY += 20;
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#059669')
       .text('Amount Paid:', summaryX, currentY)
       .text(`-$${Number(invoice.amountPaid).toFixed(2)}`, 455, currentY, { width: 80, align: 'right' });

    currentY += 22;
    doc.moveTo(summaryX, currentY - 5).lineTo(545, currentY - 5).strokeColor('#0e1013').stroke();

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#e11d48')
       .text('Balance Due:', summaryX, currentY)
       .text(`$${Number(invoice.amountDue).toFixed(2)}`, 455, currentY, { width: 80, align: 'right' });

    // Notes
    if (invoice.notes) {
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#64748b')
         .text('NOTES', 50, currentY + 40);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#334155')
         .text(invoice.notes, 50, currentY + 54, { width: 400 });
    }

    doc.end();
  }

  generatePdf(invoice: any, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);
    this.buildPdf(invoice, doc);
  }

  generatePdfBuffer(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      this.buildPdf(invoice, doc);
    });
  }
}

export const invoicePdfService = new InvoicePdfService();
