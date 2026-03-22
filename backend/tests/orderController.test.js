import { describe, test, expect, beforeAll } from '@jest/globals';
import { createTestDb } from './testDb.js';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json   = (data)  => { res.body = data;       return res; };
  return res;
}

function mockReq(body = {}, query = {}, params = {}) {
  return { body, query, params };
}

function createOrderController(db) {
  const upsertCustomer = (customer) => {
    let cust = db.prepare('SELECT * FROM customers WHERE phone = ?').get(customer.phone);
    if (!cust) {
      const r = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(customer.name, customer.phone);
      cust = { id: r.lastInsertRowid, ...customer };
    } else {
      db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(customer.name, cust.id);
    }
    return cust;
  };

  return {
    async createOrder(req, res) {
      const { customer, items, neighborhood_id, address, address_complement, payment_method, notes } = req.body;

      if (!customer?.name || !customer?.phone)
        return res.status(400).json({ error: 'Dados do cliente inválidos' });
      if (!items?.length)
        return res.status(400).json({ error: 'Carrinho vazio' });
      if (!neighborhood_id || !address)
        return res.status(400).json({ error: 'Endereço obrigatório' });
      if (!['pix', 'card'].includes(payment_method))
        return res.status(400).json({ error: 'Pagamento inválido' });

      try {
        const tx = db.transaction(() => {
          const cust         = upsertCustomer(customer);
          const neighborhood = db.prepare('SELECT * FROM neighborhoods WHERE id = ? AND active = 1').get(neighborhood_id);
          if (!neighborhood) throw new Error('Bairro inválido');

          let subtotal = 0;
          const enrichedItems = items.map(item => {
            const product = db.prepare('SELECT * FROM products WHERE id = ? AND available = 1').get(item.product_id);
            if (!product) throw new Error(`Produto ${item.product_id} não encontrado`);
            const price   = product.promo_price || product.price;
            subtotal     += price * item.quantity;
            return { ...item, product, unit_price: price };
          });

          const total   = subtotal + neighborhood.delivery_fee;
          const result  = db.prepare(`
            INSERT INTO orders (customer_id, neighborhood_id, address, address_complement, payment_method, subtotal, delivery_fee, total, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(cust.id, neighborhood_id, address, address_complement || null, payment_method, subtotal, neighborhood.delivery_fee, total, notes || null);

          const orderId = result.lastInsertRowid;
          enrichedItems.forEach(item => {
            db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)').run(orderId, item.product_id, item.quantity, item.unit_price);
          });

          return { orderId, neighborhood, subtotal, total, deliveryFee: neighborhood.delivery_fee };
        });

        const { orderId, neighborhood, total, deliveryFee } = tx();
        res.status(201).json({
          success: true, order_id: orderId,
          order_number: String(orderId).padStart(4, '0'),
          total, delivery_fee: deliveryFee, payment_method,
          estimated_time: `${neighborhood.min_time}–${neighborhood.max_time} min`,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    listOrders(req, res) {
      const { status, date, page = 1 } = req.query;
      const limit = 20, offset = (Number(page) - 1) * limit;
      let where = '1=1';
      const params = [];
      if (status) { where += ' AND o.status = ?';           params.push(status); }
      if (date)   { where += ' AND DATE(o.created_at) = ?'; params.push(date); }
      const orders = db.prepare(`
        SELECT o.*, c.name as customer_name, n.name as neighborhood_name
        FROM orders o JOIN customers c ON c.id = o.customer_id
        JOIN neighborhoods n ON n.id = o.neighborhood_id
        WHERE ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
      `).all(...params, limit, offset);
      const total = db.prepare(`SELECT COUNT(*) as c FROM orders o WHERE ${where}`).get(...params).c;
      res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
    },

    getOrder(req, res) {
      const order = db.prepare(`
        SELECT o.*, c.name as customer_name, n.name as neighborhood_name
        FROM orders o JOIN customers c ON c.id = o.customer_id
        JOIN neighborhoods n ON n.id = o.neighborhood_id
        WHERE o.id = ?
      `).get(req.params.id);
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
      const items = db.prepare('SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?').all(order.id);
      res.json({ ...order, items });
    },

    updateStatus(req, res) {
      const { status } = req.body;
      const valid = ['pending','confirmed','preparing','delivering','delivered','cancelled'];
      if (!valid.includes(status)) return res.status(400).json({ error: 'Status inválido' });
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
      res.json({ success: true, status });
    },

    getTodayStats(req, res) {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });
      const stats = db.prepare(`
        SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_revenue,
          COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count
        FROM orders WHERE DATE(created_at) = ?
      `).get(today);
      res.json(stats);
    },
  };
}

describe('orderController', () => {
  let db, controller;

  beforeAll(() => {
    db         = createTestDb();
    controller = createOrderController(db);
  });

  describe('createOrder — validações', () => {
    test('deve retornar 400 sem nome do cliente', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { phone: '84900000001' }, items: [{ product_id: 1, quantity: 1 }], neighborhood_id: 1, address: 'Rua A', payment_method: 'pix' }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('cliente');
    });

    test('deve retornar 400 com carrinho vazio', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'João', phone: '84900000002' }, items: [], neighborhood_id: 1, address: 'Rua A', payment_method: 'pix' }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('vazio');
    });

    test('deve retornar 400 sem endereço', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'João', phone: '84900000003' }, items: [{ product_id: 1, quantity: 1 }], neighborhood_id: 1, payment_method: 'pix' }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Endereço');
    });

    test('deve retornar 400 com pagamento inválido', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'João', phone: '84900000004' }, items: [{ product_id: 1, quantity: 1 }], neighborhood_id: 1, address: 'Rua A', payment_method: 'bitcoin' }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Pagamento');
    });
  });

  describe('createOrder — sucesso', () => {
    test('deve criar pedido PIX e retornar 201', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'Maria', phone: '84911111111' }, items: [{ product_id: 1, quantity: 1 }], neighborhood_id: 1, address: 'Rua das Flores, 10', payment_method: 'pix' }), res);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order_id).toBeTruthy();
      expect(res.body.payment_method).toBe('pix');
    });

    test('deve calcular total corretamente (subtotal + frete)', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'Carlos', phone: '84922222222' }, items: [{ product_id: 1, quantity: 2 }], neighborhood_id: 1, address: 'Rua B', payment_method: 'card' }), res);
      expect(res.body.total).toBe(29.00);        // 2x12 + frete 5
      expect(res.body.delivery_fee).toBe(5.00);
    });

    test('deve usar promo_price quando disponível', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'Ana', phone: '84933333333' }, items: [{ product_id: 2, quantity: 1 }], neighborhood_id: 1, address: 'Rua C', payment_method: 'pix' }), res);
      expect(res.body.total).toBe(20.00);        // promo 15 + frete 5
    });

    test('deve retornar estimated_time', async () => {
      const res = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'Pedro', phone: '84944444444' }, items: [{ product_id: 1, quantity: 1 }], neighborhood_id: 1, address: 'Rua D', payment_method: 'pix' }), res);
      expect(res.body.estimated_time).toBeTruthy();
    });
  });

  describe('listOrders', () => {
    test('deve retornar lista paginada', () => {
      const res = mockRes();
      controller.listOrders(mockReq({}, { page: '1' }), res);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(res.body.page).toBe(1);
    });

    test('deve filtrar por status pending', () => {
      const res = mockRes();
      controller.listOrders(mockReq({}, { status: 'pending' }), res);
      res.body.orders.forEach(o => expect(o.status).toBe('pending'));
    });
  });

  describe('getOrder', () => {
    test('deve retornar 404 para pedido inexistente', () => {
      const res = mockRes();
      controller.getOrder(mockReq({}, {}, { id: '9999' }), res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('updateStatus', () => {
    test('deve retornar 400 para status inválido', () => {
      const res = mockRes();
      controller.updateStatus(mockReq({ status: 'voando' }, {}, { id: '1' }), res);
      expect(res.statusCode).toBe(400);
    });

    test('deve atualizar status com sucesso', async () => {
      const createRes = mockRes();
      await controller.createOrder(mockReq({ customer: { name: 'Status Test', phone: '84900000005' }, items: [{ product_id: 1, quantity: 1 }], neighborhood_id: 1, address: 'Rua Z', payment_method: 'pix' }), createRes);
      const orderId = createRes.body.order_id;

      const res = mockRes();
      controller.updateStatus(mockReq({ status: 'confirmed' }, {}, { id: String(orderId) }), res);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('confirmed');
    });
  });

  describe('getTodayStats', () => {
    test('deve retornar estatísticas com total_orders e total_revenue', () => {
      const res = mockRes();
      controller.getTodayStats(mockReq(), res);
      expect(typeof res.body.total_orders).toBe('number');
      expect(typeof res.body.total_revenue).toBe('number');
    });
  });
});
