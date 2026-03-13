import { useState } from 'react';

export default function OrderConfirmation({ order, onNewOrder }) {
  const isPix = order.payment_method === 'pix';
  const [copied, setCopied] = useState(false);

  const openOwnerWhatsApp = () => {
    if (order.whatsapp_owner_link) window.open(order.whatsapp_owner_link, '_blank');
  };

  const openCustomerWhatsApp = () => {
    if (order.whatsapp_customer_link) window.open(order.whatsapp_customer_link, '_blank');
  };

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(order.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback para dispositivos mais antigos
      const el = document.createElement('textarea');
      el.value = order.pix_key;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2d1b69 0%, #5b3fa8 40%, #f0ebff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      {/* Success Icon */}
      <div style={{
        width: 80, height: 80,
        background: '#22c55e',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '40px',
        marginBottom: '16px',
        boxShadow: '0 0 0 12px rgba(34,197,94,0.2)',
        animation: 'pulse 2s infinite'
      }}>
        ✓
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
        Pedido Enviado! 🎉
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '8px' }}>
        Pedido #{order.order_number}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '32px' }}>
        ⏱ Tempo estimado: {order.estimated_time}
      </p>

      {/* PIX Card */}
      {isPix && (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          width: '100%',
          maxWidth: '360px',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔑</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--gray-900)' }}>
            Pague via PIX
          </h3>

          <div style={{
            background: 'var(--purple-50)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '12px',
            border: '2px dashed var(--purple-300)'
          }}>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: '600', marginBottom: '4px' }}>CHAVE PIX</p>
            <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--purple-700)', wordBreak: 'break-all' }}>
              {order.pix_key}
            </p>
          </div>

          <div style={{
            background: 'var(--purple-50)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: '600', marginBottom: '4px' }}>VALOR A PAGAR</p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--purple-700)' }}>
              R$ {order.total.toFixed(2)}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
              Favorecido: {order.pix_name}
            </p>
          </div>

          <button
            onClick={copyPixKey}
            style={{
              width: '100%',
              background: copied ? '#22c55e' : 'linear-gradient(135deg, #2d1b69, #5b3fa8)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontWeight: '800',
              fontSize: '14px',
              transition: 'background 0.3s'
            }}
          >
            {copied ? '✅ Chave copiada!' : '📋 Copiar Chave PIX'}
          </button>
        </div>
      )}

      {/* Card na entrega */}
      {!isPix && (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          width: '100%',
          maxWidth: '360px',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>💳</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
            Cartão na Entrega
          </h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
            Tenha <strong>R$ {order.total.toFixed(2)}</strong> disponível no seu cartão quando o entregador chegar!
          </p>
        </div>
      )}

      {/* WhatsApp info */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        width: '100%',
        maxWidth: '360px',
        marginBottom: '16px',
        backdropFilter: 'blur(8px)'
      }}>
        <p style={{ color: 'white', fontSize: '13px', lineHeight: 1.6, marginBottom: '12px' }}>
          📱 {isPix
            ? 'Clique abaixo para enviar o pedido ao WhatsApp do estabelecimento. Após pagar, envie o comprovante!'
            : 'Clique abaixo para notificar o estabelecimento pelo WhatsApp.'}
        </p>
        <button
          onClick={openOwnerWhatsApp}
          style={{
            width: '100%',
            background: '#25D366',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontWeight: '800',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: isPix && order.whatsapp_customer_link ? '8px' : '0'
          }}
        >
          📲 Enviar Pedido pelo WhatsApp
        </button>
        {isPix && order.whatsapp_customer_link && (
          <button
            onClick={openCustomerWhatsApp}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '10px',
              fontWeight: '700',
              fontSize: '13px'
            }}
          >
            💬 Receber instruções PIX no meu WhatsApp
          </button>
        )}
      </div>

      <button
        onClick={onNewOrder}
        style={{
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 32px',
          fontSize: '15px',
          fontWeight: '800'
        }}
      >
        🛒 Fazer Novo Pedido
      </button>
    </div>
  );
}
