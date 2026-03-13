// Serviço WhatsApp via link wa.me — sem Puppeteer, sem instalação pesada!
// O backend gera a URL e o frontend abre no WhatsApp do dono/cliente.

export function buildOwnerMessage({ order, customer, items, neighborhood, settings }) {
  const paymentText = order.payment_method === 'pix'
    ? `💳 *PIX*\nChave: ${settings.pix_key}\nNome: ${settings.pix_name}`
    : `💳 *Cartão na Entrega*`;

  const itemsList = items.map(item => {
    const toppings = item.toppings ? `\n   ↳ ${item.toppings}` : '';
    const notes = item.notes ? `\n   ↳ Obs: ${item.notes}` : '';
    return `• ${item.quantity}x ${item.product_name} — R$ ${(item.unit_price * item.quantity).toFixed(2)}${toppings}${notes}`;
  }).join('\n');

  return `
🌴 *NOVO PEDIDO - BRISA TROPICAL AÇAÍ* 🍇
━━━━━━━━━━━━━━━━━━━━━
🔢 *Pedido #${String(order.id).padStart(4, '0')}*

👤 *CLIENTE*
Nome: ${customer.name}
Telefone: ${customer.phone}

📦 *ITENS*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━
💰 Subtotal: R$ ${order.subtotal.toFixed(2)}
🛵 Frete (${neighborhood.name}): R$ ${order.delivery_fee.toFixed(2)}
✅ *TOTAL: R$ ${order.total.toFixed(2)}*

📍 *ENTREGA*
${order.address}${order.address_complement ? `, ${order.address_complement}` : ''}
Bairro: ${neighborhood.name} (${neighborhood.min_time}–${neighborhood.max_time}min)

${paymentText}
${order.notes ? `\n📝 Obs: ${order.notes}` : ''}
━━━━━━━━━━━━━━━━━━━━━
${order.payment_method === 'pix' ? '⚠️ Solicite o comprovante ao cliente!' : ''}
  `.trim();
}

export function buildCustomerPixMessage({ order, settings }) {
  return `
Olá! 🌴 Aqui é a *Brisa Tropical Açaí* 🍇

Recebemos seu pedido *#${String(order.id).padStart(4, '0')}* — R$ *${order.total.toFixed(2)}* ✅

Pague via *PIX* para confirmar:
🔑 Chave: *${settings.pix_key}*
👤 Favorecido: *${settings.pix_name}*
💰 Valor: *R$ ${order.total.toFixed(2)}*

Após pagar, *envie o comprovante* aqui! 📸🙏
  `.trim();
}

export function buildWhatsAppLink(phoneNumber, message) {
  const phone = phoneNumber.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function getWhatsAppLinks({ order, customer, items, neighborhood, settings }) {
  const ownerMsg = buildOwnerMessage({ order, customer, items, neighborhood, settings });
  const ownerLink = buildWhatsAppLink(settings.whatsapp_number, ownerMsg);

  let customerLink = null;
  if (order.payment_method === 'pix' && customer.phone?.length >= 10) {
    const customerPhone = customer.phone.replace(/\D/g, '');
    const fullPhone = customerPhone.startsWith('55') ? customerPhone : `55${customerPhone}`;
    const customerMsg = buildCustomerPixMessage({ order, settings });
    customerLink = buildWhatsAppLink(fullPhone, customerMsg);
  }

  return { ownerLink, customerLink };
}

// Mantido por compatibilidade — não faz nada nessa versão leve
export function initWhatsApp() { console.log('📱 WhatsApp via wa.me (sem Puppeteer)'); }
export function getWhatsAppStatus() { return { isReady: true, mode: 'wa.me' }; }
