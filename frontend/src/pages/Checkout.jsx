import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { getNeighborhoods, createOrder } from "../services/api";
import toast from "react-hot-toast";

export default function Checkout({ onSuccess, onBack }) {
  const { cart, subtotal, clearCart } = useCart();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    neighborhood_id: "",
    address: "",
    address_complement: "",
    payment_method: "pix",
    notes: "",
  });

  const selectedNeighborhood = neighborhoods.find(
    (n) => n.id === Number(form.neighborhood_id),
  );
  const deliveryFee = selectedNeighborhood?.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    getNeighborhoods()
      .then(setNeighborhoods)
      .catch(() => toast.error("Erro ao carregar bairros"));
  }, []);

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 10)
      return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  };

  const zones = [...new Set(neighborhoods.map((n) => n.zone))].sort();

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Informe seu nome");
    if (form.phone.replace(/\D/g, "").length < 10)
      return toast.error("Telefone inválido");
    if (!form.neighborhood_id) return toast.error("Selecione o bairro");
    if (!form.address.trim()) return toast.error("Informe o endereço");
    if (cart.items.length === 0) return toast.error("Carrinho vazio");

    setLoading(true);
    try {
      const items = cart.items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        toppings: item.toppings,
        notes: item.notes,
      }));

      const result = await createOrder({
        customer: {
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, ""),
        },
        items,
        neighborhood_id: Number(form.neighborhood_id),
        address: form.address.trim(),
        address_complement: form.address_complement.trim(),
        payment_method: form.payment_method,
        notes: form.notes.trim(),
      });

      clearCart();
      onSuccess(result);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao enviar pedido");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: "2px solid var(--gray-200)",
    borderRadius: "var(--radius-md)",
    padding: "12px 14px",
    fontSize: "15px",
    transition: "border-color 0.2s",
    background: "white",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "700",
    fontSize: "13px",
    color: "var(--gray-700)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div
      style={{
        background: "var(--gray-50)",
        minHeight: "100vh",
        paddingBottom: "100px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #2d1b69, #5b3fa8)",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            width: 36,
            height: 36,
            fontSize: "16px",
          }}
        >
          ←
        </button>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            color: "white",
            fontSize: "18px",
            fontWeight: "800",
          }}
        >
          Finalizar Pedido
        </h2>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>
        {/* Resumo do carrinho */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            style={{
              fontWeight: "800",
              marginBottom: "10px",
              color: "var(--gray-700)",
            }}
          >
            📦 Resumo do Pedido
          </p>
          {cart.items.map((item, i) => {
            const price = item.product.promo_price || item.product.price;
            let itemTotal = price * item.quantity;
            if (item.toppings?.length > 0) {
              item.toppings.forEach((t) => {
                if (typeof t === "object" && t.price) {
                  itemTotal += t.price * item.quantity;
                }
              });
            }
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "var(--gray-700)" }}>
                  {item.quantity}x {item.product.name}
                </span>
                <span style={{ fontWeight: "700" }}>
                  R$ {itemTotal.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dados do cliente */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            style={{
              fontWeight: "800",
              marginBottom: "14px",
              color: "var(--gray-700)",
            }}
          >
            👤 Seus Dados
          </p>

          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Nome completo *</label>
            <input
              style={inputStyle}
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--purple-500)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--gray-200)")}
            />
          </div>

          <div>
            <label style={labelStyle}>WhatsApp / Celular *</label>
            <input
              style={inputStyle}
              placeholder="(84) 99999-9999"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))
              }
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--purple-500)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--gray-200)")}
            />
          </div>
        </div>

        {/* Endereço */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            style={{
              fontWeight: "800",
              marginBottom: "14px",
              color: "var(--gray-700)",
            }}
          >
            📍 Endereço de Entrega
          </p>

          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Bairro *</label>
            <select
              style={{
                ...inputStyle,
                color: form.neighborhood_id
                  ? "var(--gray-900)"
                  : "var(--gray-500)",
              }}
              value={form.neighborhood_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, neighborhood_id: e.target.value }))
              }
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--purple-500)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--gray-200)")}
            >
              <option value="">Selecione o bairro...</option>
              {zones.map((zone) => (
                <optgroup key={zone} label={`Zona ${zone}`}>
                  {neighborhoods
                    .filter((n) => n.zone === zone)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} — R$ {n.delivery_fee.toFixed(2)} ({n.min_time}-
                        {n.max_time}min)
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Rua e Número *</label>
            <input
              style={inputStyle}
              placeholder="Rua das Flores, 123"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--purple-500)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--gray-200)")}
            />
          </div>

          <div>
            <label style={labelStyle}>Complemento</label>
            <input
              style={inputStyle}
              placeholder="Apto 12, Casa B, Próximo ao mercado..."
              value={form.address_complement}
              onChange={(e) =>
                setForm((f) => ({ ...f, address_complement: e.target.value }))
              }
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--purple-500)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--gray-200)")}
            />
          </div>
        </div>

        {/* Pagamento */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            style={{
              fontWeight: "800",
              marginBottom: "14px",
              color: "var(--gray-700)",
            }}
          >
            💳 Forma de Pagamento
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {[
              {
                value: "pix",
                label: "PIX",
                icon: "🔑",
                desc: "Pagamento rápido",
              },
              {
                value: "card",
                label: "Cartão",
                icon: "💳",
                desc: "Na entrega",
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setForm((f) => ({ ...f, payment_method: option.value }))
                }
                style={{
                  padding: "14px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid",
                  borderColor:
                    form.payment_method === option.value
                      ? "var(--purple-600)"
                      : "var(--gray-200)",
                  background:
                    form.payment_method === option.value
                      ? "var(--purple-50)"
                      : "white",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                  {option.icon}
                </div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "14px",
                    color:
                      form.payment_method === option.value
                        ? "var(--purple-700)"
                        : "var(--gray-700)",
                  }}
                >
                  {option.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--gray-500)" }}>
                  {option.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <label style={labelStyle}>📝 Observações (opcional)</label>
          <textarea
            style={{ ...inputStyle, height: "70px", resize: "none" }}
            placeholder="Alguma observação para o pedido?"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Total e botão */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "14px",
              color: "var(--gray-500)",
            }}
          >
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "14px",
              fontSize: "14px",
              color: "var(--gray-500)",
            }}
          >
            <span>
              🛵 Frete{" "}
              {selectedNeighborhood ? `(${selectedNeighborhood.name})` : ""}
            </span>
            <span>
              {deliveryFee > 0
                ? `R$ ${deliveryFee.toFixed(2)}`
                : selectedNeighborhood
                  ? "Grátis"
                  : "—"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "800",
              fontSize: "18px",
              marginBottom: "16px",
              paddingTop: "10px",
              borderTop: "2px solid var(--gray-100)",
            }}
          >
            <span>Total</span>
            <span style={{ color: "var(--purple-700)" }}>
              R$ {total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "var(--gray-300)"
                : "linear-gradient(135deg, #2d1b69, #5b3fa8)",
              color: "white",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "800",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    animation: "spin 1s linear infinite",
                    display: "inline-block",
                  }}
                >
                  ⏳
                </span>
                Enviando pedido...
              </>
            ) : (
              `✅ Confirmar Pedido · R$ ${total.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
