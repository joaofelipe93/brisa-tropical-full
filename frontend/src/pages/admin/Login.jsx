// src/pages/admin/Login.jsx
import { useState } from 'react';
import { login } from '../../services/adminApi';
import toast from 'react-hot-toast';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!password) return toast.error('Digite a senha');
    setLoading(true);
    try {
      const { token } = await login(password);
      localStorage.setItem('admin_token', token);
      toast.success('Acesso liberado!');
      onLogin();
    } catch {
      toast.error('Senha incorreta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e0d4e, #2d1b69, #5b3fa8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px',
        padding: '40px 32px', width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '52px', marginBottom: '8px' }}>🍇</div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '22px',
          fontWeight: '800', color: 'var(--purple-900)', marginBottom: '4px'
        }}>Brisa Tropical</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '32px' }}>
          Painel Administrativo
        </p>

        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <label style={{
            display: 'block', fontWeight: '700', fontSize: '13px',
            color: 'var(--gray-700)', marginBottom: '6px', textTransform: 'uppercase'
          }}>
            🔒 Senha de acesso
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Digite a senha..."
            style={{
              width: '100%', border: '2px solid var(--gray-200)',
              borderRadius: '12px', padding: '12px 14px',
              fontSize: '15px', outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--purple-500)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'var(--gray-200)' : 'linear-gradient(135deg, #2d1b69, #5b3fa8)',
            color: loading ? 'var(--gray-400)' : 'white',
            borderRadius: '12px', padding: '14px',
            fontSize: '15px', fontWeight: '800',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none', transition: 'all 0.2s'
          }}
        >
          {loading ? '⏳ Entrando...' : '🔓 Entrar'}
        </button>
      </div>
    </div>
  );
}
