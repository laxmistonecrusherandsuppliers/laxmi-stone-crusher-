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
    const margin = 12;
    let y = 14;

    // Top horizontal border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(margin, y, W - margin, y);
    y += 5;

    // Top Contacts & Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Subhash Warule', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('7020778707', margin, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Laxmi Stone Crusher', W / 2, y + 2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('prasad warule', W - margin, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('8010406871', W - margin, y + 4.5, { align: 'right' });

    y += 11;
    doc.line(margin, y, W - margin, y);
    y += 5;

    // Subheader: Challan No, Name (left), Date (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Challan No: ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(sale.invoice_number || ''), margin + 24, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Date : ', W - margin - 35, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(sale.sale_date), W - margin - 22, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Name : ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(sale.customer_name || 'N/A'), margin + 16, y);

    y += 5;
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

    const tableCols = ['date', 'vech no', 'material', 'trip', 'brass', 'rate', 'total'];
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
    const minRows = 14;
    while (tableRows.length < minRows) {
      tableRows.push([' ', ' ', ' ', ' ', ' ', ' ', ' ']);
    }

    doc.autoTable({
      startY: y,
      head: [tableCols],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        lineColor: [0, 0, 0],
        lineWidth: 0.35
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 28 },
        2: { cellWidth: 54 },
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
    doc.text('Total:', W - margin - 42, y + 4.8);
    doc.text(formatINR(sale.grand_total), W - margin - 2, y + 4.8, { align: 'right' });

    y += 12;

    // Payment Info & Signatory
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Payment: ${(sale.payment_mode || 'due').toUpperCase()}   |   Paid: ${formatINR(sale.amount_paid)}   |   Due: ${formatINR(sale.amount_due)}`, margin, y);

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
