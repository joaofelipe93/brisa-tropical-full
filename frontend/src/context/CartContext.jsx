import { createContext, useContext, useReducer } from "react";

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) =>
          i.product.id === action.item.product.id &&
          JSON.stringify(i.toppings) === JSON.stringify(action.item.toppings),
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i === existing
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i,
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((_, i) => i !== action.index),
      };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items
          .map((item, i) =>
            i === action.index ? { ...item, quantity: action.qty } : item,
          )
          .filter((item) => item.quantity > 0),
      };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.promo_price || item.product.price;
    let itemTotal = price * item.quantity;

    // Adicionar preços dos toppings
    if (item.toppings && Array.isArray(item.toppings)) {
      item.toppings.forEach((topping) => {
        if (typeof topping === "object" && topping.price) {
          itemTotal += topping.price * item.quantity;
        }
      });
    }

    return sum + itemTotal;
  }, 0);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = (product, quantity = 1, toppings = [], notes = "") => {
    const price = product.promo_price || product.price;
    dispatch({
      type: "ADD_ITEM",
      item: { product, quantity, toppings, notes, unit_price: price },
    });
  };

  const removeItem = (index) => dispatch({ type: "REMOVE_ITEM", index });
  const updateQty = (index, qty) =>
    dispatch({ type: "UPDATE_QTY", index, qty });
  const clearCart = () => dispatch({ type: "CLEAR" });

  return (
    <CartContext.Provider
      value={{
        cart,
        subtotal,
        totalItems,
        addItem,
        removeItem,
        updateQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
