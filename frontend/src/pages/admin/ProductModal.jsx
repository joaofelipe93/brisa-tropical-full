// src/pages/admin/ProductModal.jsx
import { useState, useEffect } from 'react';

export default function ProductModal({ product, categories, onSave, onClose }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    category_id:  '',
    name:         '',
    description:  '',
    price:        '',
    promo_price:  '',
    available:    1,
    sort_order:   0,
  });

  useEffect(() => {
    if (product) {
      setForm({
        category_id:  product.category_id,
        name:         product.name,
        description:  product.description || '',
        price:        product.price,
        promo_price:  product.promo_price || '',
        available:    product.available,
        sort_order:   product.sort_order || 0,
      });
    }
  }, [product]);

  const inputStyle = {
    width: '100%', border: '2px solid var(--gray-200)',
    borderRadius: '10px', padding: '10px 12px',
    fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block', fontWeight: '700', fontSize: '12px',
    color: 'var(--gray-600)', marginBottom: '5px', textTransform: 'uppercase'
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 2000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '20px',
          padding: '28px', width: '100%', maxWidth: '500px',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800' }}>
            {isEdit ? '✏️ Editar Produto' : '➕ Novo Produto'}
          </h2>
          <button onClick={onClose} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Categoria */}
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            >
              <option value="">Selecione...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Açaí 500ml"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição do produto..."
              style={{ ...inputStyle, height: '70px', resize: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            />
          </div>

          {/* Preço + Promo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Preço (R$) *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0,00"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Preço Promo (R$)</label>
              <input
                type="number" step="0.01" min="0"
                value={form.promo_price}
                onChange={e => setForm(f => ({ ...f, promo_price: e.target.value }))}
                placeholder="Deixe vazio"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
          </div>

          {/* Disponível + Ordem */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Disponível</label>
              <select
                value={form.available}
                onChange={e => setForm(f => ({ ...f, available: Number(e.target.value) }))}
                style={inputStyle}
              >
                <option value={1}>✅ Sim</option>
                <option value={0}>❌ Não</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ordem</label>
              <input
                type="number" min="0"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: 'var(--gray-100)', color: 'var(--gray-700)',
              border: 'none', borderRadius: '12px', padding: '12px',
              fontWeight: '700', fontSize: '14px', cursor: 'pointer'
            }}
          >Cancelar</button>
          <button
            onClick={() => onSave(form)}
            style={{
              flex: 2,
              background: 'linear-gradient(135deg, #2d1b69, #5b3fa8)',
              color: 'white', border: 'none', borderRadius: '12px',
              padding: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer'
            }}
          >
            {isEdit ? '💾 Salvar alterações' : '➕ Criar produto'}
          </button>
        </div>
      </div>
    </div>
  );
}
