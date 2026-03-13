import { Router } from "express";
import db from "../db/database.js";
import { getWhatsAppLinks } from "../services/whatsapp.js";

const router = Router();

// POST /api/orders - Criar pedido no aplicativo
router.post("/", async (req, res) => {
  const {
    customer,
    items,
    neighborhood_id,
    address,
    address_complement,
    payment_method,
    notes,
  } = req.body;

  if (!customer?.name || !customer?.phone)
    return res.status(400).json({ error: "Dados do cliente inválidos" });
  if (!items?.length) return res.status(400).json({ error: "Carrinho vazio" });
  if (!neighborhood_id || !address)
    return res.status(400).json({ error: "Endereço obrigatório" });
  if (!["pix", "card"].includes(payment_method))
    return res.status(400).json({ error: "Pagamento inválido" });

  const createOrder = db.transaction(() => {
    // Upsert cliente
    let cust = db
      .prepare("SELECT * FROM customers WHERE phone = ?")
      .get(customer.phone);
    if (!cust) {
      const result = db
        .prepare("INSERT INTO customers (name, phone) VALUES (?, ?)")
        .run(customer.name, customer.phone);
      cust = { id: result.lastInsertRowid, ...customer };
    } else {
      db.prepare("UPDATE customers SET name = ? WHERE id = ?").run(
        customer.name,
        cust.id,
      );
    }

    // Buscar bairro
    const neighborhood = db
      .prepare("SELECT * FROM neighborhoods WHERE id = ? AND active = 1")
      .get(neighborhood_id);
    if (!neighborhood) throw new Error("Bairro inválido");

    // Calcular subtotal
    let subtotal = 0;
    const enrichedItems = items.map((item) => {
      const product = db
        .prepare("SELECT * FROM products WHERE id = ? AND available = 1")
        .get(item.product_id);
      if (!product)
        throw new Error(`Produto ${item.product_id} não encontrado`);
      const price = product.promo_price || product.price;
      subtotal += price * item.quantity;
      return { ...item, product, unit_price: price };
    });

    const total = subtotal + neighborhood.delivery_fee;

    // Criar pedido
    const orderResult = db
      .prepare(
        `
      INSERT INTO orders (customer_id, neighborhood_id, address, address_complement, payment_method, subtotal, delivery_fee, total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        cust.id,
        neighborhood_id,
        address,
        address_complement || null,
        payment_method,
        subtotal,
        neighborhood.delivery_fee,
        total,
        notes || null,
      );

    const orderId = orderResult.lastInsertRowid;

    // Inserir itens
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, toppings, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    enrichedItems.forEach((item) => {
      insertItem.run(
        orderId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.toppings ? JSON.stringify(item.toppings) : null,
        item.notes || null,
      );
    });

    return {
      orderId,
      cust,
      neighborhood,
      enrichedItems,
      subtotal,
      total,
      delivery_fee: neighborhood.delivery_fee,
    };
  });

  try {
    const {
      orderId,
      cust,
      neighborhood,
      enrichedItems,
      subtotal,
      total,
      delivery_fee,
    } = createOrder();
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    const settings = Object.fromEntries(
      db
        .prepare("SELECT key, value FROM store_settings")
        .all()
        .map((s) => [s.key, s.value]),
    );

    const itemsForWA = enrichedItems.map((item) => ({
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      toppings: item.toppings?.join(", "),
      notes: item.notes,
    }));

    // Gerar links WhatsApp
    const waLinks = getWhatsAppLinks({
      order,
      customer: cust,
      items: itemsForWA,
      neighborhood,
      settings,
    });

    res.status(201).json({
      success: true,
      order_id: orderId,
      order_number: String(orderId).padStart(4, "0"),
      total,
      delivery_fee,
      payment_method,
      pix_key: payment_method === "pix" ? settings.pix_key : null,
      pix_name: payment_method === "pix" ? settings.pix_name : null,
      estimated_time: `${neighborhood.min_time}–${neighborhood.max_time} min`,
      whatsapp_owner_link: waLinks.ownerLink,
      whatsapp_customer_link: waLinks.customerLink,
    });
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

// GET /api/orders - Admin: listar pedidos
router.get("/", (req, res) => {
  const { status, date, page = 1 } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = "1=1";
  const params = [];

  if (status) {
    where += " AND o.status = ?";
    params.push(status);
  }
  if (date) {
    where += " AND DATE(o.created_at) = ?";
    params.push(date);
  }

  const orders = db
    .prepare(
      `
    SELECT o.*, c.name as customer_name, c.phone as customer_phone,
           n.name as neighborhood_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN neighborhoods n ON n.id = o.neighborhood_id
    WHERE ${where}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `,
    )
    .all(...params, limit, offset);

  const total = db
    .prepare(`SELECT COUNT(*) as c FROM orders o WHERE ${where}`)
    .get(...params).c;

  res.json({
    orders,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = db
    .prepare(
      `
    SELECT o.*, c.name as customer_name, c.phone as customer_phone,
           n.name as neighborhood_name, n.min_time, n.max_time
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN neighborhoods n ON n.id = o.neighborhood_id
    WHERE o.id = ?
  `,
    )
    .get(req.params.id);

  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

  const items = db
    .prepare(
      `
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `,
    )
    .all(order.id);

  res.json({ ...order, items });
});

// PATCH /api/orders/:id/status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    "pending",
    "confirmed",
    "preparing",
    "delivering",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: "Status inválido" });

  db.prepare(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).run(status, req.params.id);
  res.json({ success: true, status });
});

// GET /api/orders/stats/today - Dashboard
router.get("/stats/today", (req, res) => {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Fortaleza",
  });

  const stats = db
    .prepare(
      `
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN payment_method='pix' THEN total ELSE 0 END), 0) as pix_revenue,
      COALESCE(SUM(CASE WHEN payment_method='card' THEN total ELSE 0 END), 0) as card_revenue,
      COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status='delivering' THEN 1 END) as delivering_count
    FROM orders
    WHERE DATE(created_at) = ?
  `,
    )
    .get(today);

  res.json(stats);
});

export default router;
