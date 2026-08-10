const PDFDocument = require('pdfkit');

// Format number as Indian currency string (e.g., 1,23,456.00)
const formatINR = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Generate a bill or GST invoice PDF.
 * @param {object} sale - Sale object including sale.items[] and payment_logs[]
 * @param {object} settings - Key-value settings from DB
 * @returns {PDFDocument} - PDFKit document (caller must pipe & end)
 */
exports.generateBillPdf = (sale, settings) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const W = 515; // usable width (595 - 2*40)
  const LEFT = 40;
  const RIGHT = 555;

  const drawLine = (y, dashed = false) => {
    doc.save();
    if (dashed) {
      doc.dash(4, { space: 3 });
    }
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.restore();
    doc.strokeColor('#000000').lineWidth(1);
  };

  // ─── HEADER ────────────────────────────────────────────────────────────────
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
  const headerBottomY = doc.y;
  drawLine(headerBottomY);
  doc.moveDown(0.5);

  // ─── INVOICE DETAILS ───────────────────────────────────────────────────────
  const detailsY = doc.y;
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Invoice No:', LEFT, detailsY);
  doc.font('Helvetica').text(sale.invoice_number, LEFT + 70, detailsY);

  doc.font('Helvetica-Bold').text('Date:', LEFT, detailsY + 14);
  doc.font('Helvetica').text(formatDate(sale.sale_date), LEFT + 70, detailsY + 14);

  // Customer details on the right side
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

  // ─── ITEMS TABLE ───────────────────────────────────────────────────────────
  const col = {
    no:     { x: LEFT,        w: 25 },
    mat:    { x: LEFT + 25,   w: 180 },
    qty:    { x: LEFT + 205,  w: 60 },
    unit:   { x: LEFT + 265,  w: 50 },
    rate:   { x: LEFT + 315,  w: 80 },
    amount: { x: LEFT + 395,  w: 120 },
  };

  // Table header
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

  // Table rows
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

  // ─── TOTALS SECTION ────────────────────────────────────────────────────────
  const totColLabel = LEFT + 270;
  const totColValue = RIGHT;
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
  if (parseFloat(sale.amount_due) > 0) {
    printTotalRow('Balance Due:', sale.amount_due, true, 10, amtDueColor);
  } else {
    printTotalRow('Balance Due:', 0, false, 10, '#15803d');
  }

  if (sale.notes) {
    doc.moveDown(1);
    doc.fontSize(9).font('Helvetica-Bold').text('Notes:', LEFT);
    doc.font('Helvetica').text(sale.notes, LEFT, doc.y, { width: W });
  }

  // ─── FOOTER ────────────────────────────────────────────────────────────────
  doc.moveDown(2);
  drawLine(doc.y, true);
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666')
    .text('Thank you for your business!', { align: 'center', width: W });
  doc.font('Helvetica').text(`${settings.business_name || ''} | ${settings.business_mobile || ''}`, { align: 'center', width: W });

  return doc;
};

/**
 * Generate a report PDF (daily, customer-wise, material-wise, or due report).
 * @param {object} reportData - { items: [], summary: {} }
 * @param {string} reportType - 'daily' | 'customer-wise' | 'material-wise' | 'due'
 * @param {object} dateRange - { from, to }
 * @param {object} settings - App settings
 * @returns {PDFDocument}
 */
