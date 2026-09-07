// Lakshmi Stone Crusher & Suppliers - Executive PDF & Statement Generator

window.LSCPDF = {
  // Pure white-background Goddess Laxmi logo for PDF rendering (no black box artifacts)
  goddessLogoBase64: 'data:image/jpeg;base64,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',

  downloadInvoicePDF: function (sale, settings) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF generation library is loading... Please try again in a moment.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const formatDate = window.LSCUtils.formatDate;

    // Safe currency formatter for standard PDF fonts (avoids corrupted rupee symbol)
    const formatPDFINR = (val) => {
      const num = parseFloat(val) || 0;
      return 'Rs. ' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const W = 210;
    const margin = 12;
    let y = 12;

    // Top horizontal border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(margin, y, W - margin, y);
    y += 3;

    // Centered Goddess Laxmi Logo (Clean white background, no black box)
    const logoW = 16;
    const logoH = 16;
    const logoX = (W - logoW) / 2;
    try {
      doc.addImage(this.goddessLogoBase64, 'JPEG', logoX, y, logoW, logoH);
    } catch (e) {
      console.warn('Could not render logo in PDF:', e);
    }

    // Top Contacts: Left (Subhash Warule) | Right (prasad warule)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Subhash Warule', margin, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('7020778707', margin, y + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('prasad warule', W - margin, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('8010406871', W - margin, y + 11, { align: 'right' });

    // Below logo: Company Title "Laxmi Stone Crusher" with generous spacing
    y += logoH + 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Laxmi Stone Crusher', W / 2, y, { align: 'center' });

    // Divider line below header title
    y += 4.5;
    doc.line(margin, y, W - margin, y);
    y += 5;

    // Subheader: Challan No, Name (left), Date (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Challan No: ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(sale.invoice_number || ''), margin + 22, y);

    const dateStr = formatDate(sale.sale_date);
    doc.setFont('helvetica', 'normal');
    doc.text(dateStr, W - margin, y, { align: 'right' });
    const dateWidth = doc.getTextWidth(dateStr);
    doc.setFont('helvetica', 'bold');
    doc.text('Date : ', W - margin - dateWidth - 2, y, { align: 'right' });

    y += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Name : ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(sale.customer_name || 'N/A'), margin + 14, y);

    y += 4;
    doc.line(margin, y, W - margin, y);
    y += 2;

    // Items table parser
    const parseItem = (item) => {
      let matName = item.custom_material_name || item.material_name || 'Stone Material';
      let date = sale.sale_date ? formatDate(sale.sale_date) : '';
      let veh = item.vehicle_ref || sale.notes || '';
      let trip = '1';

      const parenMatch = matName.match(/\((.*?)\)$/);
      if (parenMatch) {
        const inside = parenMatch[1];
        matName = matName.replace(/\((.*?)\)$/, '').trim();
        const dtM = inside.match(/Dt:\s*([^,]+)/);
        if (dtM) date = dtM[1].trim();
        const vehM = inside.match(/Veh:\s*([^,]+)/);
        if (vehM) veh = vehM[1].trim();
        const tripM = inside.match(/Trip:\s*([^,]+)/);
        if (tripM) trip = tripM[1].trim();
      }

      return {
        date: date || '-',
        veh: veh || '-',
        material: matName || '-',
        trip: trip || '1',
        brass: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        total: parseFloat(item.amount) || ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0))
      };
    };

    const tableCols = ['DATE', 'VEHICLE NO', 'MATERIAL', 'TRIP', 'BRASS', 'RATE', 'TOTAL'];
    let totalBrass = 0;
    const tableRows = (sale.items || []).map(item => {
      const parsed = parseItem(item);
      totalBrass += parsed.brass;
      return [
        parsed.date,
        parsed.veh,
        parsed.material,
        parsed.trip,
        parsed.brass > 0 ? parsed.brass.toFixed(3) : '',
        parsed.rate > 0 ? parsed.rate.toFixed(2) : '',
        parsed.total > 0 ? parsed.total.toFixed(2) : ''
      ];
    });

    // Pad table with empty grid rows to match authentic paper challan look
    const minRows = 12;
    while (tableRows.length < minRows) {
      tableRows.push(['', '', '', '', '', '', '']);
    }

    doc.autoTable({
      startY: y,
      head: [tableCols],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.2,
        minCellHeight: 6.2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
        lineColor: [0, 0, 0],
        lineWidth: 0.35
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'left' },
        1: { cellWidth: 28, halign: 'left' },
        2: { cellWidth: 54, halign: 'left' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY;

    // Total Row Border box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.rect(margin, y, W - (margin * 2), 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Total Brass: ${totalBrass.toFixed(3)}`, margin + 3, y + 4.8);
    doc.text('Total:', W - margin - 46, y + 4.8);
    doc.text(formatPDFINR(sale.grand_total), W - margin - 2, y + 4.8, { align: 'right' });

    y += 12;

    // Payment Info & Signatory
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Payment: ${(sale.payment_mode || 'due').toUpperCase()}   |   Paid: ${formatPDFINR(sale.amount_paid)}   |   Due: ${formatPDFINR(sale.amount_due)}`, margin, y);

    doc.line(W - margin - 45, y + 10, W - margin, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Authorized Signatory', W - margin - 42, y + 14);

    doc.save(`Challan_${sale.invoice_number}.pdf`);
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

    // Clean headers & rows of any broken ₹ symbols
    const cleanCell = (c) => typeof c === 'string' ? c.replace(/₹/g, 'Rs. ') : c;
    const cleanHeaders = headers.map(cleanCell);
    const cleanRows = rows.map(r => r.map(cleanCell));

    // Table
    doc.autoTable({
      startY: y,
      head: [cleanHeaders],
      body: cleanRows,
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
      doc.text(`Total Billed: ${cleanCell(summary.billed)}`, margin + 4, y + 11);
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Paid: ${cleanCell(summary.paid)}`, margin + 70, y + 11);
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text(`Net Balance Due: ${cleanCell(summary.due)}`, margin + 130, y + 11);

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
