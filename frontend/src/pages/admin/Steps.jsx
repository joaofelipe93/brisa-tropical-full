// src/pages/admin/Steps.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import adminApi from '../../services/adminApi';

const api = {
  getSteps:      ()           => adminApi.get('/admin/steps').then(r => r.data),
  updateStep:    (id, data)   => adminApi.put(`/admin/steps/${id}`, data).then(r => r.data),
  createOption:  (stepId, data) => adminApi.post(`/admin/steps/${stepId}/options`, data).then(r => r.data),
  updateOption:  (stepId, optionId, data) => adminApi.put(`/admin/steps/${stepId}/options/${optionId}`, data).then(r => r.data),
  deleteOption:  (stepId, optionId) => adminApi.delete(`/admin/steps/${stepId}/options/${optionId}`).then(r => r.data),
};

function OptionRow({ option, stepId, onRefresh }) {
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(option.name);
  const [price, setPrice]       = useState(option.extra_price);

  const save = async () => {
    try {
      await api.updateOption(stepId, option.id, {
        name, extra_price: Number(price), sort_order: option.sort_order, active: option.active,
      });
      toast.success('Opção atualizada!');
      setEditing(false);
      onRefresh();
    } catch { toast.error('Erro ao salvar'); }
  };

  const toggle = async () => {
    try {
      await api.updateOption(stepId, option.id, {
        name: option.name, extra_price: option.extra_price,
        sort_order: option.sort_order, active: option.active ? 0 : 1,
      });
      onRefresh();
    } catch { toast.error('Erro ao alterar'); }
  };

  const remove = async () => {
    if (!confirm(`Deletar "${option.name}"?`)) return;
    try {
      await api.deleteOption(stepId, option.id);
      toast.success('Opção deletada');
      onRefresh();
    } catch { toast.error('Erro ao deletar'); }
  };

  const tdStyle = { padding: '8px 12px', fontSize: '13px', borderBottom: '1px solid var(--gray-100)', verticalAlign: 'middle' };

  return (
    <tr style={{ opacity: option.active ? 1 : 0.45 }}>
      <td style={tdStyle}>
        {editing ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '4px 8px', fontSize: '13px', width: '100%' }}
          />
        ) : (
          <span style={{ fontWeight: '600' }}>{option.name}</span>
        )}
      </td>
      <td style={tdStyle}>
        {editing ? (
          <input
            type="number" step="0.01" min="0" value={price}
            onChange={e => setPrice(e.target.value)}
            style={{ border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '4px 8px', fontSize: '13px', width: '80px' }}
          />
        ) : (
          <span>{option.extra_price > 0 ? `+R$ ${Number(option.extra_price).toFixed(2)}` : '—'}</span>
        )}
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {editing ? (
            <>
              <button onClick={save} style={{ padding: '4px 10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>💾</button>
              <button onClick={() => { setEditing(false); setName(option.name); setPrice(option.extra_price); }} style={{ padding: '4px 10px', background: 'var(--gray-100)', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} style={{ padding: '4px 10px', background: 'var(--purple-100)', color: 'var(--purple-700)', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>✏️</button>
              <button onClick={toggle} style={{ padding: '4px 10px', background: option.active ? '#fee2e2' : '#dcfce7', color: option.active ? '#ef4444' : '#16a34a', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                {option.active ? '❌' : '✅'}
              </button>
              <button onClick={remove} style={{ padding: '4px 10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>🗑️</button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function NewOptionRow({ stepId, onRefresh, onCancel }) {
  const [name, setName]   = useState('');
  const [price, setPrice] = useState(0);

  const save = async () => {
    if (!name.trim()) return toast.error('Digite o nome');
    try {
      await api.createOption(stepId, { name: name.trim(), extra_price: Number(price) });
      toast.success('Opção adicionada!');
      onRefresh();
      onCancel();
    } catch { toast.error('Erro ao adicionar'); }
  };

  return (
    <tr style={{ background: 'var(--purple-50)' }}>
      <td style={{ padding: '8px 12px' }}>
        <input
          autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Nome da opção..."
          style={{ border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', width: '100%' }}
        />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <input
          type="number" step="0.01" min="0" value={price}
          onChange={e => setPrice(e.target.value)}
          style={{ border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '6px 8px', fontSize: '13px', width: '80px' }}
        />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={save} style={{ padding: '5px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>✓ Salvar</button>
          <button onClick={onCancel} style={{ padding: '5px 10px', background: 'var(--gray-100)', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
        </div>
      </td>
    </tr>
  );
}

export default function Steps() {
  const [steps, setSteps]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [addingTo, setAddingTo]     = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm]     = useState({});

  const fetchSteps = async () => {
    try {
      setSteps(await api.getSteps());
    } catch { toast.error('Erro ao carregar passos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSteps(); }, []);

  const startEditStep = (step) => {
    setEditingStep(step.id);
    setStepForm({
      title: step.title, subtitle: step.subtitle, emoji: step.emoji,
      min_selections: step.min_selections, max_selections: step.max_selections,
      sort_order: step.sort_order, active: step.active,
    });
  };

  const saveStep = async (id) => {
    try {
      await api.updateStep(id, stepForm);
      toast.success('Passo atualizado!');
      setEditingStep(null);
      fetchSteps();
    } catch { toast.error('Erro ao salvar'); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
      <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
        🛠️ Passos de Personalização
      </h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>
        Gerencie as etapas e opções que o cliente vê ao montar o açaí.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step, idx) => (
          <div key={step.id} style={{
            background: 'white', borderRadius: '16px',
            boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
            opacity: step.active ? 1 : 0.6,
            border: expanded === step.id ? '2px solid var(--purple-400)' : '2px solid transparent'
          }}>
            {/* Header do passo */}
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: 'var(--purple-100)', color: 'var(--purple-700)',
                borderRadius: '50%', width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '13px', flexShrink: 0
              }}>{idx + 1}</span>

              {editingStep === step.id ? (
                <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input value={stepForm.emoji} onChange={e => setStepForm(f => ({ ...f, emoji: e.target.value }))}
                    style={{ width: '50px', border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '5px', fontSize: '16px', textAlign: 'center' }} />
                  <input value={stepForm.title} onChange={e => setStepForm(f => ({ ...f, title: e.target.value }))}
                    style={{ flex: 1, minWidth: '150px', border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '5px 8px', fontSize: '13px', fontWeight: '700' }} />
                  <input value={stepForm.subtitle} onChange={e => setStepForm(f => ({ ...f, subtitle: e.target.value }))}
                    style={{ flex: 1, minWidth: '120px', border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '5px 8px', fontSize: '12px' }} />
                  <input type="number" min="0" value={stepForm.min_selections} onChange={e => setStepForm(f => ({ ...f, min_selections: Number(e.target.value) }))}
                    style={{ width: '55px', border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '5px', fontSize: '12px' }} placeholder="Min" />
                  <input type="number" min="1" value={stepForm.max_selections} onChange={e => setStepForm(f => ({ ...f, max_selections: Number(e.target.value) }))}
                    style={{ width: '55px', border: '1.5px solid var(--purple-400)', borderRadius: '8px', padding: '5px', fontSize: '12px' }} placeholder="Max" />
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '800', fontSize: '14px' }}>{step.emoji} {step.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                    {step.subtitle} · min: {step.min_selections} / max: {step.max_selections === 99 ? '∞' : step.max_selections}
                    · <span style={{ color: step.options.length > 0 ? 'var(--purple-600)' : 'var(--gray-400)', fontWeight: '600' }}>
                      {step.options.length} opções
                    </span>
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {editingStep === step.id ? (
                  <>
                    <button onClick={() => saveStep(step.id)} style={{ padding: '5px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>💾 Salvar</button>
                    <button onClick={() => setEditingStep(null)} style={{ padding: '5px 10px', background: 'var(--gray-100)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditStep(step)} style={{ padding: '5px 10px', background: 'var(--purple-100)', color: 'var(--purple-700)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>✏️</button>
                    <button
                      onClick={() => setExpanded(expanded === step.id ? null : step.id)}
                      style={{ padding: '5px 12px', background: 'var(--gray-100)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                    >{expanded === step.id ? '▲ Fechar' : '▼ Opções'}</button>
                  </>
                )}
              </div>
            </div>

            {/* Lista de opções */}
            {expanded === step.id && (
              <div style={{ borderTop: '1px solid var(--gray-100)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--gray-50)' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Opção</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Preço extra</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step.options.map(opt => (
                      <OptionRow key={opt.id} option={opt} stepId={step.id} onRefresh={fetchSteps} />
                    ))}
                    {addingTo === step.id && (
                      <NewOptionRow stepId={step.id} onRefresh={fetchSteps} onCancel={() => setAddingTo(null)} />
                    )}
                  </tbody>
                </table>
                <div style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => setAddingTo(step.id)}
                    disabled={addingTo === step.id}
                    style={{
                      padding: '7px 16px', background: 'linear-gradient(135deg, #2d1b69, #5b3fa8)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer', opacity: addingTo === step.id ? 0.5 : 1
                    }}
                  >➕ Nova opção</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
