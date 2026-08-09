export const generateWhatsAppBillText = (order) => {
  const orderId = order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : '#ORD';
  const dateStr = new Date(order.date || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  let itemsText = '';
  if (order.items && order.items.length > 0) {
    itemsText = order.items.map((item, idx) => 
      `${idx + 1}. *${item.name}* ${item.packSize ? `(${item.packSize})` : ''} x ${item.quantity} = ₹${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');
  } else {
    itemsText = '1. Order Items';
  }

  const message = 
`🌾 *AGRIINDIA - OFFICIAL ORDER INVOICE* 🌾
━━━━━━━━━━━━━━━━━━━━━
👤 *Farmer Name:* ${order.farmerName || 'Valued Farmer'}
🆔 *Invoice ID:* ${orderId}
📅 *Date & Time:* ${dateStr}
👨‍🌾 *Advisor:* ${order.advisorName || 'Direct'}
━━━━━━━━━━━━━━━━━━━━━
📦 *ORDERED ITEMS:*
${itemsText}

💰 *TOTAL AMOUNT:* ₹${(order.totalAmount || 0).toLocaleString()}
💳 *Payment Mode:* ${order.paymentMethod || (order.payment ? 'Paid' : 'Cash on Delivery')}
⚡ *Order Status:* ACCEPTED & CONFIRMED ✅
━━━━━━━━━━━━━━━━━━━━━
Thank you for choosing AgriIndiaa! For support, contact your advisor or admin. 🙏`;

  return message;
};

export const sendWhatsAppBill = (order) => {
  const text = generateWhatsAppBillText(order);
  let rawPhone = order.farmerPhone || order.phone || '9510459100';
  let cleanPhone = String(rawPhone).replace(/\D/g, '');
  if (!cleanPhone) {
    cleanPhone = '919510459100';
  } else if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const encodedText = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

  window.open(url, '_blank');
};
