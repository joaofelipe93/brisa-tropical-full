import db from '../db/database.js';

export const orderRepository = {

  findCustomerByPhone(phone) {
    return db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  },

  createCustomer(name, phone) {
    const result = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name, phone);
    return { id: result.lastInsertRowid, name, phone };
  },

  updateCustomerName(id, name) {
    db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name, id);
  },

  createOrder({ customerId, neighborhoodId, address, addressComplement, paymentMethod, subtotal, deliveryFee, total, notes }) {
    const result = db.prepare(`
      INSERT INTO orders (customer_id, neighborhood_id, address, address_complement, payment_method, subtotal, delivery_fee, total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, neighborhoodId, address, addressComplement || null, paymentMethod, subtotal, deliveryFee, total, notes || null);
    return result.lastInsertRowid;
  },

  createOrderItem({ orderId, productId, quantity, unitPrice, toppings, notes }) {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, toppings, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, productId, quantity, unitPrice, toppings ? JSON.stringify(toppings) : null, notes || null);
  },

  findOrderById(id) {
    return db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
             n.name as neighborhood_name, n.min_time, n.max_time
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN neighborhoods n ON n.id = o.neighborhood_id
      WHERE o.id = ?
    `).get(id);
  },

  findOrderItems(orderId) {
    return db.prepare(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(orderId);
  },

  findAllOrders({ status, date, page = 1 }) {
    const limit  = 20;
    const offset = (page - 1) * limit;
    let where    = '1=1';
    const params = [];

    if (status) { where += ' AND o.status = ?';        params.push(status); }
    if (date)   { where += ' AND DATE(o.created_at) = ?'; params.push(date); }

    const orders = db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
             n.name as neighborhood_name
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN neighborhoods n ON n.id = o.neighborhood_id
      WHERE ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as c FROM orders o WHERE ${where}`).get(...params).c;

    return { orders, total, page: Number(page), pages: Math.ceil(total / limit) };
  },

  updateOrderStatus(id, status) {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  },

  findTodayStats() {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });
    return db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_method='pix'  THEN total ELSE 0 END), 0) as pix_revenue,
        COALESCE(SUM(CASE WHEN payment_method='card' THEN total ELSE 0 END), 0) as card_revenue,
        COUNT(CASE WHEN status='pending'    THEN 1 END) as pending_count,
        COUNT(CASE WHEN status='delivering' THEN 1 END) as delivering_count
      FROM orders
      WHERE DATE(created_at) = ?
    `).get(today);
  },

  findAllSettings() {
    return db.prepare('SELECT key, value FROM store_settings').all();
  },
};
