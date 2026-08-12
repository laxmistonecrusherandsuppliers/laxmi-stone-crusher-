// Lakshmi Stone Crusher & Suppliers - Executive PDF & Statement Generator

window.LSCPDF = {
  downloadInvoicePDF: function (sale, settings) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF generation library is loading... Please try again in a moment.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const formatINR = window.LSCUtils.formatCurrency;
    const formatDate = window.LSCUtils.formatDate;

    const W = 210;
    const margin = 15;
    let y = 15;

    // Header Accent Bar
    doc.setFillColor(30, 41, 59); // Dark Slate #1e293b
    doc.rect(margin, y, W - (margin * 2), 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(settings.business_name || 'LAKSHMI STONE CRUSHER & SUPPLIERS', W / 2, y + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text(`${settings.business_address || ''} • Ph: ${settings.business_mobile || ''}`, W / 2, y + 14, { align: 'center' });
    if (settings.gstin) {
      doc.text(`GSTIN: ${settings.gstin}`, W / 2, y + 19, { align: 'center' });
    }

    y += 30;

    // Invoice Title & Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(sale.gst_enabled ? 'TAX INVOICE' : 'CRUSHER SALE BILL', margin, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice No: ${sale.invoice_number}`, margin, y + 5);
    doc.text(`Date: ${formatDate(sale.sale_date)}`, margin, y + 10);

    // Customer Info Box Right
    const custX = 125;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(custX, y - 4, 70, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('BILL TO (CUSTOMER)', custX + 4, y);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(sale.customer_name || 'N/A', custX + 4, y + 5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (sale.customer_mobile) doc.text(`Ph: ${sale.customer_mobile}`, custX + 4, y + 10);

    y += 24;

    // Items Table
    const tableCols = ['#', 'Material Description', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)'];
    const tableRows = (sale.items || []).map((item, i) => [
      String(i + 1),
      item.custom_material_name || item.material_name || 'Stone Crusher Material',
      parseFloat(item.quantity).toFixed(3),
      item.unit || 'Tonne',
      formatINR(item.rate),
      formatINR(item.amount)
    ]);

    doc.autoTable({
      startY: y,
      head: [tableCols],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      }
    });

    y = doc.lastAutoTable.finalY + 8;

    // Summary Totals
    const totLabelX = 125;
    const totValX = 195;

    const printTotRow = (label, val, bold = false, color = [15, 23, 42]) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      doc.text(label, totLabelX, y);
      doc.text(formatINR(val), totValX, y, { align: 'right' });
      y += 5;
    };

    if (sale.gst_enabled) {
      printTotRow('Subtotal (Taxable):', sale.subtotal);
      const halfGst = parseFloat(sale.gst_percent) / 2;
      const halfAmt = parseFloat(sale.gst_amount) / 2;
      printTotRow(`CGST @ ${halfGst.toFixed(2)}%:`, halfAmt);
      printTotRow(`SGST @ ${halfGst.toFixed(2)}%:`, halfAmt);
    }

    doc.setFontSize(10);
    printTotRow('Grand Total Amount:', sale.grand_total, true, [37, 99, 235]);
    doc.setFontSize(9);
    printTotRow('Amount Paid:', sale.amount_paid, false, [16, 185, 129]);
    printTotRow('Balance Due:', sale.amount_due, parseFloat(sale.amount_due) > 0, parseFloat(sale.amount_due) > 0 ? [239, 68, 68] : [15, 23, 42]);

    y += 10;

    // Bank Account Details & Signatory
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, W - margin, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('PAYMENT SETTLEMENT DETAILS', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Bank: State Bank of India | A/C No: 38920192810 | IFSC: SBIN0001234', margin, y + 4);
    doc.text('UPI ID: lakshmistonecrusher@sbi', margin, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('For Lakshmi Stone Crusher & Suppliers', W - margin - 50, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Authorized Signatory)', W - margin - 35, y + 14);

    doc.save(`Invoice_${sale.invoice_number}.pdf`);
  },

  downloadReportPDF: function (title, headers, rows, summary = null) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF generation library is loading... Please try again.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 12;
    let y = 12;

    // Top Dark Header Banner
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, W - (margin * 2), 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('LAKSHMI STONE CRUSHER & SUPPLIERS', W / 2, y + 7, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    doc.text('Crusher Zone, Highway Road • Ph: +91 98765 43210 • GSTIN: 27AAAAA0000A1Z5', W / 2, y + 13, { align: 'center' });

    y += 28;

    // Report Title Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), margin, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W - margin, y, { align: 'right' });

    y += 6;

    // Table
    doc.autoTable({
      startY: y,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    y = doc.lastAutoTable.finalY + 10;

    // Summary Box
    if (summary) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, W - (margin * 2), 16, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('STATEMENT FINANCIAL SUMMARY', margin + 4, y + 5);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Billed: ${summary.billed}`, margin + 4, y + 11);
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Paid: ${summary.paid}`, margin + 70, y + 11);
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text(`Net Balance Due: ${summary.due}`, margin + 130, y + 11);

      y += 24;
    }

    // Signatory
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('For Lakshmi Stone Crusher & Suppliers', W - margin - 50, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Authorized Signatory)', W - margin - 35, y + 12);

    doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  }
};
