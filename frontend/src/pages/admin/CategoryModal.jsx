// src/pages/admin/CategoryModal.jsx
import { useState, useEffect } from 'react';

export default function CategoryModal({ category, onSave, onClose }) {
  const isEdit = !!category;
  const [form, setForm] = useState({ name: '', slug: '', icon: '🍇', sort_order: 0, active: 1 });

  useEffect(() => {
    if (category) {
      setForm({
        name:       category.name,
        slug:       category.slug,
        icon:       category.icon || '🍇',
        sort_order: category.sort_order || 0,
        active:     category.active,
      });
    }
  }, [category]);

  const inputStyle = {
    width: '100%', border: '2px solid var(--gray-200)',
    borderRadius: '10px', padding: '10px 12px',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block', fontWeight: '700', fontSize: '12px',
    color: 'var(--gray-600)', marginBottom: '5px', textTransform: 'uppercase'
  };

  const autoSlug = (name) => name.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

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
          background: 'white', borderRadius: '20px', padding: '28px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800' }}>
            {isEdit ? '✏️ Editar Categoria' : '➕ Nova Categoria'}
          </h2>
          <button onClick={onClose} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              placeholder="Ex: Açaí no Copo"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            />
          </div>

          <div>
            <label style={labelStyle}>Slug *</label>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="Ex: acai-no-copo"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Emoji/Ícone</label>
              <input
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="🍇"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
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

          {isEdit && (
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.active}
                onChange={e => setForm(f => ({ ...f, active: Number(e.target.value) }))}
                style={inputStyle}
              >
                <option value={1}>✅ Ativa</option>
                <option value={0}>❌ Inativa</option>
              </select>
            </div>
          )}
        </div>

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
            {isEdit ? '💾 Salvar' : '➕ Criar categoria'}
          </button>
        </div>
      </div>
    </div>
  );
}
