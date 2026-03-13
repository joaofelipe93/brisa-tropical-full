import { useState, useEffect } from 'react';
import { getCategories, getProducts, getToppings, getStore } from '../services/api';
import Header from '../components/layout/Header';
import ProductCard from '../components/ui/ProductCard';
import Cart from '../components/ui/Cart';
import AddedToCartToast from '../components/ui/AddedToCartToast';
import Checkout from './Checkout';
import OrderConfirmation from './OrderConfirmation';
import logo from '../assets/logo.jpg';

export default function Home() {
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState('menu'); // menu | checkout | confirmation
  const [orderResult, setOrderResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStore(), getCategories(), getToppings()])
      .then(([storeData, cats, tops]) => {
        setStore(storeData);
        setCategories(cats);
        setToppings(tops);
        if (cats.length > 0) {
          setActiveCategory(cats[0].slug);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory) {
      getProducts(activeCategory).then(setProducts);
    }
  }, [activeCategory]);

  if (view === 'checkout') {
    return (
      <Checkout
        onBack={() => setView('menu')}
        onSuccess={(result) => { setOrderResult(result); setView('confirmation'); }}
      />
    );
  }

  if (view === 'confirmation') {
    return <OrderConfirmation order={orderResult} onNewOrder={() => setView('menu')} />;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
        background: 'linear-gradient(135deg, #2d1b69, #5b3fa8)'
      }}>
        <img
          src={logo}
          alt="Brisa Tropical"
          style={{
            width: 100, height: 100,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.3)',
            animation: 'pulse 1.5s infinite'
          }}
        />
        <p style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>
          Carregando cardápio...
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Header store={store} onCartOpen={() => setCartOpen(true)} />

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2d1b69 0%, #5b3fa8 60%, #9b7fe8 100%)',
        padding: '24px 16px',
        textAlign: 'center'
      }}>
        <img
          src={logo}
          alt="Brisa Tropical Açaí"
          style={{
            width: 90, height: 90,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.3)',
            marginBottom: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        />
        <h2 style={{
          fontFamily: 'var(--font-display)',
          color: 'white',
          fontSize: '22px',
          fontWeight: '800',
          marginBottom: '4px'
        }}>
          Brisa Tropical Açaí
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '16px' }}>
          🌴 O melhor açaí de Natal/RN
        </p>

        {store?.settings && (
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: '700',
              backdropFilter: 'blur(8px)'
            }}>
              🛵 Entrega em Natal/RN
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: '700',
              backdropFilter: 'blur(8px)'
            }}>
              💳 PIX ou Cartão
            </span>
          </div>
        )}
      </div>

      {/* Category Nav */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid var(--gray-100)',
        padding: '0 16px',
        overflowX: 'auto',
        display: 'flex',
        gap: '4px',
        scrollbarWidth: 'none',
        position: 'sticky',
        top: store && !store.isOpenNow ? '100px' : '64px',
        zIndex: 90
      }}>
        {categories.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            style={{
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeCategory === cat.slug ? '3px solid var(--purple-600)' : '3px solid transparent',
              color: activeCategory === cat.slug ? 'var(--purple-700)' : 'var(--gray-500)',
              fontWeight: activeCategory === cat.slug ? '800' : '600',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div style={{ padding: '16px', maxWidth: '480px', margin: '0 auto' }}>
        {activeCategory === 'complementos' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} toppings={toppings} />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} toppings={toppings} />
            ))}
          </div>
        )}

        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>😴</div>
            <p style={{ fontWeight: '600' }}>Nenhum produto nesta categoria</p>
          </div>
        )}
      </div>

      {/* Business Hours */}
      {store?.hours && (
        <div style={{ padding: '0 16px 24px', maxWidth: '480px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <p style={{ fontWeight: '800', marginBottom: '12px', color: 'var(--gray-700)' }}>🕐 Horários de Funcionamento</p>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => {
              const hour = store.hours.find(h => h.day_of_week === i);
              const isToday = new Date().getDay() === i;
              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: i < 6 ? '1px solid var(--gray-100)' : 'none',
                  fontWeight: isToday ? '800' : '400',
                  color: isToday ? 'var(--purple-700)' : 'var(--gray-700)',
                  fontSize: '14px'
                }}>
                  <span>{day}{isToday ? ' (hoje)' : ''}</span>
                  <span>
                    {hour?.is_open
                      ? `${hour.open_time} – ${hour.close_time}`
                      : <span style={{ color: '#ef4444' }}>Fechado</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart */}
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => { setCartOpen(false); setView('checkout'); }}
      />

      {/* Toast ao adicionar item */}
      <AddedToCartToast />
    </div>
  );
}
