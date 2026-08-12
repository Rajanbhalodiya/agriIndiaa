const buildInvoiceHtml = (order, autoPrint = false) => {
  const orderId = order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : '#ORD';
  const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEVHcEwAfjwAfTsAfTwAfDsAejoAeToAejoAejoAezsAezsAfDsAezsAezoAfDsAfz0Aezsop6StAAAAEXRSTlMAHD4tdOT/8NSnx0+CtpUOZs6ZJnkAAAClSURBVHgB7c9FFgQhDATQwgoJkvufdl7G3db9dxDH5h0HD49XQogxMZeK51yMlabJ83gfLdOMCbMAG6fDSyFTDxAaZmbFIQglGQdvBMRMmFgbK9Xxhm24BAYhBnUovOHX/W1WNWejTc9kaQzX4UqmUMjhZ8+ssTDVgotMa8nkz4fBtRIu7RUAlIILabUtGHRGGLjrDFWk5GCGP38O3NCJW03xp80O2XoGEx3EemAAAAAASUVORK5CYII=';

  const dateStr = new Date(order.date || Date.now()).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong> ${item.packSize ? `<span style="color: #666; font-size: 12px;">(${item.packSize})</span>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price || 0).toLocaleString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${orderId}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 20px; background: #fff; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); font-size: 14px; line-height: 24px; border-radius: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-wrap { display: flex; align-items: center; gap: 12px; }
        .logo-img { width: 40px; height: 40px; object-fit: contain; }
        .logo { font-size: 24px; font-weight: bold; color: #16a34a; }
        .title { font-size: 20px; font-weight: bold; color: #333; text-align: right; }
        .details-grid { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f9fafb; padding: 15px; border-radius: 8px; gap: 12px; }
        .details-col { flex: 1; }
        .details-col h4 { margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .details-col p { margin: 0; font-size: 14px; font-weight: 500; }
        table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f3f4f6; color: #4b5563; font-weight: 600; padding: 10px; font-size: 12px; text-transform: uppercase; }
        .total-box { display: flex; justify-content: flex-end; margin-top: 15px; }
        .total-table { width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .total-row.grand { font-size: 18px; font-weight: bold; color: #16a34a; border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 5px; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 12px; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-pending { background: #fee2e2; color: #b91c1c; }
        .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px; }
        @media print {
          body { padding: 0; }
          .invoice-box { border: none; box-shadow: none; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div class="logo-wrap">
            <img src="${logoBase64}" alt="AgriIndia Logo" class="logo-img" />
            <div>
              <div class="logo">AgriIndiaa</div>
              <div style="font-size: 12px; color: #666;">Official Agriculture Order Invoice</div>
            </div>
          </div>
          <div class="title">
            INVOICE
            <div style="font-size: 13px; color: #6b7280; font-weight: normal;">${orderId}</div>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-col">
            <h4>Billed To (Farmer)</h4>
            <p><strong>${order.farmerName || 'N/A'}</strong></p>
            <p style="color: #4b5563; font-size: 13px;">📞 ${order.farmerPhone || 'N/A'}</p>
          </div>
          <div class="details-col" style="text-align: center;">
            <h4>Assigned Advisor</h4>
            <p><strong>${order.advisorName || 'Direct'}</strong></p>
          </div>
          <div class="details-col" style="text-align: right;">
            <h4>Order Details</h4>
            <p style="font-size: 13px;"><strong>Date:</strong> ${dateStr}</p>
            <p style="font-size: 13px;"><strong>Payment:</strong> ${order.paymentMethod || (order.payment ? 'Paid' : 'Cash on Delivery')}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center;">#</th>
              <th>Product Name</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-table">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${(order.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div class="total-row grand">
              <span>Total Amount:</span>
              <span>₹${(order.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 25px; text-align: center;">
          <span class="badge ${order.payment ? 'badge-paid' : 'badge-pending'}">
            ${order.payment ? 'PAYMENT COMPLETED ✅' : 'PAYMENT PENDING ⏳'}
          </span>
        </div>

        <div class="footer">
          <p>Thank you for choosing AgriIndiaa! For support, contact your agricultural advisor or administrator.</p>
        </div>
      </div>
      ${autoPrint ? `<script>window.onload = function() { window.print(); };</script>` : ''}
    </body>
    </html>
  `;
};

/**
 * Download invoice as a printable HTML file (saves to disk via <a> tag)
 */
export const downloadInvoice = (order) => {
  if (!order) return;
  const orderId = order._id ? `ORD-${order._id.slice(-6).toUpperCase()}` : 'ORD';
  const html = buildInvoiceHtml(order, false);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${orderId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Print invoice — opens a new browser window and triggers the print dialog
 */
export const printInvoice = (order) => {
  if (!order) return;
  const html = buildInvoiceHtml(order, true);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