exports.generateReportPdf = (reportData, reportType, dateRange, settings) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const W = 515;
  const LEFT = 40;
  const RIGHT = 555;

  const drawLine = (y) => {
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.strokeColor('#000000').lineWidth(1);
  };

  const reportTitles = {
    'daily': 'Daily Sales Report',
    'customer-wise': 'Customer-Wise Sales Report',
    'material-wise': 'Material-Wise Sales Report',
    'due': 'Outstanding Due Report',
  };

  // Header
  doc.fontSize(16).font('Helvetica-Bold')
    .text(settings.business_name || 'Lakshmi Stone Crusher & Suppliers', { align: 'center', width: W });
  doc.fontSize(13).font('Helvetica-Bold')
    .text(reportTitles[reportType] || 'Sales Report', { align: 'center', width: W });

  if (dateRange.from || dateRange.to) {
    doc.fontSize(9).font('Helvetica').fillColor('#555555')
      .text(`Period: ${dateRange.from || 'Beginning'} to ${dateRange.to || 'Now'}`, { align: 'center', width: W });
    doc.fillColor('#000000');
  }

  doc.moveDown(0.5);
  drawLine(doc.y);
  doc.moveDown(0.5);

  // Summary box
  const summary = reportData.summary || {};
  if (Object.keys(summary).length > 0) {
    doc.fontSize(9).font('Helvetica-Bold').text('SUMMARY', LEFT);
    doc.moveDown(0.3);
    const summaryItems = [
      ['Total Sales', summary.total_count || reportData.items?.length || 0],
      ['Total Amount', `₹${(parseFloat(summary.total_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ['Total Collected', `₹${(parseFloat(summary.total_paid) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ['Total Outstanding', `₹${(parseFloat(summary.total_due) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ];
    summaryItems.forEach(([label, val]) => {
      doc.fontSize(9).font('Helvetica').text(`${label}: `, LEFT, doc.y, { continued: true });
      doc.font('Helvetica-Bold').text(String(val));
    });
    doc.moveDown(0.5);
    drawLine(doc.y);
    doc.moveDown(0.5);
  }

  // Data table
  const items = reportData.items || [];
  if (items.length === 0) {
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text('No data found for the selected period.', { align: 'center', width: W });
    doc.fillColor('#000000');
    return doc;
  }

  // Column definitions per report type
  const columns = {
    'daily': [
      { label: 'Date', key: 'sale_date', w: 90, fmt: (v) => formatDate(v) },
      { label: 'Bills', key: 'count', w: 50 },
      { label: 'Total Amount', key: 'total_amount', w: 120, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
      { label: 'Collected', key: 'total_paid', w: 120, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
      { label: 'Due', key: 'total_due', w: 120, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
    ],
    'customer-wise': [
      { label: 'Customer', key: 'name', w: 140 },
      { label: 'Bills', key: 'count', w: 50 },
      { label: 'Total Amount', key: 'total_amount', w: 110, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
      { label: 'Collected', key: 'total_paid', w: 110, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
      { label: 'Due', key: 'total_due', w: 100, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
    ],
    'material-wise': [
      { label: 'Material', key: 'name', w: 160 },
      { label: 'Total Qty', key: 'total_qty', w: 90, align: 'right', fmt: (v) => `${parseFloat(v).toFixed(3)}` },
      { label: 'Avg Rate', key: 'avg_rate', w: 110, align: 'right', fmt: (v) => `₹${parseFloat(v).toFixed(2)}` },
      { label: 'Total Amount', key: 'total_amount', w: 140, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
    ],
    'due': [
      { label: 'Invoice', key: 'invoice_number', w: 110 },
      { label: 'Customer', key: 'customer_name', w: 130 },
      { label: 'Date', key: 'sale_date', w: 80, fmt: (v) => formatDate(v) },
      { label: 'Grand Total', key: 'grand_total', w: 90, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
      { label: 'Due', key: 'amount_due', w: 100, align: 'right', fmt: (v) => `₹${(parseFloat(v)||0).toLocaleString('en-IN',{minimumFractionDigits:2})}` },
    ],
  };

  const cols = columns[reportType] || columns['daily'];

  // Calculate x positions
  let xPos = LEFT;
  cols.forEach(col => { col.x = xPos; xPos += col.w; });

  // Table header
  const thY = doc.y;
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#444444');
  cols.forEach(col => {
    doc.text(col.label, col.x, thY, { width: col.w, align: col.align || 'left' });
  });
  doc.fillColor('#000000');
  doc.moveDown(0.4);
  drawLine(doc.y);
  doc.moveDown(0.3);

  // Table rows
  doc.fontSize(8.5).font('Helvetica');
  items.forEach((item, idx) => {
    if (doc.y > 750) {
      doc.addPage();
    }
    const rowY = doc.y;
    cols.forEach(col => {
      const raw = item[col.key];
      const val = col.fmt ? col.fmt(raw) : (raw ?? '');
      doc.text(String(val), col.x, rowY, { width: col.w, align: col.align || 'left' });
    });
    doc.moveDown(0.6);

    // Alternate row background (light gray)
    if (idx % 2 === 0) {
      doc.save();
      doc.rect(LEFT, rowY - 2, W, 16).fillOpacity(0.03).fill('#000000');
      doc.restore();
    }
  });

  // Footer
  doc.moveDown(1);
  drawLine(doc.y);
  doc.moveDown(0.3);
  doc.fontSize(8).font('Helvetica').fillColor('#888888')
    .text(`Generated on: ${new Date().toLocaleString('en-IN')} | ${settings.business_name || ''}`, { align: 'center', width: W });

  return doc;
};
