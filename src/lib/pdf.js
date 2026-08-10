import PDFDocument from 'pdfkit';

const formatINR = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDateStr = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function generateBillPdfBuffer(sale, settings) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const W = 515;
      const LEFT = 40;
      const RIGHT = 555;

      const drawLine = (y, dashed = false) => {
        doc.save();
        if (dashed) doc.dash(4, { space: 3 });
        doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
        doc.restore();
      };

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
        .text(settings.business_name || 'Lakshmi Stone Crusher & Suppliers', LEFT, 40, { align: 'center', width: W });

      doc.fontSize(9).font('Helvetica')
        .text(settings.business_address || '', { align: 'center', width: W });

      if (settings.business_mobile) {
        doc.text(`Ph: ${settings.business_mobile}`, { align: 'center', width: W });
      }

      if (sale.gst_enabled) {
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center', width: W });
        if (settings.gstin) {
          doc.fontSize(9).font('Helvetica').text(`GSTIN: ${settings.gstin}`, { align: 'center', width: W });
        }
      }

      doc.moveDown(0.5);
      drawLine(doc.y);
      doc.moveDown(0.5);

      // Invoice Details
      const detailsY = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Invoice No:', LEFT, detailsY);
      doc.font('Helvetica').text(sale.invoice_number, LEFT + 70, detailsY);

      doc.font('Helvetica-Bold').text('Date:', LEFT, detailsY + 14);
      doc.font('Helvetica').text(formatDateStr(sale.sale_date), LEFT + 70, detailsY + 14);

      const custX = RIGHT - 200;
      doc.font('Helvetica-Bold').text('Bill To:', custX, detailsY);
      doc.font('Helvetica-Bold').text(sale.customer_name || 'N/A', custX, detailsY + 14);
      if (sale.customer_mobile) {
        doc.font('Helvetica').text(`Mob: ${sale.customer_mobile}`, custX, detailsY + 26);
      }
      if (sale.customer_address) {
        doc.font('Helvetica').text(sale.customer_address, custX, detailsY + 38, { width: 200, height: 30 });
      }

      doc.y = detailsY + 60;
      drawLine(doc.y);
      doc.moveDown(0.5);

      // Table Header
      const col = {
        no:     { x: LEFT,        w: 25 },
        mat:    { x: LEFT + 25,   w: 180 },
        qty:    { x: LEFT + 205,  w: 60 },
        unit:   { x: LEFT + 265,  w: 50 },
        rate:   { x: LEFT + 315,  w: 80 },
        amount: { x: LEFT + 395,  w: 120 },
      };

      const thY = doc.y;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#555555');
      doc.text('#', col.no.x, thY);
      doc.text('MATERIAL', col.mat.x, thY);
      doc.text('QTY', col.qty.x, thY);
      doc.text('UNIT', col.unit.x, thY);
      doc.text('RATE (₹)', col.rate.x, thY);
      doc.text('AMOUNT (₹)', col.amount.x, thY, { width: col.amount.w, align: 'right' });

      doc.fillColor('#000000');
      doc.moveDown(0.3);
      drawLine(doc.y);
      doc.moveDown(0.3);

      // Rows
      doc.fontSize(9).font('Helvetica');
      (sale.items || []).forEach((item, i) => {
        const rowY = doc.y;
        const matName = item.custom_material_name || item.material_name || 'N/A';
        doc.text(`${i + 1}`, col.no.x, rowY);
        doc.text(matName, col.mat.x, rowY, { width: col.mat.w });
        doc.text(`${parseFloat(item.quantity).toFixed(3)}`, col.qty.x, rowY);
        doc.text(item.unit || 'Tonne', col.unit.x, rowY);
        doc.text(`${formatINR(item.rate)}`, col.rate.x, rowY, { width: col.rate.w, align: 'right' });
        doc.text(`${formatINR(item.amount)}`, col.amount.x, rowY, { width: col.amount.w, align: 'right' });
        doc.moveDown(0.7);
      });

      drawLine(doc.y);
      doc.moveDown(0.5);

      // Totals
      const totColLabel = LEFT + 270;
      const totWidth = 200;

      const printTotalRow = (label, value, bold = false, size = 9, color = '#000000') => {
        const y = doc.y;
        doc.fontSize(size).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color);
        doc.text(label, totColLabel, y, { width: totWidth - 80 });
        doc.text(`₹${formatINR(value)}`, totColLabel + totWidth - 80, y, { width: 80, align: 'right' });
        doc.fillColor('#000000');
        doc.moveDown(0.4);
      };

      if (sale.gst_enabled) {
        printTotalRow('Subtotal (Taxable):', sale.subtotal);
        const halfGst = parseFloat(sale.gst_percent) / 2;
        const halfAmt = parseFloat(sale.gst_amount) / 2;
        printTotalRow(`CGST @ ${halfGst.toFixed(2)}%:`, halfAmt);
        printTotalRow(`SGST @ ${halfGst.toFixed(2)}%:`, halfAmt);
        doc.moveDown(0.2);
        drawLine(doc.y, true);
        doc.moveDown(0.3);
      }

      printTotalRow('Grand Total:', sale.grand_total, true, 12);
      doc.moveDown(0.3);
      drawLine(doc.y);
      doc.moveDown(0.3);

      const amtPaidColor = parseFloat(sale.amount_paid) > 0 ? '#15803d' : '#000000';
      const amtDueColor  = parseFloat(sale.amount_due) > 0  ? '#dc2626' : '#000000';
      printTotalRow('Amount Paid:', sale.amount_paid, false, 10, amtPaidColor);
      printTotalRow('Balance Due:', sale.amount_due, parseFloat(sale.amount_due) > 0, 10, amtDueColor);

      if (sale.notes) {
        doc.moveDown(1);
        doc.fontSize(9).font('Helvetica-Bold').text('Notes:', LEFT);
        doc.font('Helvetica').text(sale.notes, LEFT, doc.y, { width: W });
      }

      doc.moveDown(2);
      drawLine(doc.y, true);
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666')
        .text('Thank you for your business!', { align: 'center', width: W });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
