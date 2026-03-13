import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../../context/CartContext';
import acaiImg from '../../assets/acai-produto.png';

// Injeta estilo fixo no head uma única vez
const styleId = 'cart-toast-style';
if (!document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    #cart-toast-wrapper {
      position: fixed !important;
      bottom: 24px !important;
      left: 0 !important;
      right: 0 !important;
      display: flex !important;
      justify-content: center !important;
      z-index: 999999 !important;
      pointer-events: none !important;
      will-change: transform !important;
      -webkit-transform: translateZ(0) !important;
      transform: translateZ(0) !important;
    }
    #cart-toast-inner {
      width: calc(100% - 32px);
      max-width: 440px;
      background: linear-gradient(135deg, #2d1b69, #5b3fa8);
      border-radius: 16px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 32px rgba(45,27,105,0.5);
      border: 1px solid rgba(255,255,255,0.15);
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
      will-change: transform, opacity;
    }
    #cart-toast-inner.hidden {
      transform: translateY(100px) !important;
      opacity: 0 !important;
    }
    #cart-toast-inner.visible {
      transform: translateY(0) !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

export default function AddedToCartToast() {
  const { cart } = useCart();
  const prevCount = useRef(cart.items.length);
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef();

  useEffect(() => {
    const lastItem = cart.items[cart.items.length - 1];
    if (cart.items.length > prevCount.current && lastItem) {
      clearTimeout(timerRef.current);
      setToast(lastItem);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 3000);
    }
    prevCount.current = cart.items.length;
  }, [cart.items]);

  if (!toast) return null;

  const price = toast.product.promo_price || toast.product.price;

  return createPortal(
    <div id="cart-toast-wrapper">
      <div id="cart-toast-inner" className={visible ? 'visible' : 'hidden'}>
        <div style={{
          width: 42, height: 42,
          borderRadius: '12px',
          overflow: 'hidden',
          flexShrink: 0,
          border: '1.5px solid rgba(255,255,255,0.2)'
        }}>
          <img src={acaiImg} alt="açaí" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: 'white', fontWeight: '800', fontSize: '14px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            margin: 0
          }}>
            {toast.product.name}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px', marginBottom: 0 }}>
            {toast.quantity}x adicionado ao carrinho
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '15px' }}>
            R$ {(price * toast.quantity).toFixed(2)}
          </span>
          <div style={{
            width: 26, height: 26, background: '#22c55e',
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', color: 'white', fontWeight: '800',
            flexShrink: 0
          }}>✓</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
