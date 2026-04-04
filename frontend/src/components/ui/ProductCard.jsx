import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { getCustomizationSteps } from "../../services/api";
import acaiImg from "../../assets/acai-produto.png";
import acai1LitroImg from "../../assets/acai-1litro.png";

const getProductImage = (product) => {
  const name = product.name?.toLowerCase() || "";
  if (name.includes("1 litro") || name.includes("1litro")) return acai1LitroImg;
  return acaiImg;
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);

  const price = product.promo_price || product.price;
  const hasPromo = !!product.promo_price;
  const isCombo = product.category_slug === "combos";
  const isComplemento = product.category_slug === "complementos";
  const step = steps[currentStep];

  const openModal = async () => {
    setCurrentStep(0);
    setSelections({});
    setQty(1);
    setNotes("");
    setShowModal(true);

    if (!isCombo && !isComplemento && steps.length === 0) {
      setLoadingSteps(true);
      try {
        const data = await getCustomizationSteps();
        setSteps(data);
        // inicializar selections com arrays vazios para cada passo
        const initial = {};
        data.forEach((s) => {
          initial[s.id] = [];
        });
        setSelections(initial);
      } finally {
        setLoadingSteps(false);
      }
    } else {
      const initial = {};
      steps.forEach((s) => {
        initial[s.id] = [];
      });
      setSelections(initial);
    }
  };

  const toggleOption = (stepId, optionName, max) => {
    setSelections((prev) => {
      const current = prev[stepId] || [];
      if (current.includes(optionName))
        return { ...prev, [stepId]: current.filter((o) => o !== optionName) };
      if (max === 1) return { ...prev, [stepId]: [optionName] };
      if (current.length >= max) return prev;
      return { ...prev, [stepId]: [...current, optionName] };
    });
  };

  const canAdvance = () => {
    if (!step) return false;
    const sel = selections[step.id] || [];
    return sel.length >= step.min_selections;
  };

  const handleAdd = () => {
    // Coletar toppings com seus preços
    const toppings = [];
    Object.keys(selections).forEach((stepId) => {
      const step = steps.find((s) => s.id === parseInt(stepId));
      if (step) {
        selections[stepId].forEach((selectedName) => {
          const option = step.options.find((o) => o.name === selectedName);
          if (option) {
            toppings.push({
              name: option.name,
              price: option.extra_price || 0,
            });
          }
        });
      }
    });

    addItem(product, qty, toppings, notes);
    setAdded(true);
    setShowModal(false);
    setTimeout(() => setAdded(false), 2000);
  };

  // Card simples para complementos
  if (isComplemento) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius-md)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-sm)",
          border: "1.5px solid var(--gray-100)",
        }}
      >
        <div>
          <p style={{ fontWeight: "700", fontSize: "14px" }}>{product.name}</p>
          <p
            style={{
              color: "var(--purple-600)",
              fontWeight: "800",
              fontSize: "14px",
              marginTop: "2px",
            }}
          >
            + R$ {price.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => {
            addItem(product, 1, [], "");
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
          style={{
            background: added
              ? "#22c55e"
              : "linear-gradient(135deg, #5b3fa8, #9b7fe8)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            width: 36,
            height: 36,
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {added ? "✓" : "+"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={openModal}
        style={{
          background: "white",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
          border: "1.5px solid var(--gray-100)",
          cursor: "pointer",
          transition: "transform 0.2s",
          animation: "fadeIn 0.3s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-2px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <div
          style={{
            height: "140px",
            background: "#1a0f3e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img
            src={getProductImage(product)}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
            }}
          />
          {hasPromo && (
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#ef4444",
                color: "white",
                fontSize: "10px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "99px",
              }}
            >
              PROMO
            </span>
          )}
        </div>
        <div style={{ padding: "10px 12px" }}>
          <h3
            style={{ fontWeight: "800", fontSize: "14px", marginBottom: "4px" }}
          >
            {product.name}
          </h3>
          {product.description && (
            <p
              style={{
                fontSize: "11px",
                color: "var(--gray-500)",
                marginBottom: "8px",
                lineHeight: 1.4,
              }}
            >
              {product.description}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              {hasPromo && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--gray-500)",
                    textDecoration: "line-through",
                    marginRight: "4px",
                  }}
                >
                  R$ {product.price.toFixed(2)}
                </span>
              )}
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "var(--purple-700)",
                }}
              >
                R$ {price.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                background: added
                  ? "#22c55e"
                  : "linear-gradient(135deg, #5b3fa8, #9b7fe8)",
                color: "white",
                borderRadius: "10px",
                width: 30,
                height: 30,
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {added ? "✓" : "+"}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-end",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "24px 24px 0 0",
              width: "100%",
              maxWidth: "480px",
              margin: "0 auto",
              animation: "slideUp 0.3s ease",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <div style={{ padding: "12px 20px 0", flexShrink: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "#e5e7eb",
                  borderRadius: 2,
                  margin: "0 auto 12px",
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                padding: "0 20px 14px",
                borderBottom: "1px solid var(--gray-100)",
                flexShrink: 0,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "14px",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "2px solid var(--purple-200)",
                  }}
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center top",
                    }}
                  />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: "800",
                    }}
                  >
                    {product.name}
                  </h2>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "var(--purple-700)",
                    }}
                  >
                    R$ {price.toFixed(2)}
                  </p>
                </div>
              </div>

              {!isCombo && steps.length > 0 && (
                <div style={{ marginTop: "14px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {steps.map((s, i) => (
                      <div
                        key={s.id}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background:
                            i <= currentStep
                              ? "var(--purple-600)"
                              : "var(--gray-200)",
                          transition: "background 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--gray-400)",
                      marginTop: "5px",
                    }}
                  >
                    Passo {currentStep + 1} de {steps.length}
                  </p>
                </div>
              )}
            </div>

            {/* Conteúdo */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {loadingSteps ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--gray-500)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "32px",
                      animation: "spin 1s linear infinite",
                      display: "inline-block",
                    }}
                  >
                    ⏳
                  </div>
                  <p style={{ marginTop: "8px", fontWeight: "600" }}>
                    Carregando opções...
                  </p>
                </div>
              ) : !isCombo && step ? (
                <>
                  <div style={{ marginBottom: "14px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "3px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{step.emoji}</span>
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "var(--gray-900)",
                          textTransform: "uppercase",
                        }}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--purple-600)",
                        fontWeight: "700",
                        marginLeft: "28px",
                      }}
                    >
                      {step.subtitle}
                      {step.max_selections > 1 &&
                        (selections[step.id] || []).length > 0 && (
                          <span
                            style={{
                              color: "var(--gray-400)",
                              fontWeight: "400",
                            }}
                          >
                            {" "}
                            — {(selections[step.id] || []).length}/
                            {step.max_selections}
                          </span>
                        )}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {step.options.map((option) => {
                      const selected = (selections[step.id] || []).includes(
                        option.name,
                      );
                      const atMax =
                        (selections[step.id] || []).length >=
                          step.max_selections && !selected;
                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            !atMax &&
                            toggleOption(
                              step.id,
                              option.name,
                              step.max_selections,
                            )
                          }
                          style={{
                            padding: "13px 16px",
                            borderRadius: "var(--radius-md)",
                            border: "2px solid",
                            borderColor: selected
                              ? "var(--purple-600)"
                              : "var(--gray-200)",
                            background: selected
                              ? "var(--purple-50)"
                              : atMax
                                ? "var(--gray-50)"
                                : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: atMax ? "not-allowed" : "pointer",
                            opacity: atMax ? 0.5 : 1,
                            transition: "all 0.15s",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: selected ? "700" : "500",
                              fontSize: "14px",
                              color: selected
                                ? "var(--purple-700)"
                                : "var(--gray-700)",
                            }}
                          >
                            {option.name}
                            {option.extra_price > 0 && (
                              <span
                                style={{
                                  color: "var(--purple-500)",
                                  fontSize: "12px",
                                  marginLeft: "6px",
                                }}
                              >
                                +R$ {option.extra_price.toFixed(2)}
                              </span>
                            )}
                          </span>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius:
                                step.max_selections === 1 ? "50%" : "5px",
                              border: "2px solid",
                              borderColor: selected
                                ? "var(--purple-600)"
                                : "var(--gray-300)",
                              background: selected
                                ? "var(--purple-600)"
                                : "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {selected && (
                              <span
                                style={{
                                  color: "white",
                                  fontSize: "11px",
                                  fontWeight: "800",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                // Combo
                <>
                  {product.description && (
                    <p
                      style={{
                        color: "var(--gray-500)",
                        fontSize: "14px",
                        marginBottom: "16px",
                        lineHeight: 1.5,
                      }}
                    >
                      {product.description}
                    </p>
                  )}
                  <label
                    style={{
                      display: "block",
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "var(--gray-700)",
                      marginBottom: "6px",
                    }}
                  >
                    📝 Observações
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: sem granola, extra de morango..."
                    style={{
                      width: "100%",
                      border: "2px solid var(--gray-200)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 12px",
                      fontSize: "14px",
                      resize: "none",
                      height: "80px",
                    }}
                  />
                </>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "12px 20px 20px",
                borderTop: "1px solid var(--gray-100)",
                flexShrink: 0,
                background: "white",
              }}
            >
              {(isCombo || currentStep === steps.length - 1) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "20px",
                    marginBottom: "12px",
                  }}
                >
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "2px solid var(--purple-400)",
                      background: "white",
                      color: "var(--purple-700)",
                      fontSize: "20px",
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
                      fontSize: "22px",
                      fontWeight: "800",
                      minWidth: "26px",
                      textAlign: "center",
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #5b3fa8, #9b7fe8)",
                      color: "white",
                      fontSize: "20px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                {!isCombo && currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep((s) => s - 1)}
                    style={{
                      flex: 1,
                      background: "var(--gray-100)",
                      color: "var(--gray-700)",
                      borderRadius: "var(--radius-lg)",
                      padding: "14px",
                      fontSize: "15px",
                      fontWeight: "700",
                    }}
                  >
                    ← Voltar
                  </button>
                )}

                {!isCombo && currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => canAdvance() && setCurrentStep((s) => s + 1)}
                    disabled={!canAdvance()}
                    style={{
                      flex: 2,
                      background: canAdvance()
                        ? "linear-gradient(135deg, #2d1b69, #5b3fa8)"
                        : "var(--gray-200)",
                      color: canAdvance() ? "white" : "var(--gray-400)",
                      borderRadius: "var(--radius-lg)",
                      padding: "14px",
                      fontSize: "15px",
                      fontWeight: "800",
                      cursor: canAdvance() ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                    }}
                  >
                    Próximo →
                  </button>
                ) : (
                  <button
                    onClick={handleAdd}
                    disabled={!isCombo && !canAdvance()}
                    style={{
                      flex: 2,
                      background:
                        !isCombo && !canAdvance()
                          ? "var(--gray-200)"
                          : "linear-gradient(135deg, #2d1b69, #5b3fa8)",
                      color:
                        !isCombo && !canAdvance() ? "var(--gray-400)" : "white",
                      borderRadius: "var(--radius-lg)",
                      padding: "14px",
                      fontSize: "15px",
                      fontWeight: "800",
                      cursor:
                        !isCombo && !canAdvance() ? "not-allowed" : "pointer",
                    }}
                  >
                    {(() => {
                      let total = price * qty;
                      if (!isCombo) {
                        Object.keys(selections || {}).forEach((stepId) => {
                          const step = steps.find(
                            (s) => s.id === parseInt(stepId),
                          );
                          if (step) {
                            (selections[stepId] || []).forEach(
                              (selectedName) => {
                                const option = step.options.find(
                                  (o) => o.name === selectedName,
                                );
                                if (option) {
                                  total += (option.extra_price || 0) * qty;
                                }
                              },
                            );
                          }
                        });
                      }
                      return `🛒 Adicionar · R$ ${total.toFixed(2)}`;
                    })()}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
