// src/pages/admin/Catalog.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  adminGetProducts, adminGetCategories,
  adminCreateProduct, adminUpdateProduct, adminToggleProduct, adminDeleteProduct,
  adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
} from '../../services/adminApi';
import ProductModal from './ProductModal';
import CategoryModal from './CategoryModal';

export default function Catalog() {
  const [tab, setTab]               = useState('products');
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [productModal, setProductModal] = useState(null); // null | 'new' | product
  const [categoryModal, setCategoryModal] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([adminGetProducts(), adminGetCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Produtos ───────────────────────────────────────────────
  const handleSaveProduct = async (form) => {
    if (!form.category_id || !form.name || !form.price)
      return toast.error('Preencha os campos obrigatórios');

    try {
      if (productModal?.id) {
        await adminUpdateProduct(productModal.id, form);
        toast.success('Produto atualizado!');
      } else {
        await adminCreateProduct(form);
        toast.success('Produto criado!');
      }
      setProductModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleToggle = async (product) => {
    try {
      const { available } = await adminToggleProduct(product.id);
      toast.success(available ? '✅ Produto ativado' : '❌ Produto desativado');
      fetchData();
    } catch { toast.error('Erro ao alterar disponibilidade'); }
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Deletar "${product.name}"?`)) return;
    try {
      await adminDeleteProduct(product.id);
      toast.success('Produto deletado');
      fetchData();
    } catch { toast.error('Erro ao deletar'); }
  };

  // ── Categorias ─────────────────────────────────────────────
  const handleSaveCategory = async (form) => {
    if (!form.name || !form.slug) return toast.error('Nome e slug são obrigatórios');
    try {
      if (categoryModal?.id) {
        await adminUpdateCategory(categoryModal.id, form);
        toast.success('Categoria atualizada!');
      } else {
        await adminCreateCategory(form);
        toast.success('Categoria criada!');
      }
      setCategoryModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Deletar "${category.name}"?`)) return;
    try {
      await adminDeleteCategory(category.id);
      toast.success('Categoria deletada');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao deletar');
    }
  };

  const thStyle = {
    padding: '10px 14px', textAlign: 'left',
    fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '2px solid var(--gray-100)', whiteSpace: 'nowrap'
  };

  const tdStyle = {
    padding: '12px 14px', fontSize: '14px',
    borderBottom: '1px solid var(--gray-100)', verticalAlign: 'middle'
  };

  const btnStyle = (color) => ({
    padding: '5px 12px', borderRadius: '8px', border: 'none',
    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
    background: color === 'purple' ? 'var(--purple-100)' : color === 'red' ? '#fee2e2' : 'var(--gray-100)',
    color: color === 'purple' ? 'var(--purple-700)' : color === 'red' ? '#ef4444' : 'var(--gray-600)',
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800' }}>
          🗂️ Gerenciar Cardápio
        </h1>
        <button
          onClick={() => tab === 'products' ? setProductModal('new') : setCategoryModal('new')}
          style={{
            background: 'linear-gradient(135deg, #2d1b69, #5b3fa8)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '10px 20px', fontWeight: '800', fontSize: '14px', cursor: 'pointer'
          }}
        >
          ➕ {tab === 'products' ? 'Novo Produto' : 'Nova Categoria'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--gray-100)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'products',   label: '🍇 Produtos' },
          { key: 'categories', label: '📂 Categorias' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? 'var(--purple-700)' : 'var(--gray-500)',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
          <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
          <p style={{ marginTop: '8px', fontWeight: '600' }}>Carregando...</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>

            {/* Tabela Produtos */}
            {tab === 'products' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={thStyle}>Produto</th>
                    <th style={thStyle}>Categoria</th>
                    <th style={thStyle}>Preço</th>
                    <th style={thStyle}>Promoção</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ opacity: p.available ? 1 : 0.5 }}>
                      <td style={tdStyle}>
                        <p style={{ fontWeight: '700', marginBottom: '2px' }}>{p.name}</p>
                        {p.description && <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{p.description}</p>}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: 'var(--purple-50)', color: 'var(--purple-700)', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {p.category_name}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '800', color: 'var(--gray-900)' }}>R$ {Number(p.price).toFixed(2)}</span>
                      </td>
                      <td style={tdStyle}>
                        {p.promo_price
                          ? <span style={{ fontWeight: '800', color: '#ef4444' }}>R$ {Number(p.promo_price).toFixed(2)}</span>
                          : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleToggle(p)}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', border: 'none',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            background: p.available ? '#dcfce7' : '#fee2e2',
                            color: p.available ? '#16a34a' : '#ef4444',
                          }}
                        >
                          {p.available ? '✅ Ativo' : '❌ Inativo'}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={btnStyle('purple')} onClick={() => setProductModal(p)}>✏️ Editar</button>
                          <button style={btnStyle('red')} onClick={() => handleDeleteProduct(p)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tabela Categorias */}
            {tab === 'categories' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--gray-50)' }}>
                  <tr>
                    <th style={thStyle}>Categoria</th>
                    <th style={thStyle}>Slug</th>
                    <th style={thStyle}>Produtos</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '20px', marginRight: '8px' }}>{c.icon}</span>
                        <span style={{ fontWeight: '700' }}>{c.name}</span>
                      </td>
                      <td style={tdStyle}>
                        <code style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {c.slug}
                        </code>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '700' }}>{c.product_count}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                          background: c.active ? '#dcfce7' : '#fee2e2',
                          color: c.active ? '#16a34a' : '#ef4444'
                        }}>
                          {c.active ? '✅ Ativa' : '❌ Inativa'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={btnStyle('purple')} onClick={() => setCategoryModal(c)}>✏️ Editar</button>
                          <button style={btnStyle('red')} onClick={() => handleDeleteCategory(c)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modais */}
      {productModal && (
        <ProductModal
          product={productModal === 'new' ? null : productModal}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => setProductModal(null)}
        />
      )}

      {categoryModal && (
        <CategoryModal
          category={categoryModal === 'new' ? null : categoryModal}
          onSave={handleSaveCategory}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </div>
  );
}
