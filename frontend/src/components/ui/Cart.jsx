import { useCart } from "../../context/CartContext";

export default function Cart({ isOpen, onClose, onCheckout }) {
  const { cart, subtotal, totalItems, removeItem, updateQty } = useCart();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 500,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "480px",
          background: "white",
          borderRadius: "24px 24px 0 0",
          padding: "20px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            background: "#e5e7eb",
            borderRadius: 2,
            margin: "0 auto 16px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: "800",
            }}
          >
            🛒 Seu Pedido
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "var(--gray-100)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--gray-500)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🍇</div>
            <p style={{ fontWeight: "600" }}>Seu carrinho está vazio</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>
              Adicione itens deliciosos!
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowY: "auto", flex: 1, marginBottom: "16px" }}>
              {cart.items.map((item, index) => {
                const price = item.product.promo_price || item.product.price;
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--gray-100)",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        background: "var(--purple-50)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        flexShrink: 0,
                      }}
                    >
                      🍇
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: "700",
                          fontSize: "14px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.product.name}
                      </p>
                      {item.toppings?.length > 0 && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--gray-500)",
                            marginTop: "2px",
                          }}
                        >
                          {item.toppings
                            .map((t) => (typeof t === "object" ? t.name : t))
                            .join(", ")}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "var(--purple-700)",
                          marginTop: "2px",
                        }}
                      >
                        R${" "}
                        {(() => {
                          let total = price * item.quantity;
                          if (item.toppings?.length > 0) {
                            item.toppings.forEach((t) => {
                              if (typeof t === "object" && t.price) {
                                total += t.price * item.quantity;
                              }
                            });
                          }
                          return total.toFixed(2);
                        })()}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => updateQty(index, item.quantity - 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1.5px solid var(--purple-400)",
                          background: "white",
                          color: "var(--purple-700)",
                          fontSize: "16px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          minWidth: "16px",
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(index, item.quantity + 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #5b3fa8, #9b7fe8)",
                          color: "white",
                          fontSize: "16px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total + Checkout */}
            <div
              style={{
                borderTop: "2px solid var(--gray-100)",
                paddingTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <span style={{ color: "var(--gray-500)", fontWeight: "600" }}>
                  Subtotal ({totalItems} {totalItems === 1 ? "item" : "itens"})
                </span>
                <span style={{ fontWeight: "800", fontSize: "17px" }}>
                  R$ {subtotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={onCheckout}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #2d1b69, #5b3fa8)",
                  color: "white",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px",
                  fontSize: "16px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                Finalizar Pedido →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
