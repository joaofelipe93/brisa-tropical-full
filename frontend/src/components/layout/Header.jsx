import { useEffect, useRef, useState } from 'react';
import { useCart } from '../../context/CartContext';
import logo from '../../assets/logo.jpg';

export default function Header({ store, onCartOpen }) {
  const { totalItems } = useCart();
  const prevItems = useRef(totalItems);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (totalItems > prevItems.current) {
      setShake(true);
      setFlash(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setFlash(false), 800);
    }
    prevItems.current = totalItems;
  }, [totalItems]);

  return (
    <>
      <style>{`
        @keyframes cartShake {
          0%   { transform: scale(1) rotate(0deg); }
          20%  { transform: scale(1.25) rotate(-8deg); }
          40%  { transform: scale(1.25) rotate(8deg); }
          60%  { transform: scale(1.15) rotate(-4deg); }
          80%  { transform: scale(1.1) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ripple {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <header style={{
        background: 'linear-gradient(135deg, #2d1b69 0%, #5b3fa8 100%)',
        padding: '0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 20px rgba(45,27,105,0.4)'
      }}>
        {store && !store.isOpenNow && (
          <div style={{
            background: '#ef4444', color: 'white',
            textAlign: 'center', padding: '6px',
            fontSize: '13px', fontWeight: '700'
          }}>
            😴 Fechado no momento — volte em breve!
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', maxWidth: '480px', margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={logo}
              alt="Brisa Tropical Açaí"
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            />
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)', color: 'white',
                fontSize: '18px', fontWeight: '800', lineHeight: 1.1
              }}>Brisa Tropical</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600' }}>
                Açaí Delivery 🌴
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {store?.isOpenNow && (
              <span style={{
                background: '#22c55e', color: 'white',
                fontSize: '11px', fontWeight: '700',
                padding: '3px 10px', borderRadius: '99px'
              }}>● Aberto</span>
            )}

            {/* Botão carrinho com animação */}
            <button
              onClick={onCartOpen}
              style={{
                background: flash ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)',
                border: flash ? '1.5px solid rgba(255,255,255,0.8)' : '1.5px solid rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: '12px',
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '14px', fontWeight: '700',
                position: 'relative',
                transition: 'background 0.3s, border 0.3s',
                cursor: 'pointer'
              }}
            >
              {/* Ripple ao adicionar */}
              {flash && (
                <span style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '12px',
                  border: '2px solid rgba(255,255,255,0.6)',
                  animation: 'ripple 0.7s ease-out forwards',
                  pointerEvents: 'none'
                }} />
              )}

              <span style={{
                display: 'inline-block',
                animation: shake ? 'cartShake 0.6s ease' : 'none',
                fontSize: '18px'
              }}>🛒</span>

              {totalItems > 0 && (
                <span style={{
                  background: '#ff7043', color: 'white',
                  borderRadius: '99px', minWidth: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '800', padding: '0 5px',
                  animation: shake ? 'badgePop 0.4s ease' : 'none'
                }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
