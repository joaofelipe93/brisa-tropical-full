import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, getTodayStats, getWhatsAppStatus } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:    { label: 'Pendente',     color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  confirmed:  { label: 'Confirmado',   color: '#3b82f6', bg: '#dbeafe', icon: '✅' },
  preparing:  { label: 'Preparando',   color: '#8b5cf6', bg: '#ede9fe', icon: '👨‍🍳' },
  delivering: { label: 'A caminho',    color: '#10b981', bg: '#d1fae5', icon: '🛵' },
  delivered:  { label: 'Entregue',     color: '#6b7280', bg: '#f3f4f6', icon: '🎉' },
  cancelled:  { label: 'Cancelado',    color: '#ef4444', bg: '#fee2e2', icon: '❌' }
};

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered'];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [filter, setFilter] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ordersData, statsData, waData] = await Promise.all([
        getOrders({ status: filter || undefined }),
        getTodayStats(),
        getWhatsAppStatus()
      ]);
      setOrders(ordersData.orders);
      setStats(statsData);
      setWaStatus(waData);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // auto-refresh 30s
    return () => clearInterval(interval);
  }, [filter]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (activeOrder?.id === orderId) setActiveOrder(prev => ({ ...prev, status }));
      toast.success(`Status atualizado: ${STATUS_CONFIG[status].label}`);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f5ff', fontFamily: 'var(--font-body)' }}>
      {/* Header Admin */}
      <div style={{
        background: 'linear-gradient(135deg, #1e0d4e, #2d1b69)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🍇</span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '16px', fontWeight: '800' }}>
              Brisa Tropical
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>Painel Administrativo</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: waStatus?.isReady ? '#22c55e' : '#ef4444',
            color: 'white',
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '99px'
          }}>
            {waStatus?.isReady ? '📱 WA Online' : '📵 WA Offline'}
          </span>
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Pedidos Hoje', value: stats.total_orders, icon: '📦', color: 'var(--purple-600)' },
              { label: 'Faturamento', value: `R$ ${Number(stats.total_revenue).toFixed(2)}`, icon: '💰', color: '#22c55e' },
              { label: 'Pendentes', value: stats.pending_count, icon: '⏳', color: '#f59e0b' },
              { label: 'A Caminho', value: stats.delivering_count, icon: '🛵', color: '#3b82f6' }
            ].map(card => (
              <div key={card.label} style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '14px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '28px' }}>{card.icon}</span>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '600' }}>{card.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: card.color }}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WhatsApp QR */}
        {waStatus?.qrCodeData && (
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-sm)',
            border: '2px solid #f59e0b'
          }}>
            <p style={{ fontWeight: '800', marginBottom: '12px', color: '#92400e' }}>
              📱 Escaneie para conectar o WhatsApp
            </p>
            <img src={waStatus.qrCodeData} alt="WhatsApp QR Code" style={{ width: 200, height: 200, margin: '0 auto' }} />
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[{ value: '', label: 'Todos' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.icon + ' ' + v.label }))].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '99px',
                border: '2px solid',
                borderColor: filter === f.value ? 'var(--purple-600)' : 'var(--gray-200)',
                background: filter === f.value ? 'var(--purple-600)' : 'white',
                color: filter === f.value ? 'white' : 'var(--gray-700)',
                fontWeight: '700',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
              <div style={{ fontSize: '36px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
              <p style={{ marginTop: '8px', fontWeight: '600' }}>Carregando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p style={{ fontWeight: '600' }}>Nenhum pedido encontrado</p>
            </div>
          ) : orders.map(order => {
            const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
            const isActive = activeOrder?.id === order.id;

            return (
              <div key={order.id} style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                border: isActive ? '2px solid var(--purple-400)' : '2px solid transparent'
              }}>
                {/* Order Header */}
                <div
                  onClick={() => setActiveOrder(isActive ? null : order)}
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      background: st.bg,
                      color: st.color,
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}>
                      {st.icon} {st.label}
                    </span>
                    <div>
                      <p style={{ fontWeight: '800', fontSize: '14px' }}>
                        #{String(order.id).padStart(4, '0')} — {order.customer_name}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        {order.neighborhood_name} · {order.payment_method === 'pix' ? '🔑 PIX' : '💳 Cartão'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '800', color: 'var(--purple-700)', fontSize: '16px' }}>
                      R$ {Number(order.total).toFixed(2)}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Order Details */}
                {isActive && (
                  <div style={{ borderTop: '1px solid var(--gray-100)', padding: '14px 16px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                      📱 {order.customer_phone} | 📍 {order.address}
                    </p>

                    {/* Status actions */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {nextStatus && (
                          <button
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            style={{
                              background: 'linear-gradient(135deg, #2d1b69, #5b3fa8)',
                              color: 'white',
                              borderRadius: 'var(--radius-md)',
                              padding: '8px 16px',
                              fontWeight: '700',
                              fontSize: '13px'
                            }}
                          >
                            {STATUS_CONFIG[nextStatus].icon} {STATUS_CONFIG[nextStatus].label}
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          style={{
                            background: '#fee2e2',
                            color: '#ef4444',
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 16px',
                            fontWeight: '700',
                            fontSize: '13px'
                          }}
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
